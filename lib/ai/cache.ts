import { prisma } from '@/lib/db/prisma';
import { hashContent } from '@/lib/utils';
import { z } from 'zod';

const CACHE_TTL_HOURS = 24;

/**
 * Gets a cached AI response by content hash.
 * Returns null if not found or expired.
 */
export async function getCachedResponse<T>(
  content: string,
  schema: z.ZodType<T>
): Promise<T | null> {
  const hash = hashContent(content);

  try {
    const cached = await prisma.aiCache.findUnique({
      where: { contentHash: hash },
    });

    if (!cached) return null;
    if (cached.expiresAt && cached.expiresAt < new Date()) {
      await prisma.aiCache.delete({ where: { id: cached.id } });
      return null;
    }

    const result = schema.safeParse(cached.response);
    if (!result.success) return null;

    return result.data;
  } catch {
    return null;
  }
}

/**
 * Stores an AI response in the cache.
 */
export async function setCachedResponse(
  content: string,
  prompt: string,
  response: unknown,
  model: string,
  tokensUsed: number
): Promise<void> {
  const hash = hashContent(content);
  const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000);

  try {
    await prisma.aiCache.upsert({
      where: { contentHash: hash },
      create: {
        contentHash: hash,
        prompt,
        response: response as object,
        model,
        tokens: tokensUsed,
        expiresAt,
      },
      update: {
        response: response as object,
        model,
        tokens: tokensUsed,
        expiresAt,
      },
    });
  } catch (err) {
    console.error('Failed to cache AI response:', err);
  }
}

/**
 * Track AI token usage per user.
 */
export async function trackUsage(userId: string, tokensUsed: number, costUsd: number): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    await prisma.usageStat.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        aiTokensUsed: tokensUsed,
        aiCostUsd: costUsd,
      },
      update: {
        aiTokensUsed: { increment: tokensUsed },
        aiCostUsd: { increment: costUsd },
      },
    });
  } catch (err) {
    console.error('Failed to track usage:', err);
  }
}

/**
 * Estimate cost in USD for tokens used (rough estimate).
 */
export function estimateCost(tokensUsed: number, model: string): number {
  // Approximate costs (input+output blended)
  const costs: Record<string, number> = {
    'claude-3-5-sonnet-20241022': 0.000006,  // $6/1M tokens blended
    'claude-3-haiku-20240307': 0.0000008,   // $0.8/1M tokens blended
    'gemini-1.5-flash': 0.00000035,          // $0.35/1M tokens blended
    'gemini-1.5-pro': 0.0000035,             // $3.5/1M tokens blended
  };
  const costPerToken = costs[model] ?? 0.000003;
  return tokensUsed * costPerToken;
}
