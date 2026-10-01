import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { validateFile, checkMagicBytes } from '@/lib/security/validateFile';
import { callAiJson } from '@/lib/ai/parseJson';
import { buildResumeParsePrompt, RESUME_SYSTEM_PROMPT, buildAtsScorePrompt } from '@/lib/ai/prompts/resume';
import { z } from 'zod';

const ResumeDataSchema = z.object({
  name: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().default(''),
  linkedin: z.string().nullable().default(null),
  github: z.string().nullable().default(null),
  portfolio: z.string().nullable().default(null),
  location: z.string().default(''),
  summary: z.string().default(''),
  skills: z.array(z.string()).default([]),
  skillCategories: z.record(z.array(z.string())).default({}),
  experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      location: z.string().optional(),
      bullets: z.array(z.string()).default([]),
    })
  ).default([]),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      technologies: z.array(z.string()).default([]),
      link: z.string().nullable().optional(),
    })
  ).default([]),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      year: z.string().optional(),
      gpa: z.string().nullable().optional(),
    })
  ).default([]),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
});

const AtsScoreSchema = z.object({
  score: z.number(),
  breakdown: z.record(z.number()),
  maxBreakdown: z.record(z.number()),
  issues: z.array(
    z.object({
      severity: z.string(),
      field: z.string(),
      message: z.string(),
      fix: z.string(),
    })
  ),
  missingKeywords: z.array(z.string()).default([]),
  presentKeywords: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;
    const roleTag = formData.get('roleTag') as string | null;

    if (!file || !name || !roleTag) {
      return NextResponse.json({ error: 'File, name, and roleTag are required' }, { status: 400 });
    }

    const validation = validateFile(
      { size: file.size, type: file.type, name: file.name },
      'resume'
    );
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedType = checkMagicBytes(buffer) ?? file.type;

    // Extract text
    let parsedText = '';
    if (detectedType === 'application/pdf' || file.type === 'application/pdf') {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(buffer);
      parsedText = pdfData.text;
    } else {
      const mammoth = await import('mammoth');
      const docxResult = await mammoth.extractRawText({ buffer });
      parsedText = docxResult.value;
    }

    // Upload file to Vercel Blob or fallback URL
    let fileUrl = '';
    try {
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(`resumes/${userId}/${Date.now()}-${file.name}`, buffer, {
          access: 'public',
          contentType: detectedType,
        });
        fileUrl = blob.url;
      } else {
        fileUrl = `data:${detectedType};base64,${buffer.toString('base64').slice(0, 100)}...`;
      }
    } catch {
      fileUrl = `/uploads/local-${file.name}`;
    }

    // Parse structured data using AI
    const parsePrompt = buildResumeParsePrompt(parsedText);
    const { data: parsedData } = await callAiJson(ResumeDataSchema, parsePrompt, {
      systemPrompt: RESUME_SYSTEM_PROMPT,
    });

    // Score ATS
    const atsPrompt = buildAtsScorePrompt(parsedText);
    let atsScore = 80;
    let atsFeedback = null;
    try {
      const { data: atsData } = await callAiJson(AtsScoreSchema, atsPrompt, {
        systemPrompt: RESUME_SYSTEM_PROMPT,
      });
      atsScore = atsData.score;
      atsFeedback = atsData.issues;
    } catch {
      // fallback
    }

    // Save to database
    const resume = await prisma.resume.create({
      data: {
        userId,
        name,
        roleTag,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: detectedType,
        parsedText,
        parsedData: parsedData as object,
        atsScore,
        atsFeedback: atsFeedback as object,
      },
    });

    // Also update Profile skills if profile has no skills yet
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile && (!profile.skills || profile.skills.length === 0)) {
      await prisma.profile.update({
        where: { userId },
        data: {
          skills: parsedData.skills,
          fullName: profile.fullName || parsedData.name || undefined,
          phone: profile.phone || parsedData.phone || undefined,
          linkedinUrl: profile.linkedinUrl || parsedData.linkedin || undefined,
          githubUrl: profile.githubUrl || parsedData.github || undefined,
          portfolioUrl: profile.portfolioUrl || parsedData.portfolio || undefined,
        },
      });
    }

    return NextResponse.json({ success: true, resume });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Resume upload failed';
    console.error('Resume upload error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
