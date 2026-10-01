import type { JobListing, JobSearchFilters, JobSourcePlugin } from './types';

const BASE_URL = 'https://www.arbeitnow.com/api/job-board-api';

export const ArbeitnowPlugin: JobSourcePlugin = {
  name: 'arbeitnow',

  async fetchJobs(filters: JobSearchFilters): Promise<JobListing[]> {
    const params = new URLSearchParams();
    if (filters.role) params.set('q', filters.role);
    if (filters.location) params.set('location', filters.location);

    const url = `${BASE_URL}?${params.toString()}`;

    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) return [];

      const data = (await res.json()) as {
        data: Array<{
          slug: string;
          company_name: string;
          title: string;
          description: string;
          remote: boolean;
          url: string;
          tags: string[];
          job_types: string[];
          location: string;
          created_at: number;
        }>;
      };

      const cutoff = filters.postedWithin
        ? Date.now() / 1000 - filters.postedWithin * 24 * 60 * 60
        : null;

      return (data.data ?? [])
        .filter((job) => {
          if (cutoff && job.created_at < cutoff) return false;
          return true;
        })
        .map((job) => ({
          sourceJobId: `arbeitnow-${job.slug}`,
          source: 'arbeitnow',
          title: job.title,
          company: job.company_name,
          location: job.location || (job.remote ? 'Remote' : null),
          workMode: job.remote ? ('remote' as const) : ('onsite' as const),
          jobType: job.job_types?.[0]?.toLowerCase().includes('full') ? ('full-time' as const) : null,
          experienceLevel: null,
          salaryMin: null,
          salaryMax: null,
          salaryCurrency: 'EUR',
          description: job.description.replace(/<[^>]+>/g, '').slice(0, 2000),
          requiredSkills: job.tags ?? [],
          applyLink: job.url,
          recruiterEmail: null,
          postedAt: new Date(job.created_at * 1000),
          deadline: null,
        }));
    } catch (err) {
      console.error('Arbeitnow fetch error:', err);
      return [];
    }
  },
};
