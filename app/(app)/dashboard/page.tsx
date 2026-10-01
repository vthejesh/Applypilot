import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RecentApplications from '@/components/dashboard/RecentApplications';
import QuickActions from '@/components/dashboard/QuickActions';
import ActivityChart from '@/components/dashboard/ActivityChart';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const [applications, jobs, profile, usageStats] = await Promise.all([
    prisma.application.findMany({
      where: { userId },
      include: { job: true, resume: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.job.count({ where: { userId, status: { in: ['discovered', 'saved'] } } }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.usageStat.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 7,
    }),
  ]);

  const stats = {
    total: await prisma.application.count({ where: { userId } }),
    sent: await prisma.application.count({ where: { userId, status: 'sent' } }),
    replied: await prisma.application.count({ where: { userId, status: 'replied' } }),
    interviews: await prisma.application.count({ where: { userId, status: 'interview' } }),
    newJobs: jobs,
    dailyLimit: profile?.dailySendLimit ?? 10,
    emailsSentToday: usageStats[0]?.emailsSent ?? 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {profile?.fullName?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your job search.
        </p>
      </div>

      <QuickActions />
      <DashboardStats stats={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart data={usageStats} />
        <RecentApplications applications={applications} />
      </div>
    </div>
  );
}
