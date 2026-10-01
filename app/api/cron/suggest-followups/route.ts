import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const staleApplications = await prisma.application.findMany({
      where: {
        status: 'sent',
        followupCount: { lt: 2 },
        nextFollowupAt: { lte: now },
      },
      include: { job: true, user: true },
    });

    for (const app of staleApplications) {
      await prisma.notification.create({
        data: {
          userId: app.userId,
          type: 'info',
          title: `Follow-up suggested: ${app.job.title} at ${app.job.company}`,
          body: `It's been 5 days since you sent your application. Review and send a polite follow-up.`,
          link: `/pipeline`,
        },
      });
    }

    return NextResponse.json({ success: true, count: staleApplications.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Followup cron failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
