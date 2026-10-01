import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export const metadata: Metadata = { title: 'Analytics' };
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const [applications, usageStats, emailLogs] = await Promise.all([
    prisma.application.findMany({
      where: { userId },
      include: {
        job: { select: { title: true, company: true } },
        resume: { select: { name: true, roleTag: true } },
        template: { select: { name: true, style: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.usageStat.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30,
    }),
    prisma.emailLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Understand what&apos;s working and optimize your strategy.
        </p>
      </div>
      <AnalyticsDashboard
        applications={applications}
        usageStats={usageStats}
        emailLogs={emailLogs}
      />
    </div>
  );
}
