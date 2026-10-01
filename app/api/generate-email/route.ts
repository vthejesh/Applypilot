import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { rateLimit } from '@/lib/security/rateLimit';
import { callAiJson } from '@/lib/ai/parseJson';
import { trackUsage, estimateCost } from '@/lib/ai/cache';
import { EMAIL_SYSTEM_PROMPT, buildEmailPrompt } from '@/lib/ai/prompts/email';
import { prisma } from '@/lib/db/prisma';

const limiter = rateLimit({ max: 30, windowMs: 60000 });

const RequestSchema = z.object({
  jobId: z.string().optional(),
  jobTitle: z.string(),
  company: z.string(),
  recruiterName: z.string().optional(),
  requiredSkills: z.array(z.string()).default([]),
  jobDescription: z.string().optional(),
  instructions: z.string().optional(),
  resumeId: z.string().optional(),
  style: z.enum(['formal', 'friendly', 'short', 'referral', 'career-switch']).default('friendly'),
  tone: z.enum(['professional', 'friendly', 'casual', 'enthusiastic']).default('friendly'),
  targetLength: z.enum(['short', 'medium', 'long']).default('medium'),
  customInstructions: z.string().optional(),
  referralName: z.string().optional(),
});

const EmailResponseSchema = z.object({
  subject: z.array(z.string()),
  body: z.string(),
  signature: z.string(),
  wordCount: z.number(),
  tone: z.string(),
  keyPoints: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  try {
    const session = await requireSession();
    const userId = session.user.id;

    const body = await req.json();
    const params = RequestSchema.parse(body);

    // Load user profile
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found. Please complete onboarding.' }, { status: 400 });
    }

    // Load resume data if provided
    let resumeData = {
      summary: '',
      skills: profile.skills ?? [],
      projects: '',
      experience: '',
    };

    if (params.resumeId) {
      const resume = await prisma.resume.findUnique({
        where: { id: params.resumeId, userId },
      });
      if (resume) {
        const parsed = resume.parsedData as {
          summary?: string;
          skills?: string[];
          projects?: Array<{ name: string; description: string }>;
          experience?: Array<{ company: string; title: string; bullets: string[] }>;
        };
        resumeData = {
          summary: parsed.summary ?? '',
          skills: parsed.skills ?? [],
          projects: parsed.projects?.map((p) => `${p.name}: ${p.description}`).join('; ') ?? '',
          experience: parsed.experience
            ?.map((e) => `${e.title} at ${e.company}: ${e.bullets.join(', ')}`)
            .join('; ') ?? '',
        };
      }
    }

    const isFresher = profile.experienceLevel === 'fresher';

    const emailPrompt = buildEmailPrompt({
      jobTitle: params.jobTitle,
      company: params.company,
      recruiterName: params.recruiterName,
      requiredSkills: params.requiredSkills,
      jobDescription: params.jobDescription,
      instructions: params.instructions,
      resumeSummary: resumeData.summary,
      resumeSkills: resumeData.skills,
      resumeProjects: resumeData.projects,
      resumeExperience: resumeData.experience,
      userName: profile.fullName ?? session.user.name ?? 'Applicant',
      userPhone: profile.phone ?? undefined,
      userLinkedin: profile.linkedinUrl ?? undefined,
      userGithub: profile.githubUrl ?? undefined,
      userPortfolio: profile.portfolioUrl ?? undefined,
      style: params.style,
      tone: params.tone,
      targetLength: params.targetLength,
      isFresher,
      referralName: params.referralName,
      customInstructions: params.customInstructions,
    });

    const { data, tokensUsed, model } = await callAiJson(
      EmailResponseSchema,
      emailPrompt,
      { systemPrompt: EMAIL_SYSTEM_PROMPT }
    );

    const cost = estimateCost(tokensUsed, model);
    await trackUsage(userId, tokensUsed, cost);

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Email generation failed';
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Generate email error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
