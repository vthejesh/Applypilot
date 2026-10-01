import type { JobListing, JobSearchFilters, JobSourcePlugin } from './types';

const BASE_URL = 'https://remotive.com/api/remote-jobs';

function extractSkills(description: string): string[] {
  const common = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#',
    'React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Django', 'Flask', 'Spring',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
    'GraphQL', 'REST', 'Git', 'Linux', 'Terraform',
  ];
  return common.filter((s) => description.toLowerCase().includes(s.toLowerCase()));
}

export const RemotivePlugin: JobSourcePlugin = {
  name: 'remotive',

  async fetchJobs(filters: JobSearchFilters): Promise<JobListing[]> {
    const params = new URLSearchParams();
    if (filters.role) params.set('search', filters.role);
    if (filters.keywords?.length) params.set('search', filters.keywords.join(' '));

    const url = `${BASE_URL}?${params.toString()}`;

    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) return [];

      const data = (await res.json()) as {
        jobs: Array<{
          id: number;
          url: string;
          title: string;
          company_name: string;
          company_logo?: string;
          category: string;
          tags: string[];
          job_type: string;
          publication_date: string;
          candidate_required_location: string;
          salary: string;
          description: string;
        }>;
      };

      const cutoff = filters.postedWithin
        ? new Date(Date.now() - filters.postedWithin * 24 * 60 * 60 * 1000)
        : null;

      return (data.jobs ?? [])
        .filter((job) => {
          if (cutoff && new Date(job.publication_date) < cutoff) return false;
          if (
            filters.workMode &&
            filters.workMode !== 'remote'
          ) return false; // Remotive is all remote
          return true;
        })
        .map((job) => ({
          sourceJobId: `remotive-${job.id}`,
          source: 'remotive',
          title: job.title,
          company: job.company_name,
          location: job.candidate_required_location || 'Remote',
          workMode: 'remote' as const,
          jobType: job.job_type?.toLowerCase().includes('full') ? 'full-time' as const : null,
          experienceLevel: null,
          salaryMin: null,
          salaryMax: null,
          salaryCurrency: 'USD',
          description: job.description.replace(/<[^>]+>/g, '').slice(0, 2000),
          requiredSkills: [...job.tags, ...extractSkills(job.description)],
          applyLink: job.url,
          recruiterEmail: null,
          postedAt: new Date(job.publication_date),
          deadline: null,
        }));
    } catch (err) {
      console.error('Remotive fetch error:', err);
      return [];
    }
  },
};
