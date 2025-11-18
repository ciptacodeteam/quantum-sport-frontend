'use client';

import AppSectionHeader from '@/components/ui/app-section-header';
import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { IconCircleCheck } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { adminNotificationsQueryOptions } from '@/queries/admin/notification';
import {
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation
} from '@/mutations/admin/notification';
import { useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Skeleton } from '@/components/ui/skeleton';

dayjs.extend(relativeTime);

const NotificationPage = () => {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [take] = useState(20); // Number of items per page

  const { data: notifications = [], isLoading } = useQuery(
    adminNotificationsQueryOptions({ take, cursor })
  );

  const { mutate: markAsRead } = useMarkNotificationReadMutation();
  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } =
    useMarkAllNotificationsReadMutation();

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(notificationId);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <main>
      <AppSectionHeader
        withBorder
        title="Notifikasi"
        description="Kelola semua notifikasi aplikasi di sini."
        className="mb-4"
      />

      <main>
        <div className="flex items-center justify-between">
          <Button
            variant={'ghost'}
            className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllAsRead || unreadCount === 0}
          >
            <IconCircleCheck className="size-5" />
            Mark all as read
          </Button>
          {unreadCount > 0 && (
            <span className="text-muted-foreground text-sm">
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <section className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b px-4 py-4">
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-muted-foreground flex items-center justify-center py-12 text-center">
              <p>Tidak ada notifikasi</p>
            </div>
          ) : (
            <ul>
              {notifications.map((notif) => (
                <li key={notif.id} className={cn(notif.isRead && 'border-b last:border-b-0')}>
                  <div
                    className={cn(
                      'hover:bg-muted flex cursor-pointer items-center px-4 py-4 transition',
                      notif.isRead ? 'bg-background' : 'bg-blue-50'
                    )}
                    onClick={() => handleNotificationClick(notif.id, notif.isRead)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleNotificationClick(notif.id, notif.isRead);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {!notif.isRead && (
                          <span className="bg-warning inline-block h-2 w-2 rounded-full" />
                        )}
                        <span className="text-sm font-medium">{notif.title}</span>
                      </div>
                      <p className="text-xs text-gray-600">{notif.message || 'No message'}</p>
                    </div>
                    <span className="ml-4 text-xs text-gray-400">
                      {dayjs(notif.createdAt).fromNow()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!isLoading && notifications.length > 0 && (
            <footer className="mt-8">
              <Pagination>
                <PaginationContent>
                  {cursor && (
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCursor(undefined);
                        }}
                      />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      {cursor ? '...' : '1'}
                    </PaginationLink>
                  </PaginationItem>
                  {notifications.length === take && (
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          const lastNotification = notifications[notifications.length - 1];
                          if (lastNotification) {
                            setCursor(lastNotification.id);
                          }
                        }}
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </footer>
          )}
        </section>
      </main>
    </main>
  );
};
export default NotificationPage;
