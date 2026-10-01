import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getOAuthClient } from '@/lib/email/gmail';
import { encryptToken } from '@/lib/security/encryption';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(new URL('/settings?error=no_code', req.url));
    }

    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(new URL('/settings?error=token_exchange_failed', req.url));
    }

    oauth2Client.setCredentials(tokens);
    const { google } = await import('googleapis');
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const gmailEmail = profile.data.emailAddress ?? session.user.email ?? '';

    await prisma.gmailToken.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: encryptToken(tokens.access_token),
        refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : '',
        expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600000),
        gmailEmail,
      },
      update: {
        accessToken: encryptToken(tokens.access_token),
        refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : undefined,
        expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600000),
        gmailEmail,
      },
    });

    return NextResponse.redirect(new URL('/settings?gmail=connected', req.url));
  } catch (err: unknown) {
    console.error('Gmail OAuth callback error:', err);
    return NextResponse.redirect(new URL('/settings?error=gmail_failed', req.url));
  }
}
