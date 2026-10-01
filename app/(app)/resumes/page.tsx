import type { Metadata } from 'next';
import ResumeManager from '@/components/resumes/ResumeManager';

export const metadata: Metadata = { title: 'Resume Manager' };

export default function ResumesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resume Manager</h1>
        <p className="text-muted-foreground mt-1">
          Upload, manage, and AI-tailor your resumes for every job.
        </p>
      </div>
      <ResumeManager />
    </div>
  );
}
