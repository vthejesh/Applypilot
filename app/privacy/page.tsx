import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12 max-w-3xl mx-auto space-y-6">
      <Link href="/"><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: October 2026</p>

      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-lg font-semibold text-foreground">1. Data We Collect</h2>
        <p>We store your profile data, uploaded resume contents, job application logs, and encrypted OAuth tokens necessary to send emails on your behalf.</p>

        <h2 className="text-lg font-semibold text-foreground">2. Security & Encryption</h2>
        <p>All sensitive OAuth tokens and session data are encrypted using AES-256-GCM. We never share or sell your resume or personal information to third parties.</p>

        <h2 className="text-lg font-semibold text-foreground">3. Account Deletion</h2>
        <p>You can delete your account and all associated resumes, logs, and drafts at any time from your settings page.</p>
      </div>
    </div>
  );
}
