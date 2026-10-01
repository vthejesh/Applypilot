import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

const UpdateSchema = z.object({
  status: z.enum(['draft', 'queued', 'sent', 'replied', 'interview', 'offer', 'rejected', 'bounced', 'error']).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const { id } = params;

    const body = await req.json();
    const data = UpdateSchema.parse(body);

    const application = await prisma.application.findUnique({
      where: { id, userId },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: { job: true },
    });

    // If status changed, update the linked job status too
    if (data.status) {
      await prisma.job.update({
        where: { id: application.jobId },
        data: { status: data.status },
      });
    }

    return NextResponse.json({ success: true, application: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const { id } = params;

    await prisma.application.deleteMany({
      where: { id, userId },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
