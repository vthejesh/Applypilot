import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { rateLimit } from '@/lib/security/rateLimit';
import { prisma } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/gmail';
import { verifyEmail } from '@/lib/email/verify';
import { sleep, randomDelay } from '@/lib/utils';

const limiter = rateLimit({ max: 10, windowMs: 60000 });

const SendSchema = z.object({
  applicationId: z.string(),
  confirmed: z.boolean().default(false), // must be true to actually send
});

async function checkDailyLimit(userId: string, limit: number): Promise<{ allowed: boolean; sent: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stat = await prisma.usageStat.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  const sent = stat?.emailsSent ?? 0;
  return { allowed: sent < limit, sent };
}

async function checkDuplicate(
  userId: string,
  email: string,
  company: string,
  windowDays: number
): Promise<{ isDuplicate: boolean; reason?: string }> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const existing = await prisma.application.findFirst({
    where: {
      userId,
      sentAt: { gte: since },
      OR: [
        { emailTo: email },
        { job: { company: { equals: company, mode: 'insensitive' } } },
      ],
      status: { not: 'draft' },
    },
    include: { job: true },
  });

  if (existing) {
    return {
      isDuplicate: true,
      reason: `You already contacted ${company} on ${existing.sentAt?.toLocaleDateString()}`,
    };
  }
  return { isDuplicate: false };
}

async function checkDoNotContact(
  userId: string,
  email: string,
  company: string
): Promise<boolean> {
  const blocked = await prisma.doNotContact.findFirst({
    where: {
      userId,
      OR: [
        { email },
        { company: { equals: company, mode: 'insensitive' } },
      ],
    },
  });
  return !!blocked;
}

export async function POST(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  try {
    const session = await requireSession();
    const userId = session.user.id;

    const body = await req.json();
    const { applicationId, confirmed } = SendSchema.parse(body);

    if (!confirmed) {
      return NextResponse.json(
        { error: 'Send not confirmed. Please approve the email preview first.' },
        { status: 400 }
      );
    }

    // Load the application
    const application = await prisma.application.findUnique({
      where: { id: applicationId, userId },
      include: {
        job: true,
        resume: true,
        user: { include: { profile: true } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!application.emailTo || !application.emailSubject || !application.emailBody) {
      return NextResponse.json({ error: 'Email not fully drafted' }, { status: 400 });
    }

    const profile = application.user.profile;
    const dailyLimit = profile?.dailySendLimit ?? 10;
    const duplicateWindow = profile?.duplicateWindowDays ?? 30;

    // Check Gmail connected
    const gmailToken = await prisma.gmailToken.findUnique({ where: { userId } });
    if (!gmailToken) {
      return NextResponse.json({ error: 'Gmail not connected. Please connect Gmail in Settings.' }, { status: 400 });
    }

    // Verify email
    const emailCheck = await verifyEmail(application.emailTo);
    if (!emailCheck.canSend) {
      return NextResponse.json(
        { error: `Cannot send to ${application.emailTo}: ${emailCheck.warnings.join('; ')}` },
        { status: 400 }
      );
    }

    // Check Do-Not-Contact
    const isDNC = await checkDoNotContact(userId, application.emailTo, application.job.company);
    if (isDNC) {
      return NextResponse.json(
        { error: 'This email or company is on your Do-Not-Contact list' },
        { status: 400 }
      );
    }

    // Check duplicate
    const dupCheck = await checkDuplicate(userId, application.emailTo, application.job.company, duplicateWindow);
    if (dupCheck.isDuplicate) {
      return NextResponse.json({ warning: dupCheck.reason, isDuplicate: true }, { status: 409 });
    }

    // Check daily limit
    const { allowed, sent } = await checkDailyLimit(userId, dailyLimit);
    if (!allowed) {
      return NextResponse.json(
        { error: `Daily send limit reached (${dailyLimit}). Resets tomorrow.` },
        { status: 429 }
      );
    }

    // Load resume PDF if available
    const attachments: Array<{ filename: string; mimeType: string; content: Buffer }> = [];
    const resumeUrl = application.tailoredResumeUrl ?? application.resume?.fileUrl;
    if (resumeUrl) {
      try {
        const resumeRes = await fetch(resumeUrl);
        if (resumeRes.ok) {
          const buffer = Buffer.from(await resumeRes.arrayBuffer());
          const filename = application.resume?.fileName ?? 'resume.pdf';
          attachments.push({ filename, mimeType: 'application/pdf', content: buffer });
        }
      } catch {
        console.warn('Failed to load resume attachment');
      }
    }

    // Add random delay to avoid spam detection (30s - 2min)
    const delay = randomDelay(30000, 120000);
    console.log(`Sending email in ${delay}ms`);
    // In production, this is handled by the Inngest queue.
    // For immediate send, we proceed after a shorter delay.
    await sleep(Math.min(delay, 2000)); // Short delay in direct sends

    // Send the email
    const result = await sendEmail(userId, {
      to: application.emailTo,
      subject: application.emailSubject,
      body: application.emailBody,
      attachments,
    });

    const now = new Date();

    if (result.success) {
      // Update application status
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: 'sent',
          sentAt: now,
          gmailThreadId: result.threadId,
          gmailMessageId: result.messageId,
          nextFollowupAt: new Date(now.getTime() + (profile?.followupDays ?? 5) * 24 * 60 * 60 * 1000),
        },
      });

      // Update job status
      await prisma.job.update({
        where: { id: application.jobId },
        data: { status: 'applied' },
      });

      // Log the send
      await prisma.emailLog.create({
        data: {
          userId,
          applicationId,
          type: 'sent',
          to: application.emailTo,
          subject: application.emailSubject,
          gmailMessageId: result.messageId,
          gmailThreadId: result.threadId,
          status: 'success',
        },
      });

      // Update daily counter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await prisma.usageStat.upsert({
        where: { userId_date: { userId, date: today } },
        create: { userId, date: today, emailsSent: 1 },
        update: { emailsSent: { increment: 1 } },
      });

      // Update contact record
      await prisma.contact.upsert({
        where: { userId_email: { userId, email: application.emailTo } },
        create: {
          userId,
          email: application.emailTo,
          company: application.job.company,
          lastContactedAt: now,
          contactedCount: 1,
        },
        update: {
          lastContactedAt: now,
          contactedCount: { increment: 1 },
        },
      });

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        threadId: result.threadId,
        dailySent: sent + 1,
        dailyLimit,
      });
    } else {
      // Log failure
      await prisma.emailLog.create({
        data: {
          userId,
          applicationId,
          type: 'sent',
          to: application.emailTo,
          subject: application.emailSubject,
          status: 'failure',
          errorMessage: result.error,
        },
      });

      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'error' },
      });

      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Send failed';
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Send API error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
