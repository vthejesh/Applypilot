import type { Metadata } from 'next';
import JobDiscovery from '@/components/jobs/JobDiscovery';

export const metadata: Metadata = { title: 'Discover Jobs' };

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Discover Jobs</h1>
        <p className="text-muted-foreground mt-1">
          Fresh jobs from Remotive, Arbeitnow, RemoteOK, Adzuna, and more — ranked by your profile.
        </p>
      </div>
      <JobDiscovery />
    </div>
  );
}
