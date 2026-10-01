'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Mail, Building, Plus, Ban, Trash2, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';

interface Contact {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  role: string | null;
  notes: string | null;
  lastContactedAt: string | null;
  contactedCount: number;
}

interface DNC {
  id: string;
  email: string | null;
  company: string | null;
  reason: string | null;
  createdAt: string;
}

export default function ContactsManager() {
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newName, setNewName] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Failed to load contacts');
      return res.json() as Promise<{ contacts: Contact[]; doNotContacts: DNC[] }>;
    },
  });

  async function handleAddContact() {
    if (!newEmail && !newCompany) {
      toast.error('Provide at least an email or company');
      return;
    }

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, company: newCompany, name: newName }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Contact added');
      setNewEmail('');
      setNewCompany('');
      setNewName('');
      refetch();
    } catch {
      toast.error('Failed to add contact');
    }
  }

  async function handleAddDNC(email?: string, company?: string) {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company, isDNC: true, dncReason: 'Blocked by user' }),
      });
      if (!res.ok) throw new Error('Failed to block');
      toast.success('Added to Do-Not-Contact list');
      refetch();
    } catch {
      toast.error('Failed to block');
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Add */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Recruiter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input placeholder="Name (e.g. Sarah Jenkins)" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input placeholder="Email (e.g. hr@company.com)" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <Input placeholder="Company (e.g. Acme Corp)" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
            <Button onClick={handleAddContact} className="gap-2">
              <Plus className="h-4 w-4" /> Add Contact
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">Recruiters ({data?.contacts?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="dnc">Do-Not-Contact List ({data?.doNotContacts?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-3 pt-2">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
          ) : data?.contacts?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No contacts saved yet.</div>
          ) : (
            data?.contacts?.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{c.name || 'Unnamed Recruiter'}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span><Mail className="inline h-3 w-3 mr-1" />{c.email}</span>
                      {c.company && <span>&bull; <Building className="inline h-3 w-3 mr-1" />{c.company}</span>}
                    </p>
                    {c.lastContactedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last contacted: {formatDate(c.lastContactedAt)} ({c.contactedCount} emails)
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleAddDNC(c.email, c.company || undefined)} className="text-destructive gap-1">
                    <Ban className="h-3.5 w-3.5" /> Block
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="dnc" className="space-y-3 pt-2">
          {data?.doNotContacts?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Do-Not-Contact list is empty.</div>
          ) : (
            data?.doNotContacts?.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-destructive flex items-center gap-1.5">
                      <Ban className="h-4 w-4" /> {d.email || d.company || 'Blocked entry'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.reason || 'No reason specified'}</p>
                  </div>
                  <Badge variant="outline">Blocked</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
