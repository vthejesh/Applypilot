import Link from 'next/link';
import { Plus, Search, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const actions = [
  {
    href: '/apply',
    label: 'New Application',
    description: 'Paste a job post',
    icon: Plus,
    variant: 'default' as const,
  },
  {
    href: '/jobs',
    label: 'Discover Jobs',
    description: 'Find fresh openings',
    icon: Search,
    variant: 'outline' as const,
  },
  {
    href: '/resumes',
    label: 'Manage Resumes',
    description: 'Upload or tailor',
    icon: FileText,
    variant: 'outline' as const,
  },
  {
    href: '/analytics',
    label: 'View Analytics',
    description: 'Track performance',
    icon: BarChart3,
    variant: 'outline' as const,
  },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.href} href={action.href}>
            <Button
              variant={action.variant}
              className="w-full h-auto flex-col gap-1 py-3 items-start"
            >
              <div className="flex items-center gap-2 w-full">
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{action.label}</span>
              </div>
              <span className="text-xs text-muted-foreground font-normal">{action.description}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
}
