import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const resumes = await prisma.resume.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        roleTag: true,
        fileName: true,
        fileSize: true,
        atsScore: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
        parsedData: true,
      },
    });

    return NextResponse.json({ resumes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch resumes';
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
