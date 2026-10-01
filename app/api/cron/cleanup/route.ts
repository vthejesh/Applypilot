import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Clean up expired AI cache entries
    const cacheDeleted = await prisma.aiCache.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    // Clean up notifications older than 60 days
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const notificationsDeleted = await prisma.notification.deleteMany({
      where: { createdAt: { lt: sixtyDaysAgo }, isRead: true },
    });

    return NextResponse.json({
      success: true,
      cacheDeleted: cacheDeleted.count,
      notificationsDeleted: notificationsDeleted.count,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cleanup cron failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
