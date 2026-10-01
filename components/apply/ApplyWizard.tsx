'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Upload, FileText, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import JobInputStep from './JobInputStep';
import ReviewStep from './ReviewStep';
import SendStep from './SendStep';

export type ExtractedJob = {
  recruiterEmails: string[];
  company: string | null;
  jobTitle: string | null;
  location: string | null;
  workMode: string | null;
  jobType: string | null;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  experienceLevel: string | null;
  experienceYears: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  deadline: string | null;
  applyLink: string | null;
  instructions: string | null;
  confidence: Record<string, number>;
  overallConfidence: number;
  redFlags: string[];
};

export type ScamResult = {
  isLikelyScam: boolean;
  scamScore: number;
  verdict: 'safe' | 'warning' | 'likely_scam';
  reason: string;
  flags: Array<{ flag: string; severity: string; found: boolean }>;
} | null;

export type EmailVerification = {
  email: string;
  canSend: boolean;
  warnings: string[];
};

export type EmailDraft = {
  subject: string[];
  body: string;
  signature: string;
  wordCount: number;
};

export type WizardState = {
  step: 1 | 2 | 3;
  extractedJob: ExtractedJob | null;
  scamResult: ScamResult;
  emailVerifications: EmailVerification[];
  selectedEmail: string | null;
  selectedResumeId: string | null;
  emailDraft: EmailDraft | null;
  selectedSubject: string;
  editedBody: string;
  applicationId: string | null;
  sentResult: { success: boolean; threadId?: string } | null;
};

const STEPS = [
  { num: 1, label: 'Input', icon: Upload },
  { num: 2, label: 'Review & Draft', icon: FileText },
  { num: 3, label: 'Send', icon: Send },
];

export default function ApplyWizard() {
  const [state, setState] = useState<WizardState>({
    step: 1,
    extractedJob: null,
    scamResult: null,
    emailVerifications: [],
    selectedEmail: null,
    selectedResumeId: null,
    emailDraft: null,
    selectedSubject: '',
    editedBody: '',
    applicationId: null,
    sentResult: null,
  });

  function goTo(step: 1 | 2 | 3) {
    setState((s) => ({ ...s, step }));
  }

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch }));
  }

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const isDone = state.step > step.num;
          const isActive = state.step === step.num;
          return (
            <div key={step.num} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => {
                  if (isDone) goTo(step.num as 1 | 2 | 3);
                }}
                disabled={!isDone}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive && 'text-primary',
                  isDone && 'text-green-600 cursor-pointer hover:bg-green-50 dark:hover:bg-green-950',
                  !isActive && !isDone && 'text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold border-2',
                    isActive && 'border-primary text-primary bg-primary/10',
                    isDone && 'border-green-500 bg-green-500 text-white',
                    !isActive && !isDone && 'border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>

              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 rounded',
                    state.step > step.num ? 'bg-green-500' : 'bg-border'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {state.step === 1 && (
            <JobInputStep
              onExtracted={(job, scam, verifications) => {
                const firstValidEmail = verifications.find((v) => v.canSend)?.email ?? (job.recruiterEmails.length > 0 ? job.recruiterEmails[0] : null);
                update({
                  extractedJob: job,
                  scamResult: scam,
                  emailVerifications: verifications,
                  selectedEmail: firstValidEmail,
                  step: 2,
                });
              }}
            />
          )}
          {state.step === 2 && state.extractedJob && (
            <ReviewStep
              state={state}
              update={update}
              onNext={() => goTo(3)}
              onBack={() => goTo(1)}
            />
          )}
          {state.step === 3 && (
            <SendStep
              state={state}
              update={update}
              onBack={() => goTo(2)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
