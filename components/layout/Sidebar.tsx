'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Plus,
  Briefcase,
  FileText,
  BarChart3,
  Settings,
  ChevronRight,
  Plane,
  Users,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/apply', label: 'New Application', icon: Plus },
  { href: '/jobs', label: 'Discover Jobs', icon: Briefcase },
  { href: '/pipeline', label: 'Pipeline', icon: ChevronRight },
  { href: '/resumes', label: 'Resumes', icon: FileText },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/interview-prep', label: 'Interview Prep', icon: GraduationCap },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen">
      {/* Logo */}
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Plane className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">ApplyPilot</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 h-10',
                  isActive && 'bg-primary/10 text-primary hover:bg-primary/15'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t">
        <Link href="/settings">
          <Button
            variant={pathname === '/settings' ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-3 h-10"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>
    </aside>
  );
}
