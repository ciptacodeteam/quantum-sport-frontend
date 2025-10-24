import { dummyNotification } from '@/components/ui/app-notification-dropdown';
import AppSectionHeader from '@/components/ui/app-section-header';
import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { IconCircleCheck } from '@tabler/icons-react';

const NotificationPage = () => {
  return (
    <main>
      <AppSectionHeader
        withBorder
        title="Notifikasi"
        description="Kelola semua notifikasi aplikasi di sini."
        className="mb-4"
      />

      <main>
        <Button
          variant={'ghost'}
          className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
        >
          <IconCircleCheck className="size-5" />
          Mark all as read
        </Button>
        <section className="mt-4">
          <ul>
            {dummyNotification.map((notif) => (
              <li key={notif.id} className={cn(notif.read && 'border-b last:border-b-0')}>
                <div
                  className={cn(
                    'hover:bg-muted flex cursor-pointer items-center px-4 py-4 transition',
                    notif.read ? 'bg-background' : 'bg-blue-50'
                  )}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {!notif.read && (
                        <span className="bg-warning inline-block h-2 w-2 rounded-full" />
                      )}
                      <span className="text-sm font-medium">{notif.title}</span>
                    </div>
                    <p className="text-xs text-gray-600">{notif.content}</p>
                  </div>
                  <span className="ml-4 text-xs text-gray-400">{notif.time}</span>
                </div>
              </li>
            ))}
          </ul>

          <footer className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </footer>
        </section>
      </main>
    </main>
  );
};
export default NotificationPage;
