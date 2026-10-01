import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import SettingsPage from '@/components/settings/SettingsPage';

export const metadata: Metadata = { title: 'Settings' };
export const dynamic = 'force-dynamic';

export default async function Settings() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const [profile, gmailToken, usageStats] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.gmailToken.findUnique({ where: { userId: session.user.id } }),
    prisma.usageStat.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      take: 30,
      select: { date: true, aiTokensUsed: true, aiCostUsd: true, emailsSent: true },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile, Gmail, and preferences.</p>
      </div>
      <SettingsPage
        user={session.user}
        profile={profile}
        gmailConnected={!!gmailToken}
        gmailEmail={gmailToken?.gmailEmail}
        usageStats={usageStats}
      />
    </div>
  );
}
