import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendDigestEmail } from '@/lib/email/resend';

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      where: { email: { not: null } },
      include: {
        jobs: {
          where: { status: 'discovered', matchScore: { gte: 70 } },
          orderBy: { matchScore: 'desc' },
          take: 5,
        },
      },
    });

    let sentCount = 0;

    for (const user of users) {
      if (!user.email || user.jobs.length === 0) continue;

      try {
        await sendDigestEmail(
          user.email,
          user.jobs.map((j) => ({
            title: j.title,
            company: j.company,
            matchScore: j.matchScore ?? 75,
            link: j.applyLink || 'https://applypilot.vercel.app/jobs',
          }))
        );
        sentCount++;
      } catch (e) {
        console.warn(`Failed to send digest to ${user.email}:`, e);
      }
    }

    return NextResponse.json({ success: true, sentCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cron digest failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
