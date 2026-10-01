import { describe, it, expect } from 'vitest';
import { scoreJobForUser } from '@/lib/jobs';
import type { JobListing } from '@/lib/jobs/types';

describe('Job Scoring Engine', () => {
  const sampleJob: JobListing = {
    sourceJobId: 'test-1',
    source: 'remotive',
    title: 'Frontend React Developer',
    company: 'TechCorp',
    location: 'Remote',
    workMode: 'remote',
    jobType: 'full-time',
    experienceLevel: 'fresher',
    salaryMin: 60000,
    salaryMax: 80000,
    salaryCurrency: 'USD',
    description: 'We need React and TypeScript developer.',
    requiredSkills: ['React', 'TypeScript', 'Tailwind'],
    applyLink: 'https://example.com',
    recruiterEmail: 'hr@techcorp.com',
    postedAt: new Date(),
    deadline: null,
  };

  it('should score high for a matching profile', () => {
    const userSkills = ['React', 'TypeScript', 'Tailwind', 'Next.js'];
    const targetRoles = ['Frontend Developer', 'React Developer'];

    const score = scoreJobForUser(sampleJob, userSkills, targetRoles);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('should give lower score when skills do not match', () => {
    const userSkills = ['Python', 'Django', 'PostgreSQL'];
    const targetRoles = ['Backend Developer'];

    const score = scoreJobForUser(sampleJob, userSkills, targetRoles);
    expect(score).toBeLessThan(50);
  });
});
