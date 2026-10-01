import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

const CreateApplicationSchema = z.object({
  jobData: z.object({
    jobTitle: z.string().nullable(),
    company: z.string().nullable(),
    location: z.string().nullable().optional(),
    workMode: z.string().nullable().optional(),
    jobType: z.string().nullable().optional(),
    requiredSkills: z.array(z.string()).default([]),
    recruiterEmails: z.array(z.string()).default([]),
    applyLink: z.string().nullable().optional(),
    instructions: z.string().nullable().optional(),
    rawText: z.string().nullable().optional(),
  }),
  emailTo: z.string(),
  emailSubject: z.string(),
  emailBody: z.string(),
  resumeId: z.string().nullable().optional(),
  templateId: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const body = await req.json();
    const parsed = CreateApplicationSchema.parse(body);
    const { jobData, emailTo, emailSubject, emailBody, resumeId, templateId } = parsed;

    // Create or find Job record
    const job = await prisma.job.create({
      data: {
        userId,
        title: jobData.jobTitle || 'Untitled Role',
        company: jobData.company || 'Unknown Company',
        location: jobData.location || null,
        workMode: jobData.workMode || null,
        jobType: jobData.jobType || null,
        requiredSkills: jobData.requiredSkills || [],
        recruiterEmail: emailTo,
        applyLink: jobData.applyLink || null,
        instructions: jobData.instructions || null,
        rawText: jobData.rawText || null,
        status: 'saved',
      },
    });

    // Create Application record
    const application = await prisma.application.create({
      data: {
        userId,
        jobId: job.id,
        resumeId: resumeId || null,
        templateId: templateId || null,
        status: 'draft',
        emailTo,
        emailSubject,
        emailBody,
      },
    });

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      jobId: job.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create application';
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Applications POST error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const applications = await prisma.application.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      include: {
        job: true,
        resume: { select: { id: true, name: true, roleTag: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ applications });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch applications';
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
