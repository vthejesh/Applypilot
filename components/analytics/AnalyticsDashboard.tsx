'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  sent: '#3b82f6',
  replied: '#22c55e',
  interview: '#a855f7',
  offer: '#f59e0b',
  rejected: '#ef4444',
  draft: '#6b7280',
};

export default function AnalyticsDashboard({
  applications,
  usageStats,
  emailLogs,
}: {
  applications: Array<{
    id: string;
    status: string;
    sentAt: Date | null;
    createdAt: Date;
    job: { title: string; company: string };
    resume: { name: string; roleTag: string } | null;
    template: { name: string; style: string } | null;
  }>;
  usageStats: Array<{ date: Date; emailsSent: number; aiTokensUsed: number; aiCostUsd: number }>;
  emailLogs: Array<{ type: string; status: string; createdAt: Date }>;
}) {
  // Applications per week
  const weeklyData = usageStats
    .slice(0, 14)
    .reverse()
    .map((s) => ({
      date: formatDate(s.date).split(',')[0],
      sent: s.emailsSent,
    }));

  // Status breakdown for pie
  const statusCounts = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Reply rate
  const sent = applications.filter((a) => ['sent', 'replied', 'interview', 'offer', 'rejected'].includes(a.status)).length;
  const replied = applications.filter((a) => ['replied', 'interview', 'offer'].includes(a.status)).length;
  const replyRate = sent > 0 ? Math.round((replied / sent) * 100) : 0;

  // Cost stats
  const totalCost = usageStats.reduce((sum, s) => sum + s.aiCostUsd, 0);
  const totalTokens = usageStats.reduce((sum, s) => sum + s.aiTokensUsed, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: applications.length },
          { label: 'Emails Sent', value: sent },
          { label: 'Reply Rate', value: `${replyRate}%` },
          { label: 'AI Cost (Total)', value: `$${totalCost.toFixed(4)}` },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications over time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Applications Sent (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="sent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Application Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] ?? '#6b7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI usage */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">AI Usage & Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Total Tokens Used</p>
              <p className="font-bold">{totalTokens.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total AI Cost</p>
              <p className="font-bold">${totalCost.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Avg Cost / Application</p>
              <p className="font-bold">
                {applications.length > 0
                  ? `$${(totalCost / applications.length).toFixed(4)}`
                  : '$0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
