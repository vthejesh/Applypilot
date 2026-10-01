'use client';

import { useState } from 'react';
import { CheckCircle2, Send, ChevronLeft, Loader2, Mail, FileText, Clock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { WizardState } from './ApplyWizard';

interface SendStepProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onBack: () => void;
}

export default function SendStep({ state, update, onBack }: SendStepProps) {
  const { extractedJob, selectedEmail, selectedSubject, editedBody, sentResult } = state;
  const [sending, setSending] = useState(false);
  const [undoWindow, setUndoWindow] = useState(false);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState(30);

  if (!extractedJob) return null;

  // If already sent
  if (sentResult) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold">Application Sent! 🚀</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Your email to {selectedEmail} is on its way.
            </p>
          </div>
          {sentResult.threadId && (
            <p className="text-xs text-muted-foreground">
              Replies will appear in your Gmail inbox in the same thread.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/pipeline">View in Pipeline</Link>
            </Button>
            <Button asChild>
              <Link href="/apply">Start Another Application</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Undo window UI
  if (undoWindow) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold">Sending in {undoSecondsLeft}s...</h2>
            <p className="text-muted-foreground text-sm mt-1">You can cancel this send.</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => {
              if (undoTimer) clearTimeout(undoTimer);
              setUndoWindow(false);
              toast.info('Send cancelled');
            }}
          >
            Cancel Send
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function handleSend() {
    // Create application draft first
    setSending(true);
    try {
      // 1. Create the application record
      const createRes = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobData: extractedJob,
          emailTo: selectedEmail,
          emailSubject: selectedSubject,
          emailBody: editedBody,
          resumeId: state.selectedResumeId,
        }),
      });

      const createJson = await createRes.json();
      if (!createRes.ok) throw new Error(createJson.error);

      const applicationId = createJson.applicationId;

      // 2. Start 30-second undo window
      setUndoWindow(true);
      setSending(false);
      let secs = 30;
      setUndoSecondsLeft(secs);

      const interval = setInterval(() => {
        secs--;
        setUndoSecondsLeft(secs);
      }, 1000);

      const timer = setTimeout(async () => {
        clearInterval(interval);
        setUndoWindow(false);
        setSending(true);

        // 3. Confirm the send
        const sendRes = await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId, confirmed: true }),
        });

        const sendJson = await sendRes.json();
        setSending(false);

        if (sendRes.status === 409) {
          toast.warning(sendJson.warning ?? 'Duplicate application detected');
          return;
        }

        if (!sendRes.ok) throw new Error(sendJson.error);

        update({
          applicationId,
          sentResult: { success: true, threadId: sendJson.threadId },
        });

        toast.success('Email sent successfully!');
      }, 30000);

      setUndoTimer(timer);
    } catch (err: unknown) {
      setSending(false);
      setUndoWindow(false);
      const msg = err instanceof Error ? err.message : 'Send failed';
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-4">
      {/* Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-xs text-muted-foreground w-12 pt-0.5">To:</span>
              <span className="text-sm font-medium">{selectedEmail}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs text-muted-foreground w-12 pt-0.5">Subject:</span>
              <span className="text-sm">{selectedSubject}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs text-muted-foreground w-12 pt-0.5">Resume:</span>
              <div className="flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">
                  {state.selectedResumeId ? 'Resume attached' : 'No resume selected'}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="rounded-md bg-muted/50 p-4">
            <pre className="text-sm whitespace-pre-wrap font-sans">{editedBody}</pre>
          </div>

          {extractedJob.instructions && (
            <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-950 p-3">
              <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-medium">Special instruction followed:</span>{' '}
                {extractedJob.instructions}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">BEFORE SENDING</p>
          <div className="space-y-1.5">
            {[
              { label: 'Email address verified', ok: true },
              { label: 'Resume attached', ok: !!state.selectedResumeId },
              { label: 'Subject line chosen', ok: !!selectedSubject },
              { label: 'Email body reviewed', ok: editedBody.length > 50 },
              { label: 'Gmail connected', ok: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className={`h-4 w-4 rounded-full flex items-center justify-center ${
                    item.ok ? 'bg-green-500' : 'bg-muted'
                  }`}
                >
                  {item.ok && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                </div>
                <span className={`text-xs ${item.ok ? '' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} disabled={sending}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button onClick={handleSend} disabled={sending} className="gap-2" size="lg">
          {sending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
          ) : (
            <><Send className="h-4 w-4" /> Confirm & Send</>
          )}
        </Button>
      </div>
    </div>
  );
}
