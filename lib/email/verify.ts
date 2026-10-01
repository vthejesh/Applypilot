import dns from 'dns';
import { promisify } from 'util';
import { isValidEmail, emailDomain } from '@/lib/utils';

const resolveMx = promisify(dns.resolveMx);

// Known disposable email domains to warn about
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'throwaway.email', 'guerrillamail.com',
  'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'guerrillamail.info',
  'spam4.me', 'yopmail.com', 'trashmail.com', 'fakeinbox.com', 'maildrop.cc',
]);

// Free email domains that are suspicious for corporate recruiters
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
  'protonmail.com', 'icloud.com', 'aol.com', 'mail.com',
]);

export interface EmailVerificationResult {
  email: string;
  formatValid: boolean;
  domainExists: boolean;
  isDisposable: boolean;
  isFreeProvider: boolean;
  warnings: string[];
  canSend: boolean;
}

/**
 * Verifies an email address: format, MX records, disposable/free provider check.
 */
export async function verifyEmail(email: string): Promise<EmailVerificationResult> {
  const warnings: string[] = [];

  const formatValid = isValidEmail(email);
  if (!formatValid) {
    return {
      email,
      formatValid: false,
      domainExists: false,
      isDisposable: false,
      isFreeProvider: false,
      warnings: ['Email format is invalid'],
      canSend: false,
    };
  }

  const domain = emailDomain(email);
  const isDisposable = DISPOSABLE_DOMAINS.has(domain);
  const isFreeProvider = FREE_EMAIL_DOMAINS.has(domain);

  if (isDisposable) {
    warnings.push('This appears to be a disposable email address');
  }
  if (isFreeProvider) {
    warnings.push('This uses a free email provider — verify it belongs to the recruiter');
  }

  let domainExists = false;
  try {
    const records = await resolveMx(domain);
    domainExists = records.length > 0;
  } catch {
    warnings.push(`Domain ${domain} has no MX records — emails may not be delivered`);
    domainExists = false;
  }

  return {
    email,
    formatValid,
    domainExists,
    isDisposable,
    isFreeProvider,
    warnings,
    canSend: formatValid && domainExists && !isDisposable,
  };
}

/**
 * Verifies multiple emails and returns results.
 */
export async function verifyEmails(emails: string[]): Promise<EmailVerificationResult[]> {
  return Promise.all(emails.map(verifyEmail));
}
