'use client';

import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils';
import { formatSlotTime, formatSlotTimeRange, toLocalSlotDate } from '@/lib/time-utils';
import { ongoingBookingsQueryOptions } from '@/queries/admin/booking';
import type { OngoingBookingItem } from '@/types/model';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const getBookingTimeRange = (item: OngoingBookingItem) => {
  const slotStarts = [
    ...item.courts.map((court) => court.slotStart),
    ...item.coaches.map((coach) => coach.slotStart),
    ...item.ballboys.map((ballboy) => ballboy.slotStart)
  ]
    .map((value) => toLocalSlotDate(value))
    .filter((date): date is Date => !!date);

  const slotEnds = [
    ...item.courts.map((court) => court.slotEnd),
    ...item.coaches.map((coach) => coach.slotEnd),
    ...item.ballboys.map((ballboy) => ballboy.slotEnd)
  ]
    .map((value) => toLocalSlotDate(value))
    .filter((date): date is Date => !!date);

  const fallbackStart = toLocalSlotDate(item.schedule.startAt);
  const fallbackEnd = toLocalSlotDate(item.schedule.endAt);

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
                    {formatSlotTimeRange(court.slotStart, court.slotEnd)}
                  </span>
                ))}
              </div>
            ))}
            {coaches.length > 0 &&
              coaches.map((coach, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-sm font-medium">Coach: {coach.coachName}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatSlotTimeRange(coach.slotStart, coach.slotEnd)}
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
        const row = info.row.original;
        const { start, end } = getBookingTimeRange(row);

        return (
          <div className="flex flex-col">
            <span className="text-sm">
              {formatSlotTime(start ?? row.schedule.startAt, 'DD MMM YYYY')}
            </span>
            <span className="text-muted-foreground text-xs">
              {formatSlotTimeRange(start ?? row.schedule.startAt, end ?? row.schedule.endAt)}
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
        const row = info.row.original;
        const status = info.getValue();
        const { start, end } = getBookingTimeRange(row);
        let variant: BadgeVariant['variant'];
        let timeDisplay = row.schedule.timeDisplay;

        if (status === 'ongoing') variant = 'lightInfo';
        else if (status === 'upcoming') variant = 'lightWarning';
        else if (status === 'completed') variant = 'lightSuccess';

        if (status === 'upcoming' && start) {
          timeDisplay = `Starts ${dayjs(start).fromNow()}`;
        } else if (status === 'ongoing' && end) {
          timeDisplay = `Ends ${dayjs(end).fromNow()}`;
        } else if (status === 'completed' && end) {
          timeDisplay = `Ended ${dayjs(end).fromNow()}`;
        }

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
