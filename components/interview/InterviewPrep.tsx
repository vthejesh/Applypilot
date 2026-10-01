'use client';

import { useState } from 'react';
import { Loader2, Sparkles, HelpCircle, CheckCircle, Lightbulb, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface PrepResult {
  companyOverview: string;
  technicalQuestions: Array<{ question: string; topic: string; sampleAnswerTips: string }>;
  behavioralQuestions: Array<{ question: string; framework: string; sampleAnswerTips: string }>;
  questionsToAskInterviewer: string[];
  salaryNegotiationTip: string;
}

export default function InterviewPrep() {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [prep, setPrep] = useState<PrepResult | null>(null);

  async function generatePrep() {
    if (!jobTitle || !company) {
      toast.error('Please enter the job title and company');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle,
          company,
          requiredSkills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setPrep(json.prep);
      toast.success('Interview Prep generated!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Target Role & Company</CardTitle>
          <CardDescription>Tell ApplyPilot about the interview you want to prepare for.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input placeholder="Job Title (e.g. React Developer)" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            <Input placeholder="Company (e.g. Swiggy, Google, Razorpay)" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <Input placeholder="Key Skills / Tech Stack (e.g. React, Next.js, Redux, Node.js)" value={skills} onChange={(e) => setSkills(e.target.value)} />
          <Button onClick={generatePrep} disabled={loading} className="w-full gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating Mock Interview...</> : <><Sparkles className="h-4 w-4" /> Generate Interview Prep Guide</>}
          </Button>
        </CardContent>
      </Card>

      {prep && (
        <div className="space-y-6">
          {/* Company overview */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" /> Company Overview & Strategy</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{prep.companyOverview}</p></CardContent>
          </Card>

          {/* Technical Questions */}
          <Card>
            <CardHeader><CardTitle className="text-base">Top Technical Questions to Expect</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {prep.technicalQuestions.map((q, i) => (
                <div key={i} className="rounded-lg border p-4 bg-muted/20 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm">{i + 1}. {q.question}</p>
                    <Badge variant="secondary" className="text-xs shrink-0">{q.topic}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Tip:</span> {q.sampleAnswerTips}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Behavioral Questions */}
          <Card>
            <CardHeader><CardTitle className="text-base">Behavioral & Culture Fit (STAR Technique)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {prep.behavioralQuestions.map((q, i) => (
                <div key={i} className="rounded-lg border p-4 bg-muted/20 space-y-2">
                  <p className="font-semibold text-sm">{q.question}</p>
                  <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">STAR Tip:</span> {q.sampleAnswerTips}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Questions to Ask */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-500" /> Questions to Ask the Interviewer</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                {prep.questionsToAskInterviewer.map((q, i) => (
                  <li key={i}><span className="text-foreground">{q}</span></li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
