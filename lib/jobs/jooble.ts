import type { JobListing, JobSearchFilters, JobSourcePlugin } from './types';

const BASE_URL = 'https://jooble.org/api';

function parseJobleSalary(salaryStr: string | undefined): { min: number | null; max: number | null } {
  if (!salaryStr) return { min: null, max: null };
  const nums = salaryStr.match(/\d+/g);
  if (!nums) return { min: null, max: null };
  if (nums.length === 1) return { min: parseInt(nums[0]), max: null };
  return { min: parseInt(nums[0]), max: parseInt(nums[1]) };
}

export const JooblePlugin: JobSourcePlugin = {
  name: 'jooble',

  async fetchJobs(filters: JobSearchFilters): Promise<JobListing[]> {
    const apiKey = process.env.JOOBLE_API_KEY;
    if (!apiKey) {
      console.warn('Jooble API key not configured');
      return [];
    }

    const body = {
      keywords: [filters.role, ...(filters.keywords ?? [])].filter(Boolean).join(' '),
      location: filters.location ?? '',
      resultsOnPage: 50,
      datePosted: filters.postedWithin ?? 7,
    };

    try {
      const res = await fetch(`${BASE_URL}/${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) return [];

      const data = (await res.json()) as {
        jobs: Array<{
          id: string;
          title: string;
          company: string;
          location: string;
          snippet: string;
          salary: string;
          source: string;
          type: string;
          updated: string;
          link: string;
        }>;
      };

      return (data.jobs ?? []).map((job) => {
        const salary = parseJobleSalary(job.salary);
        return {
          sourceJobId: `jooble-${job.id}`,
          source: 'jooble',
          title: job.title,
          company: job.company,
          location: job.location,
          workMode: job.title.toLowerCase().includes('remote') ? ('remote' as const) : null,
          jobType: job.type?.toLowerCase().includes('full') ? ('full-time' as const) : null,
          experienceLevel: null,
          salaryMin: salary.min,
          salaryMax: salary.max,
          salaryCurrency: 'USD',
          description: job.snippet,
          requiredSkills: [],
          applyLink: job.link,
          recruiterEmail: null,
          postedAt: job.updated ? new Date(job.updated) : null,
          deadline: null,
        };
      });
    } catch (err) {
      console.error('Jooble fetch error:', err);
      return [];
    }
  },
};
