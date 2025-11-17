'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useMarkNotificationReadMutation } from '@/mutations/admin/notification';
import { adminNotificationsQueryOptions } from '@/queries/admin/notification';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { IconBell } from '@tabler/icons-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from 'next/link';
import { Badge } from './badge';
import { Button } from './button';

dayjs.extend(relativeTime);

const AppNotificationDropdown = () => {
  // Fetch admin notifications
  const { data: notifications = [] } = useQuery(
    adminNotificationsQueryOptions({ limit: 10, page: 1 })
  );

  const { mutate: markAsRead } = useMarkNotificationReadMutation();

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasUnread = unreadCount > 0;

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(notificationId);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <IconBell className="size-6!" />
          <span className="sr-only">Open notifications</span>
          {hasUnread && (
            <span
              className="absolute top-1 right-1 inline-block h-2 w-2 rounded-full bg-red-500"
              aria-label="Unread notifications"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2 px-4 py-2 font-medium">
          Notifications
          {hasUnread && (
            <Badge
              className="h-5 min-w-5 rounded-full px-1 font-mono font-semibold tabular-nums"
              variant="secondary"
            >
              {unreadCount}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-y-auto">
          {notifications.length > 0 ? (
            <>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'hover:bg-muted flex cursor-pointer items-start gap-3 border-b px-4 py-3 transition-colors last:border-b-0',
                    notification.isRead ? 'bg-background' : 'bg-blue-50'
                  )}
                  onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleNotificationClick(notification.id, notification.isRead);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={notification.title}
                >
                  <div className="flex flex-1 flex-col">
                    <span className="line-clamp-1 text-sm font-semibold">{notification.title}</span>
                    <span className="text-muted-foreground line-clamp-2 text-xs">
                      {notification.message || 'No message'}
                    </span>
                    <span className="text-muted-foreground mt-1 text-xs">
                      {dayjs(notification.createdAt).fromNow()}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <span
                      className="bg-warning mt-1 inline-block h-2 w-2 rounded-full"
                      aria-label="Unread"
                    />
                  )}
                </div>
              ))}

              <div className="flex-center px-4 py-2">
                <Link
                  href="/admin/kelola-notifikasi"
                  className="text-muted-foreground inline-block px-4 py-2 text-xs"
                >
                  View all notifications
                </Link>
              </div>
            </>
          ) : (
            <div className="px-4 py-2">
              <span className="text-muted-foreground block px-4 py-2 text-sm">
                No new notifications
              </span>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default AppNotificationDropdown;
