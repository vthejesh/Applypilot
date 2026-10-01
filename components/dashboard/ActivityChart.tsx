'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDate } from '@/lib/utils';

interface UsageStat {
  date: Date;
  emailsSent: number;
  aiTokensUsed: number;
}

export default function ActivityChart({ data }: { data: UsageStat[] }) {
  const chartData = [...data]
    .reverse()
    .slice(-7)
    .map((d) => ({
      date: formatDate(d.date).split(',')[0], // Just "Oct 1"
      emails: d.emailsSent,
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Emails Sent (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
            No data yet. Start sending applications!
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="emails" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
