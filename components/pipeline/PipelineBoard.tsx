'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';
import { Mail } from 'lucide-react';

type AppStatus = 'draft' | 'queued' | 'sent' | 'replied' | 'interview' | 'offer' | 'rejected';

const COLUMNS: { id: AppStatus; label: string; color: string }[] = [
  { id: 'draft', label: 'Draft', color: 'border-gray-200' },
  { id: 'sent', label: 'Applied', color: 'border-blue-200' },
  { id: 'replied', label: 'Replied', color: 'border-yellow-200' },
  { id: 'interview', label: 'Interview', color: 'border-purple-200' },
  { id: 'offer', label: 'Offer 🎉', color: 'border-green-200' },
  { id: 'rejected', label: 'Rejected', color: 'border-red-200' },
];

interface Application {
  id: string;
  status: string;
  emailTo: string | null;
  sentAt: Date | null;
  updatedAt: Date;
  matchScore: number | null;
  job: { id: string; title: string; company: string };
  resume: { name: string } | null;
}

export default function PipelineBoard({ initialApplications }: { initialApplications: Application[] }) {
  const [applications, setApplications] = useState(initialApplications);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const grouped = COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = applications.filter(
        (a) => a.status === col.id || (col.id === 'sent' && a.status === 'queued')
      );
      return acc;
    },
    {} as Record<AppStatus, Application[]>
  );

  async function moveApplication(id: string, newStatus: AppStatus) {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );

    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      toast.error('Failed to update status');
    }
  }

  function handleDragStart(id: string) {
    setDraggingId(id);
  }

  function handleDrop(colId: AppStatus) {
    if (draggingId) {
      moveApplication(draggingId, colId);
      setDraggingId(null);
    }
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="flex flex-col w-72"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.id)}
          >
            <div className={`rounded-t-lg border-t-4 ${col.color} bg-muted/30 px-3 py-2 flex items-center justify-between`}>
              <span className="text-sm font-semibold">{col.label}</span>
              <Badge variant="secondary" className="text-xs">
                {grouped[col.id]?.length ?? 0}
              </Badge>
            </div>

            <div className="flex-1 space-y-2 rounded-b-lg border border-t-0 bg-muted/10 p-2 min-h-[200px]">
              {(grouped[col.id] ?? []).map((app) => (
                <Card
                  key={app.id}
                  draggable
                  onDragStart={() => handleDragStart(app.id)}
                  className="cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-3 space-y-2">
                    <div>
                      <p className="text-sm font-semibold line-clamp-1">{app.job.title}</p>
                      <p className="text-xs text-muted-foreground">{app.job.company}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatRelativeTime(app.updatedAt)}</span>
                      {app.matchScore && (
                        <Badge variant="outline" className="text-xs">
                          {app.matchScore}% match
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {app.emailTo && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{app.emailTo}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(grouped[col.id]?.length ?? 0) === 0 && (
                <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                  No applications here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
