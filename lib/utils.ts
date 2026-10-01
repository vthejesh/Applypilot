import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import crypto from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a SHA-256 hash of a string for cache keys.
 */
export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generates a random delay between min and max milliseconds.
 */
export function randomDelay(minMs: number = 30000, maxMs: number = 120000): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

/**
 * Formats a date as a readable string.
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Formats a date as relative time (e.g. "2 days ago").
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diff = (new Date(date).getTime() - Date.now()) / 1000;

  if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'second');
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}

/**
 * Truncates a string to a maximum length.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

/**
 * Converts an array to a comma-separated string.
 */
export function joinList(arr: string[], max = 3): string {
  if (arr.length === 0) return 'None';
  if (arr.length <= max) return arr.join(', ');
  return arr.slice(0, max).join(', ') + ` +${arr.length - max} more`;
}

/**
 * Normalizes a job title for comparison (dedup).
 */
export function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

/**
 * Extracts domain from an email address.
 */
export function emailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

/**
 * Checks if an email looks valid (basic format check).
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Returns initials from a name.
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/**
 * Sanitizes user input to prevent prompt injection.
 * Removes AI-looking instructions from pasted text.
 */
export function sanitizeForPrompt(input: string): string {
  // Strip common prompt injection patterns
  const blocked = [
    /ignore (previous|all|above) instructions?/gi,
    /you are now/gi,
    /act as/gi,
    /pretend (you are|to be)/gi,
    /system prompt/gi,
    /\[INST\]/gi,
    /<\|im_start\|>/gi,
    /\\n\\nHuman:/gi,
  ];
  let safe = input;
  for (const pattern of blocked) {
    safe = safe.replace(pattern, '[REDACTED]');
  }
  return safe;
}

/**
 * Converts bytes to human-readable size.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps an async function with a timeout.
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}
