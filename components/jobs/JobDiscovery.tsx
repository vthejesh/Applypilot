'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, Briefcase, MapPin, Clock, ExternalLink, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime, joinList } from '@/lib/utils';

interface JobListing {
  sourceJobId: string;
  source: string;
  title: string;
  company: string;
  location: string | null;
  workMode: string | null;
  jobType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  requiredSkills: string[];
  applyLink: string | null;
  recruiterEmail: string | null;
  postedAt: string | null;
  matchScore: number;
}

export default function JobDiscovery() {
  const [filters, setFilters] = useState({
    role: '',
    location: '',
    workMode: '',
    postedWithin: '7',
  });
  const [searchActive, setSearchActive] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        role: filters.role,
        location: filters.location,
        ...(filters.workMode ? { workMode: filters.workMode } : {}),
        postedWithin: filters.postedWithin,
        pageSize: '20',
      });
      const res = await fetch(`/api/jobs?${params}`);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json() as Promise<{ jobs: JobListing[]; total: number }>;
    },
    enabled: searchActive,
  });

  function handleSearch() {
    setSearchActive(true);
    refetch();
  }

  function getScoreBadgeVariant(score: number): 'success' | 'warning' | 'destructive' {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'destructive';
  }

  return (
    <div className="space-y-4">
      {/* Search filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Role (e.g. Frontend Developer)"
                value={filters.role}
                onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Location or Remote"
                value={filters.location}
                onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <Select
              value={filters.workMode}
              onValueChange={(v) => setFilters((f) => ({ ...f, workMode: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Work Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleSearch} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Searching...</>
              ) : (
                <><Search className="h-4 w-4" /> Search Jobs</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && searchActive && data && (
        <>
          <p className="text-sm text-muted-foreground">
            Found {data.total} jobs, ranked by match score
          </p>

          <div className="space-y-3">
            {data.jobs.map((job) => (
              <Card key={job.sourceJobId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold line-clamp-1">{job.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {job.company}
                            {job.location && ` • ${job.location}`}
                          </p>
                        </div>
                        <Badge variant={getScoreBadgeVariant(job.matchScore)} className="shrink-0">
                          {job.matchScore}% match
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {job.workMode && (
                          <Badge variant="secondary" className="text-xs">
                            {job.workMode}
                          </Badge>
                        )}
                        {job.jobType && (
                          <Badge variant="outline" className="text-xs">
                            {job.jobType}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs capitalize">
                          {job.source}
                        </Badge>
                      </div>

                      {job.requiredSkills.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Skills: {joinList(job.requiredSkills, 5)}
                        </p>
                      )}

                      {job.postedAt && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(new Date(job.postedAt))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      {job.recruiterEmail ? (
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            window.location.href = `/apply?email=${encodeURIComponent(job.recruiterEmail!.toString())}&title=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`;
                          }}
                        >
                          <Send className="h-3 w-3" />
                          Apply
                        </Button>
                      ) : job.applyLink ? (
                        <Button size="sm" variant="outline" asChild>
                          <a href={job.applyLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Apply
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {!isLoading && !searchActive && (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Ready to discover jobs</p>
          <p className="text-xs text-muted-foreground mt-1">
            Enter a role and click Search to find fresh opportunities ranked for you.
          </p>
        </div>
      )}
    </div>
  );
}
