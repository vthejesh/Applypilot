import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiter (use Redis/Upstash in production for multi-instance)
const rateMap = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitOptions {
  max?: number;
  windowMs?: number;
  keyFn?: (req: NextRequest) => string;
}

export function rateLimit(options: RateLimitOptions = {}) {
  const max = options.max ?? parseInt(process.env.RATE_LIMIT_MAX ?? '100');
  const windowMs = options.windowMs ?? parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000');

  return function check(req: NextRequest): NextResponse | null {
    const key = options.keyFn
      ? options.keyFn(req)
      : req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';

    const now = Date.now();
    const entry = rateMap.get(key);

    if (!entry || entry.resetAt < now) {
      rateMap.set(key, { count: 1, resetAt: now + windowMs });
      return null;
    }

    entry.count++;
    if (entry.count > max) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
            'X-RateLimit-Limit': String(max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
          },
        }
      );
    }

    return null;
  };
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateMap.entries()) {
    if (entry.resetAt < now) rateMap.delete(key);
  }
}, 5 * 60 * 1000);
