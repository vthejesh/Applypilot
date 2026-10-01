import { inngest } from '../client';
import { prisma } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/gmail';
import { randomDelay, sleep } from '@/lib/utils';

export const processSendQueue = inngest.createFunction(
  { id: 'process-send-queue', name: 'Process Scheduled Email Queue' },
  { event: 'email/queued' },
  async ({ event, step }) => {
    const { applicationId, userId } = event.data;

    // 1. Load application
    const app = await step.run('load-application', async () => {
      return prisma.application.findUnique({
        where: { id: applicationId, userId },
        include: { job: true, resume: true },
      });
    });

    if (!app || !app.emailTo || !app.emailSubject || !app.emailBody) {
      return { status: 'skipped', reason: 'Invalid application data' };
    }

    // 2. Delay to prevent spam flags
    await step.sleep('anti-spam-delay', `${Math.floor(randomDelay(30, 90) / 1000)}s`);

    // 3. Send email
    const sendResult = await step.run('send-via-gmail', async () => {
      return sendEmail(userId, {
        to: app.emailTo!,
        subject: app.emailSubject!,
        body: app.emailBody!,
      });
    });

    if (sendResult.success) {
      await step.run('update-db', async () => {
        const now = new Date();
        await prisma.application.update({
          where: { id: applicationId },
          data: {
            status: 'sent',
            sentAt: now,
            gmailMessageId: sendResult.messageId,
            gmailThreadId: sendResult.threadId,
          },
        });
      });
    }

    return { status: sendResult.success ? 'sent' : 'failed', sendResult };
  }
);
