'use client';

import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { profileQueryOptions } from '@/queries/profile';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from 'lucide-react';

const mockUpcomingBookings = [
  {
    id: 'booking-001',
    courtName: 'Lapangan A',
    sport: 'Badminton',
    startTime: dayjs().add(1, 'day').hour(9).minute(0).toISOString(),
    durationHours: 1,
    status: 'Confirmed' as const,
    addons: ['Coach Beginner', 'Raket Premium'],
    total: 150000
  },
  {
    id: 'booking-002',
    courtName: 'Lapangan B',
    sport: 'Futsal',
    startTime: dayjs().add(3, 'day').hour(19).minute(0).toISOString(),
    durationHours: 2,
    status: 'Pending Payment' as const,
    addons: [],
    total: 320000
  },
  {
    id: 'booking-003',
    courtName: 'Lapangan B',
    sport: 'Futsal',
    startTime: dayjs().add(3, 'day').hour(19).minute(0).toISOString(),
    durationHours: 2,
    status: 'Pending Payment' as const,
    addons: [],
    total: 320000
  }
];

const statusVariants: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700',
  'pending payment': 'bg-amber-100 text-amber-700',
  cancelled: 'bg-rose-100 text-rose-700'
};

export default function ActivitiesPage() {
  const router = useRouter();
  const { data: user, isPending, isError } = useQuery(profileQueryOptions);

  useEffect(() => {
    if (!isPending && (isError || !user?.id)) {
      router.push('/?requireLogin=true');
    }
  }, [isPending, isError, user, router]);

  if (isPending) {
    return (
      <>
        <MainHeader title="Pemesanan" withLogo={false} backHref="/" />
        <main className="mt-24 min-h-[calc(100dvh-180px)] w-full p-4 md:mt-14">
          <div className="mx-auto max-w-3xl space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </main>
      </>
    );
  }

  if (!user?.id) {
    return null;
  }

  return (
    <>
      <MainHeader title="Pemesanan" withLogo={false} backHref="/" />
      <main className="mx-auto w-11/12 py-28 md:mt-14 md:pb-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {mockUpcomingBookings.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Belum ada pemesanan</CardTitle>
                <CardDescription>
                  Mulai pesan lapangan favoritmu dan lihat jadwal yang akan datang di sini.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push('/booking')}>Cari Jadwal</Button>
              </CardContent>
            </Card>
          ) : (
            mockUpcomingBookings.map((booking) => {
              const start = dayjs(booking.startTime);
              const end = start.add(booking.durationHours, 'hour');

              return (
                <Card key={booking.id}>
                  <CardHeader className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{booking.courtName}</CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">{start.format('dddd, DD MMMM YYYY')}</p>
                      <p className="font-medium">
                        {start.format('HH:mm')} - {end.format('HH:mm')} WIB
                      </p>
                    </div>

                    <div className="border-muted-foreground/40 border-b border-dashed"></div>
                    <div className='flex items-center justify-end'>
                      <Link
                        href={'/'}
                        className="text-primary flex cursor-pointer text-sm font-medium me-1"
                      >
                        Lihat Detail
                      </Link>
                      <ChevronRightIcon size={18}/>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
      <MainBottomNavigation />
    </>
  );
}
