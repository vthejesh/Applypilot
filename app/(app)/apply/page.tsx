import type { Metadata } from 'next';
import ApplyWizard from '@/components/apply/ApplyWizard';

export const metadata: Metadata = { title: 'New Application' };

export default function ApplyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">New Application</h1>
        <p className="text-muted-foreground mt-1">
          Paste a job post, upload a poster, or drop a PDF. AI does the rest.
        </p>
      </div>
      <ApplyWizard />
    </div>
  );
}
