import { describe, it, expect } from 'vitest';
import { isValidEmail } from '@/lib/utils';
import { verifyEmail } from '@/lib/email/verify';

describe('Email Verification', () => {
  it('validates format accurately', () => {
    expect(isValidEmail('recruiter@company.com')).toBe(true);
    expect(isValidEmail('invalid-email-address')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('flags disposable email addresses', async () => {
    const result = await verifyEmail('test@mailinator.com');
    expect(result.isDisposable).toBe(true);
    expect(result.canSend).toBe(false);
  });
});
