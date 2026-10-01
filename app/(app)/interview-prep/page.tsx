import type { Metadata } from 'next';
import InterviewPrep from '@/components/interview/InterviewPrep';

export const metadata: Metadata = { title: 'AI Interview Prep' };

export default function InterviewPrepPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Interview Coach</h1>
        <p className="text-muted-foreground mt-1">
          Generate technical deep-dives, behavioral STAR responses, and company research tailored to your job applications.
        </p>
      </div>
      <InterviewPrep />
    </div>
  );
}
