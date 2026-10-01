import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const contacts = await prisma.contact.findMany({
      where: { userId },
      orderBy: { lastContactedAt: 'desc' },
    });

    const doNotContacts = await prisma.doNotContact.findMany({
      where: { userId },
    });

    return NextResponse.json({ contacts, doNotContacts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch contacts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const body = await req.json();
    const { email, name, company, role, linkedinUrl, notes, isDNC, dncReason } = body;

    if (isDNC) {
      const dnc = await prisma.doNotContact.create({
        data: {
          userId,
          email: email || null,
          company: company || null,
          reason: dncReason || 'User requested block',
        },
      });
      return NextResponse.json({ success: true, dnc });
    }

    const contact = await prisma.contact.upsert({
      where: { userId_email: { userId, email } },
      create: {
        userId,
        email,
        name: name || null,
        company: company || null,
        role: role || null,
        linkedinUrl: linkedinUrl || null,
        notes: notes || null,
      },
      update: {
        name: name || undefined,
        company: company || undefined,
        role: role || undefined,
        linkedinUrl: linkedinUrl || undefined,
        notes: notes || undefined,
      },
    });

    return NextResponse.json({ success: true, contact });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save contact';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
