import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { rateLimit } from '@/lib/security/rateLimit';
import { prisma } from '@/lib/db/prisma';
import { discoverJobs, scoreJobForUser } from '@/lib/jobs';

const limiter = rateLimit({ max: 20, windowMs: 60000 });

const FilterSchema = z.object({
  role: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  location: z.string().optional(),
  workMode: z.enum(['remote', 'hybrid', 'onsite']).optional().nullable(),
  experienceLevel: z.string().optional().nullable(),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
  jobType: z.string().optional().nullable(),
  postedWithin: z.union([z.literal(1), z.literal(3), z.literal(7), z.literal(30)]).optional(),
  sources: z.array(z.string()).optional(),
  page: z.number().default(1),
  pageSize: z.number().max(50).default(20),
});

export async function GET(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  try {
    const session = await requireSession();
    const userId = session.user.id;

    const searchParams = req.nextUrl.searchParams;
    const filters = FilterSchema.parse({
      role: searchParams.get('role') ?? undefined,
      location: searchParams.get('location') ?? undefined,
      workMode: searchParams.get('workMode') ?? undefined,
      experienceLevel: searchParams.get('experienceLevel') ?? undefined,
      jobType: searchParams.get('jobType') ?? undefined,
      postedWithin: searchParams.get('postedWithin') ? parseInt(searchParams.get('postedWithin')!) : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20,
    });

    // Fetch user profile for scoring
    const profile = await prisma.profile.findUnique({ where: { userId } });
    const userSkills = profile?.skills ?? [];
    const targetRoles = profile?.targetRoles ?? [];

    // Fetch from all job sources
    const rawJobs = await discoverJobs(filters, filters.sources);

    // Score each job
    const scoredJobs = rawJobs.map((job) => ({
      ...job,
      matchScore: scoreJobForUser(job, userSkills, targetRoles),
    }));

    // Sort by match score
    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    // Paginate
    const start = (filters.page - 1) * filters.pageSize;
    const paginated = scoredJobs.slice(start, start + filters.pageSize);

    // Save to DB (upsert by sourceJobId)
    const savedJobs = [];
    for (const job of paginated.slice(0, 10)) { // Save top 10 to DB
      try {
        const existing = await prisma.job.findFirst({
          where: { userId, source: job.source, sourceJobId: job.sourceJobId },
        });
        if (!existing) {
          const saved = await prisma.job.create({
            data: {
              userId,
              title: job.title,
              company: job.company,
              location: job.location,
              workMode: job.workMode,
              jobType: job.jobType,
              experienceLevel: job.experienceLevel,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              description: job.description,
              requiredSkills: job.requiredSkills,
              applyLink: job.applyLink,
              recruiterEmail: job.recruiterEmail,
              source: job.source,
              sourceJobId: job.sourceJobId,
              postedAt: job.postedAt,
              deadline: job.deadline,
              matchScore: job.matchScore,
              status: 'discovered',
            },
          });
          savedJobs.push(saved);
        }
      } catch (e) {
        console.warn('Failed to save job:', e);
      }
    }

    return NextResponse.json({
      jobs: paginated,
      total: scoredJobs.length,
      page: filters.page,
      pageSize: filters.pageSize,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Jobs fetch failed';
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Jobs API error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
