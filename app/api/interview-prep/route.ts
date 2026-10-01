import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { callAiJson } from '@/lib/ai/parseJson';
import { prisma } from '@/lib/db/prisma';

const RequestSchema = z.object({
  jobTitle: z.string(),
  company: z.string(),
  jobDescription: z.string().optional(),
  requiredSkills: z.array(z.string()).default([]),
});

const InterviewPrepSchema = z.object({
  companyOverview: z.string(),
  technicalQuestions: z.array(
    z.object({
      question: z.string(),
      topic: z.string(),
      sampleAnswerTips: z.string(),
    })
  ),
  behavioralQuestions: z.array(
    z.object({
      question: z.string(),
      framework: z.string(),
      sampleAnswerTips: z.string(),
    })
  ),
  questionsToAskInterviewer: z.array(z.string()),
  salaryNegotiationTip: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const body = await req.json();
    const { jobTitle, company, jobDescription, requiredSkills } = RequestSchema.parse(body);

    const profile = await prisma.profile.findUnique({ where: { userId } });
    const userSkills = profile?.skills ?? [];

    const prompt = `Generate comprehensive interview preparation material for this role:

Role: ${jobTitle}
Company: ${company}
Skills Required: ${requiredSkills.join(', ')}
${jobDescription ? `Job Description Excerpt: ${jobDescription.slice(0, 1000)}` : ''}
Applicant Skills: ${userSkills.join(', ')}

Return a JSON matching the requested structure with 5 technical questions, 4 behavioral questions (STAR method based), 3 insightful questions to ask the interviewer, company overview insights, and a concise salary tip.`;

    const { data } = await callAiJson(InterviewPrepSchema, prompt, {
      systemPrompt: 'You are an elite tech career coach and interview prep expert. Return valid JSON only.',
    });

    return NextResponse.json({ prep: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate interview prep';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
