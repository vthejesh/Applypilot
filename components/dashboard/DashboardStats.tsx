import { Send, MessageCircle, Calendar, Briefcase, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface StatsProps {
  stats: {
    total: number;
    sent: number;
    replied: number;
    interviews: number;
    newJobs: number;
    dailyLimit: number;
    emailsSentToday: number;
  };
}

export default function DashboardStats({ stats }: StatsProps) {
  const replyRate = stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 100) : 0;
  const interviewRate = stats.replied > 0 ? Math.round((stats.interviews / stats.replied) * 100) : 0;
  const dailyProgress = Math.round((stats.emailsSentToday / stats.dailyLimit) * 100);

  const cards = [
    {
      label: 'Applications Sent',
      value: stats.sent,
      icon: Send,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950',
      sub: `${stats.total} total drafted`,
    },
    {
      label: 'Replies Received',
      value: stats.replied,
      icon: MessageCircle,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-950',
      sub: `${replyRate}% reply rate`,
    },
    {
      label: 'Interviews',
      value: stats.interviews,
      icon: Calendar,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950',
      sub: `${interviewRate}% from replies`,
    },
    {
      label: 'New Jobs Found',
      value: stats.newJobs,
      icon: Briefcase,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950',
      sub: 'Ready to apply',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="text-sm font-medium mt-0.5">{card.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{card.sub}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Daily send limit progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Today&apos;s Send Limit</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {stats.emailsSentToday} / {stats.dailyLimit}
            </span>
          </div>
          <Progress value={dailyProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.dailyLimit - stats.emailsSentToday} emails remaining today
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
