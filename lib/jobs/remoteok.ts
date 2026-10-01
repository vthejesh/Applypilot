import type { JobListing, JobSearchFilters, JobSourcePlugin } from './types';

const BASE_URL = 'https://remoteok.com/api';

export const RemoteOKPlugin: JobSourcePlugin = {
  name: 'remoteok',

  async fetchJobs(filters: JobSearchFilters): Promise<JobListing[]> {
    // RemoteOK only supports all-remote jobs
    if (filters.workMode && filters.workMode !== 'remote') return [];

    try {
      const res = await fetch(BASE_URL, {
        headers: { 'User-Agent': 'ApplyPilot/1.0 (job discovery app)' },
        next: { revalidate: 3600 },
      });
      if (!res.ok) return [];

      const data = (await res.json()) as Array<{
        id?: string;
        position?: string;
        company?: string;
        location?: string;
        tags?: string[];
        url?: string;
        description?: string;
        date?: string;
        salary_min?: number;
        salary_max?: number;
        legal?: boolean; // first element is legal notice
      }>;

      const cutoff = filters.postedWithin
        ? new Date(Date.now() - filters.postedWithin * 24 * 60 * 60 * 1000)
        : null;

      const keyword = (filters.role ?? '').toLowerCase();

      return data
        .filter((j) => {
          if (!j.position) return false; // skip legal notice
          if (cutoff && j.date && new Date(j.date) < cutoff) return false;
          if (keyword && !j.position.toLowerCase().includes(keyword) && !j.tags?.some(t => t.toLowerCase().includes(keyword))) return false;
          return true;
        })
        .slice(0, 50)
        .map((job) => ({
          sourceJobId: `remoteok-${job.id}`,
          source: 'remoteok',
          title: job.position ?? 'Unknown',
          company: job.company ?? 'Unknown',
          location: job.location ?? 'Remote',
          workMode: 'remote' as const,
          jobType: 'full-time' as const,
          experienceLevel: null,
          salaryMin: job.salary_min ?? null,
          salaryMax: job.salary_max ?? null,
          salaryCurrency: 'USD',
          description: job.description?.replace(/<[^>]+>/g, '').slice(0, 2000) ?? null,
          requiredSkills: job.tags ?? [],
          applyLink: job.url ?? null,
          recruiterEmail: null,
          postedAt: job.date ? new Date(job.date) : null,
          deadline: null,
        }));
    } catch (err) {
      console.error('RemoteOK fetch error:', err);
      return [];
    }
  },
};
