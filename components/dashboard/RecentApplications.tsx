import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';

type ApplicationStatus = 'draft' | 'queued' | 'sent' | 'replied' | 'interview' | 'offer' | 'rejected' | 'bounced' | 'error';

const statusConfig: Record<ApplicationStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info' }> = {
  draft: { label: 'Draft', variant: 'outline' },
  queued: { label: 'Queued', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'info' },
  replied: { label: 'Replied', variant: 'success' },
  interview: { label: 'Interview', variant: 'success' },
  offer: { label: 'Offer! 🎉', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  bounced: { label: 'Bounced', variant: 'warning' },
  error: { label: 'Error', variant: 'destructive' },
};

interface Application {
  id: string;
  status: string;
  emailTo: string | null;
  sentAt: Date | null;
  updatedAt: Date;
  job: {
    id: string;
    title: string;
    company: string;
  };
  resume: { name: string } | null;
}

export default function RecentApplications({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No applications yet.</p>
            <p className="text-xs mt-1">
              <Link href="/apply" className="text-primary hover:underline">
                Start your first application
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Recent Applications</CardTitle>
        <Link href="/pipeline" className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ExternalLink className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {applications.map((app) => {
          const status = (statusConfig[app.status as ApplicationStatus] ?? statusConfig.draft);
          return (
            <div key={app.id} className="flex items-center justify-between gap-3 py-1">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{app.job.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {app.job.company} &bull; {formatRelativeTime(app.updatedAt)}
                </p>
              </div>
              <Badge variant={status.variant} className="shrink-0">
                {status.label}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
