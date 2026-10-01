import type { Metadata } from 'next';
import ContactsManager from '@/components/contacts/ContactsManager';

export const metadata: Metadata = { title: 'Contacts & Network' };

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recruiter Contacts</h1>
        <p className="text-muted-foreground mt-1">
          Manage recruiter relationships, communication history, and Do-Not-Contact lists.
        </p>
      </div>
      <ContactsManager />
    </div>
  );
}
