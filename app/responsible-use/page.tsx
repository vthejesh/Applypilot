import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ResponsibleUsePage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12 max-w-3xl mx-auto space-y-6">
      <Link href="/"><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Responsible AI & Ethical Job Applications</h1>
      </div>

      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-lg font-semibold text-foreground">Our Anti-Spam Commitment</h2>
        <p>ApplyPilot is strictly built as a personal assistant, not a mass-cold-emailer. We enforce human-in-the-loop approvals, domain safety checks, duplicate application shields, and rate limiters.</p>

        <h2 className="text-lg font-semibold text-foreground">Resume Truthfulness Guarantee</h2>
        <p>Our AI prompts strictly prohibit inventing skills, certifications, degrees, or experience. The AI only reorganizes and highlights factual details you have provided.</p>
      </div>
    </div>
  );
}
