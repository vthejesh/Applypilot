'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, ExternalLink, Loader2, Mail, User, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Profile {
  fullName?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  location?: string | null;
  experienceLevel?: string;
  dailySendLimit?: number;
  followupDays?: number;
}

interface SettingsPageProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
  profile: Profile | null;
  gmailConnected: boolean;
  gmailEmail?: string | null;
  usageStats: Array<{ date: Date; aiTokensUsed: number; aiCostUsd: number; emailsSent: number }>;
}

export default function SettingsPage({
  user,
  profile,
  gmailConnected,
  gmailEmail,
  usageStats,
}: SettingsPageProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: profile?.fullName ?? user.name ?? '',
    phone: profile?.phone ?? '',
    linkedinUrl: profile?.linkedinUrl ?? '',
    githubUrl: profile?.githubUrl ?? '',
    portfolioUrl: profile?.portfolioUrl ?? '',
    location: profile?.location ?? '',
    dailySendLimit: profile?.dailySendLimit ?? 10,
    followupDays: profile?.followupDays ?? 5,
  });

  const totalCost = usageStats.reduce((sum, s) => sum + s.aiCostUsd, 0);
  const totalEmails = usageStats.reduce((sum, s) => sum + s.emailsSent, 0);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Profile saved!');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'fullName', label: 'Full Name', placeholder: 'John Doe', type: 'text' },
              { id: 'phone', label: 'Phone', placeholder: '+91 9876543210', type: 'tel' },
              { id: 'linkedinUrl', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/...', type: 'url' },
              { id: 'githubUrl', label: 'GitHub URL', placeholder: 'https://github.com/...', type: 'url' },
              { id: 'portfolioUrl', label: 'Portfolio URL', placeholder: 'https://yoursite.com', type: 'url' },
              { id: 'location', label: 'Location', placeholder: 'Bangalore, India', type: 'text' },
            ].map((field) => (
              <div key={field.id} className="space-y-1">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.id as keyof typeof form] as string}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [field.id]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="dailySendLimit">Daily Send Limit</Label>
              <Input
                id="dailySendLimit"
                type="number"
                min={1}
                max={25}
                value={form.dailySendLimit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dailySendLimit: parseInt(e.target.value) || 10 }))
                }
              />
              <p className="text-xs text-muted-foreground">Max 25/day</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="followupDays">Follow-up After (days)</Label>
              <Input
                id="followupDays"
                type="number"
                min={3}
                max={14}
                value={form.followupDays}
                onChange={(e) =>
                  setForm((f) => ({ ...f, followupDays: parseInt(e.target.value) || 5 }))
                }
              />
            </div>
          </div>

          <Button onClick={saveProfile} disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Gmail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Gmail Connection
          </CardTitle>
          <CardDescription>Connect Gmail to send applications from your inbox.</CardDescription>
        </CardHeader>
        <CardContent>
          {gmailConnected ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Connected</p>
                <p className="text-xs text-muted-foreground">{gmailEmail}</p>
              </div>
              <Badge variant="success" className="ml-auto">
                Active
              </Badge>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Gmail is not connected. Sign in with Google to enable email sending.
              </p>
              <Button variant="outline" asChild>
                <a href="/api/auth/signin?provider=google">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect Gmail
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            AI Usage (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Emails Sent</p>
              <p className="font-bold text-lg">{totalEmails}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">AI Tokens</p>
              <p className="font-bold text-lg">{usageStats.reduce((s, u) => s + u.aiTokensUsed, 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">AI Cost</p>
              <p className="font-bold text-lg">${totalCost.toFixed(4)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
