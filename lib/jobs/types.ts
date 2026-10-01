export interface JobListing {
  sourceJobId: string;
  source: string;
  title: string;
  company: string;
  location: string | null;
  workMode: 'remote' | 'hybrid' | 'onsite' | null;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | null;
  experienceLevel: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  description: string | null;
  requiredSkills: string[];
  applyLink: string | null;
  recruiterEmail: string | null;
  postedAt: Date | null;
  deadline: Date | null;
}

export interface JobSearchFilters {
  role?: string;
  keywords?: string[];
  location?: string;
  workMode?: 'remote' | 'hybrid' | 'onsite' | null;
  experienceLevel?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  jobType?: string | null;
  postedWithin?: 1 | 3 | 7 | 30; // days
}

export interface JobSourcePlugin {
  name: string;
  fetchJobs(filters: JobSearchFilters): Promise<JobListing[]>;
}
