import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12 max-w-3xl mx-auto space-y-6">
      <Link href="/"><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: October 2026</p>

      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
        <p>By accessing or using ApplyPilot, you agree to be bound by these Terms of Service. If you do not agree, do not use our service.</p>

        <h2 className="text-lg font-semibold text-foreground">2. Responsible Sending & Limits</h2>
        <p>ApplyPilot facilitates personal job application communications. Users agree not to abuse or spam recipients. Applications are subject to daily sending limits to preserve email reputation and maintain ethical standards.</p>

        <h2 className="text-lg font-semibold text-foreground">3. User Approval</h2>
        <p>You acknowledge that you maintain final editorial control and must approve every message prior to transmission.</p>
      </div>
    </div>
  );
}
