import { AdzunaPlugin } from './adzuna';
import { RemotivePlugin } from './remotive';
import { ArbeitnowPlugin } from './arbeitnow';
import { RemoteOKPlugin } from './remoteok';
import { JooblePlugin } from './jooble';
import type { JobListing, JobSearchFilters, JobSourcePlugin } from './types';
import { normalizeTitle } from '@/lib/utils';

// Registry of all job source plugins
const ALL_PLUGINS: JobSourcePlugin[] = [
  RemotivePlugin,
  ArbeitnowPlugin,
  RemoteOKPlugin,
  AdzunaPlugin,
  JooblePlugin,
];

/**
 * Fetches jobs from all sources in parallel, deduplicates, and returns.
 */
export async function discoverJobs(
  filters: JobSearchFilters,
  sources?: string[]
): Promise<JobListing[]> {
  const plugins = sources
    ? ALL_PLUGINS.filter((p) => sources.includes(p.name))
    : ALL_PLUGINS;

  const results = await Promise.allSettled(plugins.map((p) => p.fetchJobs(filters)));

  const allJobs: JobListing[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allJobs.push(...result.value);
    }
  }

  return deduplicateJobs(allJobs);
}

/**
 * Removes duplicate jobs based on title+company similarity and source job ID.
 */
function deduplicateJobs(jobs: JobListing[]): JobListing[] {
  const seen = new Map<string, JobListing>();

  for (const job of jobs) {
    // Dedup by source ID first
    if (seen.has(job.sourceJobId)) continue;

    // Dedup by normalized title+company
    const key = `${normalizeTitle(job.title)}::${job.company.toLowerCase().trim()}`;
    if (seen.has(key)) continue;

    seen.set(job.sourceJobId, job);
    seen.set(key, job);
  }

  // Return only unique source-ID keyed entries
  const unique = new Map<string, JobListing>();
  for (const job of jobs) {
    if (!unique.has(job.sourceJobId)) {
      const key = `${normalizeTitle(job.title)}::${job.company.toLowerCase().trim()}`;
      if (!unique.has(key)) {
        unique.set(job.sourceJobId, job);
        unique.set(key, job);
      }
    }
  }

  // Return only source-ID entries (not the key duplicates)
  const result: JobListing[] = [];
  const sourceIdSeen = new Set<string>();
  for (const job of jobs) {
    if (!sourceIdSeen.has(job.sourceJobId)) {
      const key = `${normalizeTitle(job.title)}::${job.company.toLowerCase().trim()}`;
      if (!result.some((j) => `${normalizeTitle(j.title)}::${j.company.toLowerCase().trim()}` === key)) {
        sourceIdSeen.add(job.sourceJobId);
        result.push(job);
      }
    }
  }
  return result;
}

/**
 * Scores a job against a user profile (0-100).
 */
export function scoreJobForUser(
  job: JobListing,
  userSkills: string[],
  targetRoles?: string[]
): number {
  let score = 0;

  if (!job.requiredSkills.length) {
    score += 30; // No requirements listed, assume open
  } else {
    const matched = job.requiredSkills.filter((s) =>
      userSkills.some(
        (us) => us.toLowerCase() === s.toLowerCase() || s.toLowerCase().includes(us.toLowerCase())
      )
    ).length;
    const skillScore = Math.round((matched / job.requiredSkills.length) * 60);
    score += skillScore;
  }

  // Role match
  if (targetRoles?.length) {
    const roleMatch = targetRoles.some(
      (r) =>
        job.title.toLowerCase().includes(r.toLowerCase()) ||
        r.toLowerCase().includes(job.title.toLowerCase())
    );
    if (roleMatch) score += 25;
  } else {
    score += 10; // default
  }

  // Remote preference bonus
  if (job.workMode === 'remote') score += 5;

  // Recent posting bonus
  if (job.postedAt) {
    const dayOld = (Date.now() - job.postedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (dayOld <= 1) score += 10;
    else if (dayOld <= 3) score += 5;
  }

  return Math.min(100, score);
}

export * from './types';
export { ALL_PLUGINS };
