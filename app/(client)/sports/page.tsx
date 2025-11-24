'use client';

import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import MainHeader from '@/components/headers/MainHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency } from '@/lib/utils';
import { profileQueryOptions } from '@/queries/profile';
import { IconDownload, IconRefresh } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const mockHistory = [
  {
    id: 'history-001',
    courtName: 'Lapangan A',
    sport: 'Badminton',
    startTime: dayjs().subtract(2, 'day').hour(7).minute(0).toISOString(),
    durationHours: 1,
    total: 140000,
    addons: ['Shuttlecock x2'],
    paymentMethod: 'QRIS BCA',
    status: 'Completed' as const,
    feedback: 'Pertandingan yang seru, fasilitas bagus.'
  },
  {
    id: 'history-002',
    courtName: 'Lapangan B',
    sport: 'Futsal',
    startTime: dayjs().subtract(1, 'week').hour(20).minute(0).toISOString(),
    durationHours: 2,
    total: 360000,
    addons: ['Wasit Profesional'],
    paymentMethod: 'Kartu Kredit',
    status: 'Completed' as const,
    feedback: null
  },
  {
    id: 'history-003',
    courtName: 'Lapangan Outdoor C',
    sport: 'Basket',
    startTime: dayjs().subtract(5, 'day').hour(16).minute(0).toISOString(),
    durationHours: 1,
    total: 180000,
    addons: [],
    paymentMethod: 'Transfer Bank',
    status: 'Cancelled' as const,
    feedback: 'Dibatalkan karena hujan deras.'
  }
];

const statusColorMap: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
  refunded: 'bg-sky-100 text-sky-700'
};

export default function HistoryPage() {
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
        <MainHeader title="Riwayat" withLogo={false} backHref="/" />
        <main className="mt-24 min-h-[calc(100dvh-180px)] w-full p-4 md:mt-14">
          <div className="mx-auto max-w-3xl space-y-4">
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-52 w-full" />
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
      <MainHeader title="Riwayat" withLogo={false} backHref="/" />
      <main className="mt-24 min-h-[calc(100dvh-180px)] w-full p-4 pb-24 md:mt-14 md:pb-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {mockHistory.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Belum ada riwayat</CardTitle>
                <CardDescription>
                  Aktivitas yang sudah selesai akan tampil di sini. Mulai jadwalkan sesi olahragamu!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push('/booking')}>Buat Pemesanan</Button>
              </CardContent>
            </Card>
          ) : (
            mockHistory.map((history) => {
              const start = dayjs(history.startTime);
              const end = start.add(history.durationHours, 'hour');

              return (
                <Card key={history.id}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg">{history.courtName}</CardTitle>
                      <CardDescription>{history.sport}</CardDescription>
                    </div>
                    <Badge
                      className={cn(
                        'capitalize',
                        statusColorMap[history.status.toLowerCase()] ??
                          'bg-slate-200 text-slate-700'
                      )}
                    >
                      {history.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          {start.format('dddd, DD MMMM YYYY')}
                        </p>
                        <p className="font-medium">
                          {start.format('HH:mm')} - {end.format('HH:mm')} WIB
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-xs">Metode Pembayaran</p>
                        <p className="text-sm font-semibold">{history.paymentMethod}</p>
                      </div>
                    </div>

                    <Separator />

                    {history.addons.length > 0 && (
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold">Add-ons</p>
                        <ul className="text-muted-foreground">
                          {history.addons.map((addon) => (
                            <li key={addon}>• {addon}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs">Total Pembayaran</p>
                        <p className="text-lg font-semibold">{formatCurrency(history.total)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <IconDownload className="mr-1 size-4" />
                          Invoice
                        </Button>
                        <Button variant="outline" size="sm">
                          <IconRefresh className="mr-1 size-4" />
                          Pesan Lagi
                        </Button>
                      </div>
                    </div>

                    {history.feedback && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">Catatan</p>
                          <p className="text-muted-foreground text-sm">{history.feedback}</p>
                        </div>
                      </>
                    )}
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
