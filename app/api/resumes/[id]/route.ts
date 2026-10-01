import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const { id } = params;

    const resume = await prisma.resume.findUnique({
      where: { id, userId },
      include: { versions: { orderBy: { versionNum: 'desc' } } },
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    return NextResponse.json({ resume });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch resume';
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

    await prisma.resume.updateMany({
      where: { id, userId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete resume';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
