'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import dayjs from '@/lib/dayjs';
import { ongoingBookingsQueryOptions } from '@/queries/admin/booking';
import type { OngoingBookingItem } from '@/types/model';

const toScheduleDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const formatScheduleTime = (value: string | Date, format = 'HH:mm') =>
  dayjs(value).tz('Asia/Jakarta').format(format);
const formatScheduleRange = (start: string | Date, end: string | Date) =>
  `${formatScheduleTime(start)} - ${formatScheduleTime(end)}`;

const getBookingTimeRange = (item: OngoingBookingItem) => {
  const slotStarts = [
    ...item.courts.map((court) => court.slotStart),
    ...item.coaches.map((coach) => coach.slotStart),
    ...item.ballboys.map((ballboy) => ballboy.slotStart)
  ]
    .map((value) => toScheduleDate(value))
    .filter((date): date is Date => !!date);

  const slotEnds = [
    ...item.courts.map((court) => court.slotEnd),
    ...item.coaches.map((coach) => coach.slotEnd),
    ...item.ballboys.map((ballboy) => ballboy.slotEnd)
  ]
    .map((value) => toScheduleDate(value))
    .filter((date): date is Date => !!date);

  const fallbackStart = toScheduleDate(item.schedule.startAt);
  const fallbackEnd = toScheduleDate(item.schedule.endAt);

  const start =
    slotStarts.length > 0
      ? slotStarts.reduce((earliest, current) =>
          current.getTime() < earliest.getTime() ? current : earliest
        )
      : fallbackStart;

  const end =
    slotEnds.length > 0
      ? slotEnds.reduce((latest, current) =>
          current.getTime() > latest.getTime() ? current : latest
        )
      : fallbackEnd;

  return { start, end };
};

const OnGoingBookingScheduleSection = () => {
  const [showAll, setShowAll] = useState(false);
  const {
    data: bookings,
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery(ongoingBookingsQueryOptions());
  const visibleBookings = showAll ? bookings : bookings?.slice(0, 5);

  return (
    <Card className="min-w-0 gap-3 overflow-hidden shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Jadwal booking</CardTitle>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Perbarui jadwal booking"
          title="Perbarui jadwal"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={isFetching ? 'size-4 animate-spin' : 'size-4'} />
        </Button>
      </CardHeader>
      <CardContent className="min-w-0">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : isError ? (
          <div role="alert" className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-muted-foreground text-sm">Jadwal belum dapat dimuat.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              Coba lagi
            </Button>
          </div>
        ) : !bookings?.length ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
            <CalendarDays className="size-4" />
            Belum ada jadwal booking
          </div>
        ) : (
          <>
            <Table aria-label="Ringkasan jadwal booking">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Lapangan / Pelatih</TableHead>
                  <TableHead>Waktu (WIB)</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleBookings?.map((item) => {
                  const { start, end } = getBookingTimeRange(item);
                  const names = [
                    ...new Set(item.courts.map((court) => court.courtName).filter(Boolean))
                  ];
                  const services = names.length
                    ? names.join(', ')
                    : [...new Set(item.coaches.map((coach) => coach.coachName))].join(', ') ||
                      'Ballboy';
                  const status = item.schedule.status;
                  const date = formatScheduleTime(start ?? item.schedule.startAt, 'DD MMM');
                  return (
                    <TableRow key={item.booking.id}>
                      <TableCell className="py-4 font-medium">{item.user.name}</TableCell>
                      <TableCell className="max-w-60 whitespace-normal">{services}</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{date}</span>
                        <span className="ml-3 tabular-nums">
                          {formatScheduleRange(
                            start ?? item.schedule.startAt,
                            end ?? item.schedule.endAt
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            status === 'ongoing'
                              ? 'lightInfo'
                              : status === 'upcoming'
                                ? 'lightWarning'
                                : 'lightSuccess'
                          }
                        >
                          {status === 'ongoing'
                            ? 'Berlangsung'
                            : status === 'upcoming'
                              ? 'Akan datang'
                              : 'Selesai'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {bookings.length > 5 && (
              <div className="mt-3 text-center">
                <Button size="sm" variant="ghost" onClick={() => setShowAll((value) => !value)}>
                  {showAll
                    ? 'Tampilkan lebih sedikit'
                    : `Lihat ${bookings.length - 5} booking lainnya`}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OnGoingBookingScheduleSection;
