'use client';

import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils';
import { ongoingBookingsQueryOptions } from '@/queries/admin/booking';
import type { OngoingBookingItem } from '@/types/model';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const OnGoingBookingScheduleSection = () => {
  const { data: bookings, isLoading, isError } = useQuery(ongoingBookingsQueryOptions());

  const colHelper = createColumnHelper<OngoingBookingItem>();
  const columns = [
    colHelper.accessor('booking.id', {
      header: 'Booking ID',
      cell: (info) => info.getValue(),
      meta: {
        ps: '5',
        width: 150
      }
    }),
    colHelper.accessor('user.name', {
      header: 'Customer',
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-medium">{info.getValue()}</span>
          <span className="text-muted-foreground text-xs">{info.row.original.user.phone}</span>
        </div>
      ),
      meta: {
        ps: '5',
        width: 180
      }
    }),
    colHelper.accessor('courts', {
      header: 'Courts / Coaches',
      cell: (info) => {
        const courts = info.getValue();
        const coaches = info.row.original.coaches;
        const ballboys = info.row.original.ballboys;
        const inventories = info.row.original.inventories;

        // Group courts by courtName
        const groupedCourts = courts.reduce(
          (acc, court) => {
            if (!acc[court.courtName]) {
              acc[court.courtName] = [];
            }
            acc[court.courtName].push(court);
            return acc;
          },
          {} as Record<string, typeof courts>
        );

        return (
          <div className="flex flex-col gap-1.5">
            {Object.entries(groupedCourts).map(([courtName, courtSlots]) => (
              <div key={courtName} className="flex flex-col">
                <span className="text-sm font-medium">{courtName}</span>
                {courtSlots.map((court, idx) => (
                  <span key={idx} className="text-muted-foreground text-xs">
                    {dayjs(court.slotStart).format('HH:mm')} -{' '}
                    {dayjs(court.slotEnd).format('HH:mm')}
                  </span>
                ))}
              </div>
            ))}
            {coaches.length > 0 &&
              coaches.map((coach, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-sm font-medium">Coach: {coach.coachName}</span>
                  <span className="text-muted-foreground text-xs">
                    {dayjs(coach.slotStart).format('HH:mm')} -{' '}
                    {dayjs(coach.slotEnd).format('HH:mm')}
                  </span>
                </div>
              ))}
            {ballboys.length > 0 && (
              <span className="text-muted-foreground text-xs">
                +{ballboys.length} Ballboy{ballboys.length > 1 ? 's' : ''}
              </span>
            )}
            {inventories.length > 0 && (
              <span className="text-muted-foreground text-xs">
                +{inventories.length} Item{inventories.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        );
      },
      meta: {
        ps: '5',
        width: 220
      }
    }),
    colHelper.accessor('schedule', {
      header: 'Schedule',
      cell: (info) => {
        const schedule = info.getValue();
        return (
          <div className="flex flex-col">
            <span className="text-sm">{dayjs(schedule.startAt).format('DD MMM YYYY')}</span>
            <span className="text-muted-foreground text-xs">
              {dayjs(schedule.startAt).format('HH:mm')} - {dayjs(schedule.endAt).format('HH:mm')}
            </span>
          </div>
        );
      },
      meta: {
        ps: '5',
        width: 150
      }
    }),
    colHelper.accessor('schedule.status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        const timeDisplay = info.row.original.schedule.timeDisplay;
        let variant: BadgeVariant['variant'];

        if (status === 'ongoing') variant = 'lightInfo';
        else if (status === 'upcoming') variant = 'lightWarning';
        else if (status === 'completed') variant = 'lightSuccess';

        return (
          <div className="flex flex-col gap-1">
            <Badge variant={variant} className="w-fit">
              {status === 'ongoing' ? 'Ongoing' : status === 'upcoming' ? 'Upcoming' : 'Completed'}
            </Badge>
            <span className="text-muted-foreground text-xs">{timeDisplay}</span>
          </div>
        );
      },
      meta: {
        ps: '5',
        width: 150
      }
    }),
    colHelper.accessor('booking.totalPrice', {
      header: 'Total Price',
      cell: (info) => `Rp ${formatNumber(info.getValue())}`,
      meta: {
        ps: '5',
        width: 120
      }
    }),
    colHelper.accessor('booking.status', {
      header: 'Payment',
      cell: (info) => {
        const status = info.getValue();
        let variant: BadgeVariant['variant'];
        let label = status;

        if (status === 'CONFIRMED' || status === 'COMPLETED') {
          variant = 'lightSuccess';
          label = 'Paid';
        } else if (status === 'PENDING') {
          variant = 'lightWarning';
          label = 'Pending';
        } else if (status === 'CANCELLED') {
          variant = 'lightDestructive';
          label = 'Cancelled';
        }

        return <Badge variant={variant}>{label}</Badge>;
      },
      meta: {
        ps: '5',
        width: 100
      }
    })
  ];

  if (isLoading) {
    return (
      <section className="mt-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="mt-6">
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">
            Failed to load ongoing bookings. Please try again.
          </p>
        </div>
      </section>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <section className="mt-6">
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">No ongoing or upcoming bookings at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <DataTable data={bookings} columns={columns} />
    </section>
  );
};

export default OnGoingBookingScheduleSection;
