import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import PipelineBoard from '@/components/pipeline/PipelineBoard';

export const metadata: Metadata = { title: 'Pipeline' };
export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
    include: {
      job: true,
      resume: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Application Pipeline</h1>
        <p className="text-muted-foreground mt-1">Track every application from save to offer.</p>
      </div>
      <PipelineBoard initialApplications={applications} />
    </div>
  );
}
