'use client';

import PushNotificationForm from '@/components/admin/notifications/PushNotificationForm';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { ROLE } from '@/lib/constants';

export default function PushNotificationsPage() {
  const { hasAccess, isLoading } = useRoleAccess({
    allowedRoles: [ROLE.ADMIN]
  });

  if (isLoading || !hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Notifikasi" />
          <SectionDescription description="Kirim notifikasi push ke pengguna, admin, atau broadcast ke semua." />
        </SectionHeader>
        <SectionContent>
          <PushNotificationForm />
        </SectionContent>
      </Section>
    </main>
  );
}
