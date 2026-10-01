import type { JobListing, JobSearchFilters, JobSourcePlugin } from './types';

const BASE_URL = 'https://api.adzuna.com/v1/api/jobs';

function parseWorkMode(title: string, desc: string): 'remote' | 'hybrid' | 'onsite' | null {
  const combined = (title + ' ' + desc).toLowerCase();
  if (combined.includes('remote')) return 'remote';
  if (combined.includes('hybrid')) return 'hybrid';
  if (combined.includes('onsite') || combined.includes('on-site') || combined.includes('in office')) return 'onsite';
  return null;
}

function parseJobType(contractTime: string | undefined): 'full-time' | 'part-time' | 'contract' | 'internship' | null {
  if (!contractTime) return null;
  if (contractTime.toLowerCase().includes('full')) return 'full-time';
  if (contractTime.toLowerCase().includes('part')) return 'part-time';
  if (contractTime.toLowerCase().includes('contract')) return 'contract';
  return null;
}

export const AdzunaPlugin: JobSourcePlugin = {
  name: 'adzuna',

  async fetchJobs(filters: JobSearchFilters): Promise<JobListing[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const apiKey = process.env.ADZUNA_API_KEY;
    if (!appId || !apiKey) {
      console.warn('Adzuna credentials not configured');
      return [];
    }

    const country = 'gb'; // Default to GB; can be parameterized
    const params = new URLSearchParams({
      app_id: appId,
      app_key: apiKey,
      results_per_page: '50',
      what: [filters.role, ...(filters.keywords ?? [])].filter(Boolean).join(' '),
      where: filters.location ?? '',
      sort_by: 'date',
      'content-type': 'application/json',
    });

    if (filters.salaryMin) params.set('salary_min', String(filters.salaryMin));
    if (filters.salaryMax) params.set('salary_max', String(filters.salaryMax));
    if (filters.postedWithin) params.set('max_days_old', String(filters.postedWithin));

    const url = `${BASE_URL}/${country}/search/1?${params.toString()}`;

    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) {
        console.error(`Adzuna API error: ${res.status}`);
        return [];
      }

      const data = (await res.json()) as {
        results: Array<{
          id: string;
          title: string;
          company: { display_name: string };
          location: { display_name: string };
          description: string;
          redirect_url: string;
          salary_min?: number;
          salary_max?: number;
          contract_time?: string;
          created: string;
        }>;
      };

      return (data.results ?? []).map((job) => ({
        sourceJobId: `adzuna-${job.id}`,
        source: 'adzuna',
        title: job.title,
        company: job.company.display_name,
        location: job.location.display_name,
        workMode: parseWorkMode(job.title, job.description),
        jobType: parseJobType(job.contract_time),
        experienceLevel: null,
        salaryMin: job.salary_min ?? null,
        salaryMax: job.salary_max ?? null,
        salaryCurrency: 'GBP',
        description: job.description,
        requiredSkills: [],
        applyLink: job.redirect_url,
        recruiterEmail: null,
        postedAt: job.created ? new Date(job.created) : null,
        deadline: null,
      }));
    } catch (err) {
      console.error('Adzuna fetch error:', err);
      return [];
    }
  },
};
