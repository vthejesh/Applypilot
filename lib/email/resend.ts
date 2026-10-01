import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export interface ResendEmailParams {
  to: string;
  subject: string;
  text: string;
  from?: string;
  replyTo?: string;
}

/**
 * Sends a transactional email via Resend (used for app notifications, not job applications).
 */
export async function sendViaResend(params: ResendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const resend = getResend();
    const data = await resend.emails.send({
      from: params.from ?? process.env.RESEND_FROM_EMAIL ?? 'ApplyPilot <onboarding@resend.dev>',
      to: params.to,
      subject: params.subject,
      text: params.text,
      replyTo: params.replyTo,
    });

    return { success: true, id: data.data?.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

/**
 * Sends daily job digest email.
 */
export async function sendDigestEmail(
  to: string,
  jobs: Array<{ title: string; company: string; matchScore: number; link: string }>
): Promise<void> {
  const jobLines = jobs
    .slice(0, 10)
    .map(
      (j, i) =>
        `${i + 1}. ${j.title} at ${j.company} — Match: ${j.matchScore}%\n   ${j.link}`
    )
    .join('\n\n');

  await sendViaResend({
    to,
    subject: `ApplyPilot: ${jobs.length} new jobs for you today`,
    text: `Good morning!\n\nHere are your top job matches for today:\n\n${jobLines}\n\nLog in to apply: https://applypilot.vercel.app\n\nBest,\nThe ApplyPilot Team`,
  });
}
