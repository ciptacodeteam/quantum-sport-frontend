import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { IconBell } from '@tabler/icons-react';
import Link from 'next/link';
import { Badge } from './badge';
import { Button } from './button';

export const dummyNotification = [
  {
    id: 1,
    title: 'New user registered',
    content: 'A new user has just registered.',
    time: '2m ago',
    read: false
  },
  {
    id: 2,
    title: 'Server downtime',
    content: 'Scheduled maintenance at 12:00 AM.',
    time: '1h ago',
    read: true
  },
  {
    id: 3,
    title: 'New order received',
    content: 'You have a new order from John Doe.',
    time: '3h ago',
    read: false
  }
];

const AppNotificationDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <IconBell className="size-6!" />
          <span className="sr-only">Open notifications</span>
          {dummyNotification.some((n) => !n.read) && (
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
          {dummyNotification.some((n) => !n.read) && (
            <Badge
              className="h-5 min-w-5 rounded-full px-1 font-mono font-semibold tabular-nums"
              variant="secondary"
            >
              {dummyNotification.filter((n) => !n.read).length}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-y-auto">
          {dummyNotification.length > 0 ? (
            <>
              {dummyNotification.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'hover:bg-muted flex cursor-pointer items-start gap-3 border-b px-4 py-3 transition-colors last:border-b-0',
                    notification.read ? 'bg-background' : 'bg-blue-50'
                  )}
                  tabIndex={0}
                  role="button"
                  aria-label={notification.title}
                >
                  <div className="flex flex-1 flex-col">
                    <span className="line-clamp-1 text-sm font-semibold">{notification.title}</span>
                    <span className="text-muted-foreground line-clamp-2 text-xs">
                      {notification.content}
                    </span>
                    <span className="text-muted-foreground mt-1 text-xs">{notification.time}</span>
                  </div>
                  {!notification.read && (
                    <span
                      className="bg-warning mt-1 inline-block h-2 w-2 rounded-full"
                      aria-label="Unread"
                    />
                  )}
                </div>
              ))}

              <div className="flex-center px-4 py-2">
                <Link
                  href="/admin/pengaturan/notifikasi"
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
