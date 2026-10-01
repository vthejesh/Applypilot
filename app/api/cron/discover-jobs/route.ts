import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { discoverJobs, scoreJobForUser } from '@/lib/jobs';

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      include: { profile: true },
    });

    let newJobsCount = 0;

    for (const user of users) {
      if (!user.profile?.targetRoles?.length) continue;

      const filters = {
        role: user.profile.targetRoles[0],
        workMode: user.profile.preferRemote ? ('remote' as const) : null,
        postedWithin: 1 as const,
      };

      const jobs = await discoverJobs(filters);

      for (const job of jobs.slice(0, 5)) {
        const score = scoreJobForUser(
          job,
          user.profile.skills || [],
          user.profile.targetRoles || []
        );

        if (score >= 60) {
          const existing = await prisma.job.findFirst({
            where: { userId: user.id, sourceJobId: job.sourceJobId },
          });

          if (!existing) {
            await prisma.job.create({
              data: {
                userId: user.id,
                title: job.title,
                company: job.company,
                location: job.location,
                workMode: job.workMode,
                jobType: job.jobType,
                requiredSkills: job.requiredSkills,
                applyLink: job.applyLink,
                recruiterEmail: job.recruiterEmail,
                source: job.source,
                sourceJobId: job.sourceJobId,
                postedAt: job.postedAt,
                matchScore: score,
                status: 'discovered',
              },
            });
            newJobsCount++;
          }
        }
      }
    }

    return NextResponse.json({ success: true, newJobsCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cron discover jobs failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
