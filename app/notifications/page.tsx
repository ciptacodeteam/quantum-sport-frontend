'use client';
import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BellIcon, CheckIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsQueryOptions } from '@/queries/notification';
import { markNotificationReadMutationOptions } from '@/mutations/notification';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/stores/useAuthStore';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export default function NotificationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuth } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuth) {
      toast.error('Silakan login untuk melihat notifikasi');
      router.push('/');
    }
  }, [isHydrated, isAuth, router]);

  const {
    data: notifications,
    isLoading,
    isError
  } = useQuery({
    ...notificationsQueryOptions(),
    enabled: isAuth && isHydrated
  });

  const { mutate: markAsRead, isPending } = useMutation(
    markNotificationReadMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    })
  );

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  if (!isHydrated || !isAuth) {
    return null;
  }

  return (
    <>
      <MainHeader backHref="/" title={'Notifikasi'} withLogo={false} withBorder />

      <main>
        <section className="mx-auto mt-28 w-11/12 pb-20">
          {isLoading && (
            <div className="text-muted-foreground flex min-h-[50vh] flex-col items-center justify-center py-16">
              <div className="text-sm">Memuat notifikasi...</div>
            </div>
          )}

          {isError && !isLoading && (
            <div className="text-destructive flex min-h-[50vh] flex-col items-center justify-center py-16">
              <div className="text-sm">Gagal memuat notifikasi. Silakan coba lagi.</div>
            </div>
          )}

          {!isLoading && !isError && (!notifications || notifications.length === 0) && (
            <div className="text-muted-foreground flex min-h-[50vh] flex-col items-center justify-center py-16">
              <BellIcon className="mb-2 h-10 w-10 opacity-40" />
              <div className="text-lg font-semibold">Tidak ada notifikasi</div>
              <div className="text-sm">Anda sudah menyelesaikan semua notifikasi!</div>
            </div>
          )}

          {!isLoading && !isError && notifications && notifications.length > 0 && (
            <ul className="flex flex-col gap-4">
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={cn(
                    `flex gap-3 rounded-lg border bg-white px-4 py-3 transition-all`,
                    notif.isRead ? 'opacity-70' : 'border-primary/60'
                  )}
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="line-clamp-1 text-base font-semibold">{notif.title}</span>
                      {!notif.isRead && (
                        <div className="bg-primary size-2 rounded-full text-white"></div>
                      )}
                    </div>
                    {notif.message && (
                      <span className="text-muted-foreground line-clamp-2 text-sm">
                        {notif.message}
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-[70px] flex-col items-end justify-between">
                    <span className="text-muted-foreground text-xs">
                      {new Date(notif.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </span>
                    {!notif.isRead && (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="text-muted-foreground hover:text-primary mt-2"
                        onClick={() => handleMarkAsRead(notif.id)}
                        disabled={isPending}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
