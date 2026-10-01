import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { listRecentReplies } from '@/lib/email/gmail';
import { callAiJson } from '@/lib/ai/parseJson';
import { z } from 'zod';

const ReplyClassificationSchema = z.object({
  category: z.enum(['interview_request', 'rejection', 'asking_for_details', 'oof', 'spam', 'other']),
  summary: z.string(),
  suggestedAction: z.string(),
  suggestedReply: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In production cron security check
  }

  try {
    const usersWithGmail = await prisma.gmailToken.findMany({
      select: { userId: true },
    });

    let processedCount = 0;

    for (const { userId } of usersWithGmail) {
      try {
        const messages = await listRecentReplies(userId);

        for (const msg of messages) {
          if (!msg.threadId) continue;

          // Check if matches an application
          const application = await prisma.application.findFirst({
            where: {
              userId,
              gmailThreadId: msg.threadId,
              status: { in: ['sent', 'queued'] },
            },
          });

          if (application) {
            // Classify email with AI
            const classificationPrompt = `Analyze this recruiter reply to a job application and classify it:

Subject: ${msg.subject}
From: ${msg.from}
Body:
${msg.body.slice(0, 1500)}

Return JSON with category (interview_request|rejection|asking_for_details|oof|spam|other), summary, suggestedAction, and suggestedReply.`;

            let classification = 'replied';
            let draftReply = null;

            try {
              const { data } = await callAiJson(ReplyClassificationSchema, classificationPrompt);
              if (data.category === 'interview_request') classification = 'interview';
              else if (data.category === 'rejection') classification = 'rejected';
              else classification = 'replied';

              draftReply = data.suggestedReply || null;
            } catch {
              // fallback
            }

            await prisma.application.update({
              where: { id: application.id },
              data: {
                status: classification,
                lastRepliedAt: new Date(),
                replyDraft: draftReply,
              },
            });

            await prisma.emailLog.create({
              data: {
                userId,
                applicationId: application.id,
                type: 'replied',
                to: msg.from,
                subject: msg.subject,
                gmailMessageId: msg.id,
                gmailThreadId: msg.threadId,
                status: 'success',
                repliedAt: new Date(),
              },
            });

            processedCount++;
          }
        }
      } catch (userErr) {
        console.warn(`Error checking replies for user ${userId}:`, userErr);
      }
    }

    return NextResponse.json({ success: true, processedCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cron check replies failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
