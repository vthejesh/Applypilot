import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { rateLimit } from '@/lib/security/rateLimit';
import { callAiJson } from '@/lib/ai/parseJson';
import { getCachedResponse, setCachedResponse, trackUsage, estimateCost } from '@/lib/ai/cache';
import { EXTRACT_SYSTEM_PROMPT, buildExtractPrompt, buildExtractImagePrompt } from '@/lib/ai/prompts/extract';
import { buildScamDetectionPrompt, SCORING_SYSTEM_PROMPT } from '@/lib/ai/prompts/scoring';
import { verifyEmails } from '@/lib/email/verify';
import { sanitizeForPrompt, hashContent } from '@/lib/utils';
import { validateFile, checkMagicBytes } from '@/lib/security/validateFile';

const limiter = rateLimit({ max: 20, windowMs: 60000 });

// Zod schema for extracted job data
const ExtractedJobSchema = z.object({
  recruiterEmails: z.array(z.string()).default([]),
  company: z.string().nullable().default(null),
  jobTitle: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  workMode: z.enum(['remote', 'hybrid', 'onsite']).nullable().default(null),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']).nullable().default(null),
  requiredSkills: z.array(z.string()).default([]),
  niceToHaveSkills: z.array(z.string()).default([]),
  experienceLevel: z.enum(['fresher', 'junior', 'mid', 'senior']).nullable().default(null),
  experienceYears: z.string().nullable().default(null),
  salaryMin: z.number().nullable().default(null),
  salaryMax: z.number().nullable().default(null),
  salaryCurrency: z.string().default('USD'),
  salaryPeriod: z.enum(['monthly', 'annually', 'hourly']).nullable().default(null),
  deadline: z.string().nullable().default(null),
  applyLink: z.string().nullable().default(null),
  instructions: z.string().nullable().default(null),
  confidence: z.record(z.number()).default({}),
  redFlags: z.array(z.string()).default([]),
  overallConfidence: z.number().default(0.5),
});

const ScamSchema = z.object({
  isLikelyScam: z.boolean(),
  scamScore: z.number(),
  flags: z.array(
    z.object({
      flag: z.string(),
      severity: z.string(),
      found: z.boolean(),
    })
  ),
  verdict: z.enum(['safe', 'warning', 'likely_scam']),
  reason: z.string(),
});

export async function POST(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  try {
    const session = await requireSession();
    const userId = session.user.id;

    const contentType = req.headers.get('content-type') ?? '';
    let extractedText = '';
    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;
    let isImage = false;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const text = formData.get('text') as string | null;
      const file = formData.get('file') as File | null;

      if (text) {
        extractedText = sanitizeForPrompt(text);
      }

      if (file) {
        const validation = validateFile(
          { size: file.size, type: file.type, name: file.name },
          'document'
        );
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const detectedType = checkMagicBytes(buffer);

        if (file.type.startsWith('image/') || detectedType?.startsWith('image/')) {
          isImage = true;
          imageBase64 = buffer.toString('base64');
          imageMimeType = detectedType ?? file.type;
        } else if (file.type === 'application/pdf' || detectedType === 'application/pdf') {
          // Parse PDF text
          const pdfParse = (await import('pdf-parse')).default;
          const pdfData = await pdfParse(buffer);
          extractedText = sanitizeForPrompt(pdfData.text);
        } else {
          // DOCX
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ buffer });
          extractedText = sanitizeForPrompt(result.value);
        }
      }
    } else {
      const body = (await req.json()) as { text?: string };
      extractedText = sanitizeForPrompt(body.text ?? '');
    }

    if (!extractedText && !isImage) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const cacheKey = isImage ? `image-${imageBase64?.slice(0, 100)}` : extractedText;
    const hash = hashContent(cacheKey);

    // Check cache
    const cached = await getCachedResponse(cacheKey, ExtractedJobSchema);
    if (cached) {
      return NextResponse.json({ data: cached, fromCache: true });
    }

    // Call AI
    const prompt = isImage ? buildExtractImagePrompt() : buildExtractPrompt(extractedText);
    const { data, tokensUsed, model } = await callAiJson(ExtractedJobSchema, prompt, {
      systemPrompt: EXTRACT_SYSTEM_PROMPT,
      imageBase64,
      imageMimeType,
    });

    // Run scam detection in parallel
    const scamPromise = (extractedText || '').length > 50
      ? callAiJson(ScamSchema, buildScamDetectionPrompt(extractedText || ''), {
          systemPrompt: SCORING_SYSTEM_PROMPT,
        }).catch(() => ({ data: null, tokensUsed: 0, model }))
      : Promise.resolve({ data: null, tokensUsed: 0, model });

    // Verify emails in parallel
    const emailVerifyPromise = data.recruiterEmails.length > 0
      ? verifyEmails(data.recruiterEmails)
      : Promise.resolve([]);

    const [scamResult, emailVerifications] = await Promise.all([
      scamPromise,
      emailVerifyPromise,
    ]);

    // Cache the extraction result
    await setCachedResponse(cacheKey, prompt, data, model, tokensUsed);

    // Track usage
    const cost = estimateCost(tokensUsed, model);
    await trackUsage(userId, tokensUsed, cost);

    return NextResponse.json({
      data,
      scam: scamResult.data,
      emailVerifications,
      fromCache: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Extraction failed';
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Extract API error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
