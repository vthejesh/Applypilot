'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Mail,
  Briefcase,
  MapPin,
  RefreshCcw,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WizardState } from './ApplyWizard';

interface ReviewStepProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

type Resume = {
  id: string;
  name: string;
  roleTag: string;
  atsScore: number | null;
};

export default function ReviewStep({ state, update, onNext, onBack }: ReviewStepProps) {
  const { extractedJob, scamResult, emailVerifications, selectedEmail, selectedResumeId, emailDraft, selectedSubject, editedBody } = state;
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [emailStyle, setEmailStyle] = useState<'formal' | 'friendly' | 'short'>('friendly');

  if (!extractedJob) return null;

  // Load resumes on mount
  useEffect(() => {
    fetch('/api/resumes')
      .then((r) => r.json())
      .then((d) => {
        setResumes(d.resumes ?? []);
        if (d.resumes?.length > 0 && !selectedResumeId) {
          update({ selectedResumeId: d.resumes[0].id });
        }
      })
      .catch(() => toast.error('Failed to load resumes'))
      .finally(() => setLoadingResumes(false));
  }, []);

  async function generateEmail() {
    if (!extractedJob) return;
    setGeneratingEmail(true);
    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: extractedJob.jobTitle ?? 'Software Engineer',
          company: extractedJob.company ?? 'the company',
          requiredSkills: extractedJob.requiredSkills,
          jobDescription: null,
          instructions: extractedJob.instructions,
          resumeId: selectedResumeId,
          style: emailStyle,
          tone: 'friendly',
          targetLength: 'medium',
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const draft = json.data;
      update({
        emailDraft: draft,
        selectedSubject: draft.subject[0],
        editedBody: `${draft.body}\n\n${draft.signature}`,
      });
      toast.success('Email drafted!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Email generation failed');
    } finally {
      setGeneratingEmail(false);
    }
  }

  const confidenceColor = (c: number) =>
    c >= 0.8 ? 'text-green-600' : c >= 0.5 ? 'text-yellow-600' : 'text-red-500';

  const hasNoEmail = extractedJob.recruiterEmails.length === 0 && !selectedEmail;

  return (
    <div className="space-y-4">
      {/* Scam Warning */}
      {scamResult && scamResult.verdict !== 'safe' && (
        <div
          className={`flex items-start gap-3 rounded-lg p-4 ${
            scamResult.verdict === 'likely_scam'
              ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
              : 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800'
          }`}
        >
          <AlertTriangle
            className={`h-5 w-5 mt-0.5 shrink-0 ${
              scamResult.verdict === 'likely_scam' ? 'text-red-500' : 'text-yellow-500'
            }`}
          />
          <div>
            <p className="text-sm font-semibold">
              {scamResult.verdict === 'likely_scam' ? '⚠️ Possible Scam Detected' : '⚠️ Potential Red Flags'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{scamResult.reason}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {scamResult.flags
                .filter((f) => f.found)
                .map((f) => (
                  <Badge key={f.flag} variant="destructive" className="text-xs">
                    {f.flag}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Job Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Extracted Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-lg font-bold">{extractedJob.jobTitle ?? 'Unknown Title'}</p>
              <p className="text-sm text-muted-foreground">{extractedJob.company ?? 'Unknown Company'}</p>
            </div>

            {extractedJob.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{extractedJob.location}</span>
                {extractedJob.workMode && (
                  <Badge variant="secondary" className="text-xs">
                    {extractedJob.workMode}
                  </Badge>
                )}
              </div>
            )}

            {extractedJob.requiredSkills.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Required Skills</p>
                <div className="flex flex-wrap gap-1">
                  {extractedJob.requiredSkills.slice(0, 8).map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                  {extractedJob.requiredSkills.length > 8 && (
                    <Badge variant="outline" className="text-xs">
                      +{extractedJob.requiredSkills.length - 8} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground mb-1">Confidence</p>
              <Progress value={extractedJob.overallConfidence * 100} className="h-1.5" />
              <p className={`text-xs mt-0.5 ${confidenceColor(extractedJob.overallConfidence)}`}>
                {Math.round(extractedJob.overallConfidence * 100)}% confident
              </p>
            </div>

            {extractedJob.instructions && (
              <div className="rounded-md bg-muted p-2">
                <p className="text-xs font-medium">Special Instructions:</p>
                <p className="text-xs text-muted-foreground mt-0.5">{extractedJob.instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email & Resume Selection */}
        <div className="space-y-4">
          {/* Recruiter Email */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Send To
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasNoEmail ? (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">No recruiter email found</p>
                  {extractedJob.applyLink ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Use the apply link instead:{' '}
                      <a
                        href={extractedJob.applyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Apply Link
                      </a>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      No apply link found either. Try searching the company career page.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {emailVerifications.length > 0 ? (
                    emailVerifications.map((ev) => (
                      <button
                        key={ev.email}
                        onClick={() => update({ selectedEmail: ev.email })}
                        className={`w-full flex items-center justify-between rounded-lg border p-2.5 text-left transition-colors ${
                          selectedEmail === ev.email
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium">{ev.email}</p>
                          {ev.warnings.length > 0 && (
                            <p className="text-xs text-yellow-600 mt-0.5">{ev.warnings[0]}</p>
                          )}
                        </div>
                        {ev.canSend ? (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                      </button>
                    ))
                  ) : (
                    extractedJob.recruiterEmails.map((email) => (
                      <button
                        key={email}
                        onClick={() => update({ selectedEmail: email })}
                        className={`w-full flex items-center justify-between rounded-lg border p-2.5 text-left transition-colors ${
                          selectedEmail === email
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="text-sm font-medium">{email}</p>
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resume Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Resume</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingResumes ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading resumes...
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No resumes uploaded.{' '}
                  <a href="/resumes" className="text-primary hover:underline">
                    Upload one
                  </a>
                </div>
              ) : (
                <Select
                  value={selectedResumeId ?? ''}
                  onValueChange={(v) => update({ selectedResumeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} ({r.roleTag})
                        {r.atsScore && ` — ATS: ${r.atsScore}%`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Email Generation */}
      {!hasNoEmail && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Email Draft</CardTitle>
              <div className="flex items-center gap-2">
                <Select
                  value={emailStyle}
                  onValueChange={(v) => setEmailStyle(v as typeof emailStyle)}
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant={emailDraft ? 'outline' : 'default'}
                  onClick={generateEmail}
                  disabled={generatingEmail}
                >
                  {generatingEmail ? (
                    <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Writing...</>
                  ) : emailDraft ? (
                    <><RefreshCcw className="mr-1 h-3 w-3" /> Regenerate</>
                  ) : (
                    'Generate Email'
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          {emailDraft && (
            <CardContent className="space-y-3">
              {/* Subject selection */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Subject Line</p>
                <div className="space-y-1">
                  {emailDraft.subject.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => update({ selectedSubject: s })}
                      className={`w-full text-left text-sm rounded-md px-3 py-2 border transition-colors ${
                        selectedSubject === s
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Body editor */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Email Body (editable)</p>
                <Textarea
                  value={editedBody}
                  onChange={(e) => update({ editedBody: e.target.value })}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ~{editedBody.split(' ').filter(Boolean).length} words
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!emailDraft || !selectedEmail || hasNoEmail}
        >
          Review & Send
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
