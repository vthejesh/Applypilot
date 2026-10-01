import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

const ProfileUpdateSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  bio: z.string().optional(),
  targetRoles: z.array(z.string()).optional(),
  targetLocations: z.array(z.string()).optional(),
  preferRemote: z.boolean().optional(),
  preferHybrid: z.boolean().optional(),
  experienceLevel: z.string().optional(),
  skills: z.array(z.string()).optional(),
  dailySendLimit: z.number().min(1).max(25).optional(),
  followupDays: z.number().min(1).max(30).optional(),
  emailSignature: z.string().optional(),
  preferredTone: z.string().optional(),
  onboardingDone: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    return NextResponse.json({ profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const body = await req.json();
    const data = ProfileUpdateSchema.parse(body);

    const profile = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: {
        ...data,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
