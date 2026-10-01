import { google, gmail_v1 } from 'googleapis';
import { prisma } from '@/lib/db/prisma';
import { decryptToken, encryptToken } from '@/lib/security/encryption';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
}

export function getGmailAuthUrl(): string {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent',
  });
}

export async function getGmailClientForUser(userId: string): Promise<gmail_v1.Gmail> {
  const tokenRecord = await prisma.gmailToken.findUnique({ where: { userId } });
  if (!tokenRecord) throw new Error('Gmail not connected for this user');

  const oauth2Client = getOAuthClient();
  const accessToken = decryptToken(tokenRecord.accessToken);
  const refreshToken = decryptToken(tokenRecord.refreshToken);

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: tokenRecord.expiresAt.getTime(),
  });

  // Auto-refresh if expired
  if (tokenRecord.expiresAt < new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    if (credentials.access_token) {
      await prisma.gmailToken.update({
        where: { userId },
        data: {
          accessToken: encryptToken(credentials.access_token),
          expiresAt: new Date(credentials.expiry_date ?? Date.now() + 3600000),
        },
      });
      oauth2Client.setCredentials(credentials);
    }
  }

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  threadId?: string;       // for replies in same thread
  inReplyTo?: string;      // Message-ID header of previous message
  attachments?: Array<{
    filename: string;
    mimeType: string;
    content: Buffer | string; // Buffer for binary, string for text
    encoding?: 'base64';
  }>;
}

/**
 * Builds a MIME email message as base64url-encoded string.
 */
function buildMimeMessage(params: SendEmailParams & { fromEmail: string }): string {
  const boundary = `=_ApplyPilot_${Date.now()}`;
  const lines: string[] = [];

  lines.push(`From: ${params.fromEmail}`);
  lines.push(`To: ${params.to}`);
  lines.push(`Subject: ${params.subject}`);
  if (params.inReplyTo) {
    lines.push(`In-Reply-To: ${params.inReplyTo}`);
    lines.push(`References: ${params.inReplyTo}`);
  }
  lines.push('MIME-Version: 1.0');

  if (params.attachments?.length) {
    lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    lines.push('');
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('');
    lines.push(params.body);
    lines.push('');

    for (const attachment of params.attachments) {
      lines.push(`--${boundary}`);
      lines.push(`Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`);
      lines.push('Content-Transfer-Encoding: base64');
      lines.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
      lines.push('');
      const content = Buffer.isBuffer(attachment.content)
        ? attachment.content.toString('base64')
        : attachment.content;
      lines.push(content);
      lines.push('');
    }

    lines.push(`--${boundary}--`);
  } else {
    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('');
    lines.push(params.body);
  }

  const raw = lines.join('\r\n');
  return Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

/**
 * Sends an email using Gmail API on behalf of the user.
 */
export async function sendEmail(
  userId: string,
  params: SendEmailParams
): Promise<SendResult> {
  try {
    const gmail = await getGmailClientForUser(userId);
    const tokenRecord = await prisma.gmailToken.findUnique({ where: { userId } });
    if (!tokenRecord) throw new Error('No Gmail token found');

    const raw = buildMimeMessage({ ...params, fromEmail: tokenRecord.gmailEmail });

    const requestBody: gmail_v1.Schema$Message = { raw };
    if (params.threadId) requestBody.threadId = params.threadId;

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody,
    });

    return {
      success: true,
      messageId: response.data.id ?? undefined,
      threadId: response.data.threadId ?? undefined,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  date: Date;
  body: string;
  isRead: boolean;
}

/**
 * Reads recent messages from a Gmail thread.
 */
export async function getThreadMessages(
  userId: string,
  threadId: string
): Promise<GmailMessage[]> {
  const gmail = await getGmailClientForUser(userId);

  const threadRes = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full',
  });

  const messages: GmailMessage[] = [];
  for (const msg of threadRes.data.messages ?? []) {
    const headers = msg.payload?.headers ?? [];
    const from = headers.find((h) => h.name === 'From')?.value ?? '';
    const subject = headers.find((h) => h.name === 'Subject')?.value ?? '';
    const dateStr = headers.find((h) => h.name === 'Date')?.value ?? '';
    const isRead = !msg.labelIds?.includes('UNREAD');

    let body = '';
    const part = msg.payload?.parts?.find((p) => p.mimeType === 'text/plain');
    if (part?.body?.data) {
      body = Buffer.from(part.body.data, 'base64').toString('utf-8');
    } else if (msg.payload?.body?.data) {
      body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
    }

    messages.push({
      id: msg.id ?? '',
      threadId: msg.threadId ?? '',
      from,
      subject,
      snippet: msg.snippet ?? '',
      date: dateStr ? new Date(dateStr) : new Date(),
      body,
      isRead,
    });
  }

  return messages;
}

/**
 * Lists recent unread messages to check for replies to applications.
 */
export async function listRecentReplies(
  userId: string,
  afterHistoryId?: string
): Promise<GmailMessage[]> {
  const gmail = await getGmailClientForUser(userId);

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread in:inbox',
    maxResults: 50,
  });

  const messages: GmailMessage[] = [];
  for (const msg of res.data.messages ?? []) {
    if (!msg.id) continue;
    const full = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    });

    const headers = full.data.payload?.headers ?? [];
    const from = headers.find((h) => h.name === 'From')?.value ?? '';
    const subject = headers.find((h) => h.name === 'Subject')?.value ?? '';
    const dateStr = headers.find((h) => h.name === 'Date')?.value ?? '';

    let body = '';
    const part = full.data.payload?.parts?.find((p) => p.mimeType === 'text/plain');
    if (part?.body?.data) {
      body = Buffer.from(part.body.data, 'base64').toString('utf-8');
    }

    messages.push({
      id: full.data.id ?? '',
      threadId: full.data.threadId ?? '',
      from,
      subject,
      snippet: full.data.snippet ?? '',
      date: dateStr ? new Date(dateStr) : new Date(),
      body,
      isRead: !full.data.labelIds?.includes('UNREAD'),
    });
  }

  return messages;
}
