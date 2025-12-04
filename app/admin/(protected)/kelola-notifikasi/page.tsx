'use client';

import PushNotificationForm from '@/components/admin/notifications/PushNotificationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconBell } from '@tabler/icons-react';
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
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
          <IconBell className="text-primary h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Push Notifications</h1>
          <p className="text-muted-foreground">
            Kirim notifikasi push ke pengguna, admin, atau broadcast ke semua
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buat Notifikasi Baru</CardTitle>
          <CardDescription>
            Isi form di bawah untuk mengirim notifikasi push ke target audience yang dipilih
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PushNotificationForm />
        </CardContent>
      </Card>
    </div>
  );
}
