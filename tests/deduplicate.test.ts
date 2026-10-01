import { describe, it, expect } from 'vitest';
import { normalizeTitle } from '@/lib/utils';

describe('Deduplication normalization', () => {
  it('normalizes titles identically across subtle formatting differences', () => {
    const title1 = 'Senior Frontend Engineer (React/TS)';
    const title2 = 'senior frontend engineer reactts';
    expect(normalizeTitle(title1)).toBe(normalizeTitle(title2));
  });
});
