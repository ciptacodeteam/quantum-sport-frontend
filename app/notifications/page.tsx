import MainHeader from '@/components/headers/MainHeader';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BellIcon } from 'lucide-react';

const mockNotifications = [
  {
    id: 1,
    title: 'Booking Confirmed',
    message: 'Your booking for Court 2 on 22 Nov at 06:00 has been confirmed.',
    date: '2025-10-28T08:00:00Z',
    read: false
  },
  {
    id: 2,
    title: 'Payment Received',
    message: 'We have received your payment for booking #12345.',
    date: '2025-10-27T15:30:00Z',
    read: true
  },
  {
    id: 3,
    title: 'Booking Reminder',
    message: 'Reminder: Your booking for Court 1 is tomorrow at 08:00.',
    date: '2025-10-27T07:00:00Z',
    read: false
  }
];

const NotificationPage = () => {
  return (
    <>
      <MainHeader backHref="/" title={'Notifikasi'} withLogo={false} />

      <main className="mt-26 mb-[5%] w-full md:mt-14">
        <section className="mx-auto max-w-md px-4">
          {mockNotifications.length === 0 ? (
            <div className="text-muted-foreground flex min-h-svh flex-col items-center justify-center py-16">
              <BellIcon className="mb-2 h-10 w-10 opacity-40" />
              <div className="text-lg font-semibold">No notifications</div>
              <div className="text-sm">You&apos;re all caught up!</div>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {mockNotifications.map((notif) => (
                <li
                  key={notif.id}
                  className={cn(
                    `flex gap-3 rounded-lg border bg-white px-4 py-3 transition-all`,
                    notif.read ? 'opacity-70' : 'border-green-700/60'
                  )}
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="line-clamp-1 text-base font-semibold">{notif.title}</span>
                      {!notif.read && (
                        <div className="size-2 rounded-full bg-green-700 text-white"></div>
                      )}
                    </div>
                    <span className="text-muted-foreground line-clamp-2 text-sm">
                      {notif.message}
                    </span>
                  </div>
                  <div className="flex min-w-[70px] flex-col items-end justify-between">
                    <span className="text-muted-foreground text-xs">
                      {new Date(notif.date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </span>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      className="text-muted-foreground mt-2 hover:text-green-700"
                    >
                      <BellIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
};
export default NotificationPage;
