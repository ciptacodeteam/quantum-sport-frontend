'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ManagedDialog
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { BOOKING_STATUS_BADGE_VARIANT, BOOKING_STATUS_MAP, BookingStatus } from '@/lib/constants';
import { formatSlotTime } from '@/lib/time-utils';
import { formatPhone } from '@/lib/utils';
import { adminScheduleQueryOptions } from '@/queries/admin/booking';
import { adminCourtsQueryOptions, adminCourtsWithSlotsQueryOptions } from '@/queries/admin/court';
import type {
  Booking,
  BookingDetail,
  BookingCoach,
  BookingInventory,
  Staff,
  Inventory
} from '@/types/model';
import { IconCalendar, IconUser, IconShoppingCart } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

// Helper to format date as YYYY-MM-DD
const formatDateString = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

// Helper to extract date from ISO string or Date object
const getDateStringFromISO = (value: string | Date): string => {
  return dayjs(value).format('YYYY-MM-DD');
};

// Helper to format date for display
const formatDate = (date: Date | string, format: string): string => {
  const dayjsDate = dayjs(date);
  if (!dayjsDate.isValid()) {
    return '-';
  }
  return dayjsDate.format(format);
};

// Helper to convert numeric status to BookingStatus enum
const getBookingStatus = (status: number | BookingStatus): BookingStatus => {
  if (typeof status === 'string') {
    return status as BookingStatus;
  }
  // Map numeric enum to string enum
  const statusMap: Record<number, BookingStatus> = {
    0: BookingStatus.HOLD,
    1: BookingStatus.CONFIRMED,
    2: BookingStatus.CANCELLED
  };
  return statusMap[status] || BookingStatus.HOLD;
};

// Helper to format date with time
const formatDateTime = (date: Date | string, format: string): string => {
  const dayjsDate = dayjs(date);
  if (!dayjsDate.isValid()) {
    return '-';
  }
  return dayjsDate.format(format);
};

const addOneHourToTime = (time: string): string => {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = parseInt(hoursStr || '0', 10);
  const minutes = parseInt(minutesStr || '0', 10);
  return dayjs().hour(hours).minute(minutes).add(1, 'hour').format('HH:mm');
};

interface BookingCell {
  booking: Booking;
  detail: BookingDetail;
  customerName: string;
  customerPhone: string;
  status: BookingStatus;
}

export default function SchedulePage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedDateString = formatDateString(selectedDate);

  // Generate standard time slots (06:00 to 23:00)
  const standardTimeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 6; hour <= 23; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  // Fetch courts
  const { data: courtsData, isLoading: isCourtsLoading } = useQuery(adminCourtsQueryOptions());
  const courts = useMemo(
    () => (courtsData || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [courtsData]
  );

  // Fetch all bookings - we'll filter by slot date on client side
  // Fetch without date filters to ensure we get all bookings, then filter by slot date
  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery(
    adminScheduleQueryOptions()
  );
  const allBookings = bookingsData || [];

  // Filter bookings that have slots on the selected date
  const bookings = useMemo(() => {
    return allBookings.filter((booking) => {
      if (!booking.details || booking.details.length === 0) return false;

      return booking.details.some((detail) => {
        if (!detail.slot) return false;
        const slotDate = getDateStringFromISO(detail.slot.startAt);
        return slotDate === selectedDateString;
      });
    });
  }, [allBookings, selectedDateString]);

  // Fetch slots for the selected date to get all time slots (optional - for dynamic slots)
  const { data: slotsData, isLoading: isSlotsLoading } = useQuery(
    adminCourtsWithSlotsQueryOptions(selectedDateString)
  );
  const slots = slotsData?.slots || [];

  // Extract unique time slots with end times, or use standard time slots
  const timeSlotRanges = useMemo(() => {
    if (slots.length > 0) {
      const map = new Map<string, string>();
      slots.forEach((slot) => {
        const slotDate = getDateStringFromISO(slot.startAt);
        if (slotDate === selectedDateString) {
          const startTime = formatSlotTime(slot.startAt);
          const endTime = formatSlotTime(slot.endAt);
          if (!map.has(startTime) || (endTime && endTime > (map.get(startTime) || ''))) {
            map.set(startTime, endTime);
          }
        }
      });
      const uniqueStarts = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
      if (uniqueStarts.length > 0) {
        return uniqueStarts.map((startTime) => ({
          startTime,
          endTime: map.get(startTime) || addOneHourToTime(startTime)
        }));
      }
    }
    return standardTimeSlots.map((startTime) => ({
      startTime,
      endTime: addOneHourToTime(startTime)
    }));
  }, [slots, selectedDateString, standardTimeSlots]);

  // Create a map of bookings by court and time slot
  // Prioritize non-cancelled bookings over cancelled ones
  // For multi-hour bookings, show them in ALL time slots they span
  const bookingsMap = useMemo(() => {
    const map = new Map<string, Map<string, BookingCell>>();

    // Sort bookings to process non-cancelled ones first
    // This ensures that if there are multiple bookings for the same slot,
    // non-cancelled ones will overwrite cancelled ones
    const sortedBookings = [...bookings].sort((a, b) => {
      const statusA = getBookingStatus(a.status as number | BookingStatus);
      const statusB = getBookingStatus(b.status as number | BookingStatus);

      // Cancelled bookings should come last
      if (statusA === BookingStatus.CANCELLED && statusB !== BookingStatus.CANCELLED) return 1;
      if (statusA !== BookingStatus.CANCELLED && statusB === BookingStatus.CANCELLED) return -1;

      // Otherwise maintain original order
      return 0;
    });

    sortedBookings.forEach((booking) => {
      if (!booking.details || booking.details.length === 0) return;

      booking.details.forEach((detail) => {
        if (!detail.slot || !detail.court) return;

        const slotDate = getDateStringFromISO(detail.slot.startAt);
        if (slotDate !== selectedDateString) return;

        const courtId = detail.court.id;
        const customerName = booking.user?.name || 'Walk-in Customer';
        const customerPhone = booking.user?.phone || '-';
        const status = getBookingStatus(booking.status as number | BookingStatus);

        // Parse start and end times - API already returns correct local time
        const slotStart = dayjs(detail.slot.startAt);
        const slotEnd = dayjs(detail.slot.endAt);

        if (!map.has(courtId)) {
          map.set(courtId, new Map());
        }

        // Generate entries for ALL hour slots within the booking's time range
        // For example, a 10:00-12:00 booking should appear in both 10:00 and 11:00 slots
        timeSlotRanges.forEach(({ startTime }) => {
          // Parse the time slot start time for the selected date
          const [hours, minutes] = startTime.split(':').map(Number);
          const timeSlotStart = dayjs(selectedDateString)
            .hour(hours)
            .minute(minutes)
            .second(0)
            .millisecond(0);
          const timeSlotEnd = timeSlotStart.add(1, 'hour');

          // Check if this time slot overlaps with the booking's time range
          // A time slot overlaps if: timeSlotStart < slotEnd AND timeSlotEnd > slotStart
          const overlaps = timeSlotStart.isBefore(slotEnd) && timeSlotEnd.isAfter(slotStart);

          if (overlaps) {
            const existingCell = map.get(courtId)!.get(startTime);

            // Only set if there's no existing booking, or if the existing one is cancelled and this one is not
            if (
              !existingCell ||
              (existingCell.status === BookingStatus.CANCELLED &&
                status !== BookingStatus.CANCELLED)
            ) {
              map.get(courtId)!.set(startTime, {
                booking,
                detail,
                customerName,
                customerPhone,
                status
              });
            }
          }
        });
      });
    });

    return map;
  }, [bookings, selectedDateString, timeSlotRanges]);

  const isLoading = isCourtsLoading || isBookingsLoading || isSlotsLoading;

  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Jadwal Lapangan" />
          <SectionDescription description="Lihat jadwal pemesanan lapangan untuk tanggal tertentu." />
        </SectionHeader>
        <SectionContent>
          <div className="space-y-6">
            {/* Date Filter */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Tanggal</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full gap-2 sm:w-auto">
                      <IconCalendar className="h-4 w-4" />
                      <span>{formatDate(selectedDate, 'DD MMM YYYY')}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setCalendarOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {/* Schedule Table */}
            <Card>
              <CardHeader>
                <CardTitle>Jadwal {formatDate(selectedDate, 'DD MMM YYYY')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground text-sm">Memuat jadwal...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {courts.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-muted-foreground mb-4 text-sm">
                          Tidak ada lapangan tersedia.
                        </p>
                        {/* Show empty table structure */}
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="border-border bg-muted sticky left-0 z-10 w-[150px] max-w-[150px] min-w-[150px] border px-4 py-2 text-left text-sm font-semibold">
                                Waktu
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {timeSlotRanges.map((timeSlot) => (
                              <tr key={timeSlot.startTime}>
                                <td className="border-border bg-background sticky left-0 z-10 w-[150px] max-w-[150px] min-w-[150px] border px-4 py-3 text-sm font-medium">
                                  {timeSlot.startTime} - {timeSlot.endTime}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="border-border bg-muted sticky left-0 z-10 w-[150px] max-w-[150px] min-w-[150px] border px-4 py-2 text-left text-sm font-semibold">
                              Waktu
                            </th>
                            {courts.map((court) => (
                              <th
                                key={court.id}
                                className="border-border bg-muted min-w-[200px] border px-4 py-2 text-center text-sm font-semibold"
                              >
                                {court.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {timeSlotRanges.map(({ startTime, endTime }) => (
                            <tr key={startTime} className="hover:bg-muted/50 transition-colors">
                              <td className="border-border bg-background sticky left-0 z-10 w-[150px] max-w-[150px] min-w-[150px] border px-4 py-3 text-sm font-medium">
                                {startTime} - {endTime}
                              </td>
                              {courts.map((court) => {
                                const bookingCell = bookingsMap.get(court.id)?.get(startTime);
                                const status = bookingCell?.status || BookingStatus.HOLD;
                                const isBooked = !!bookingCell;

                                // Get color classes based on status
                                const statusClasses = {
                                  [BookingStatus.HOLD]:
                                    'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
                                  [BookingStatus.CONFIRMED]:
                                    'bg-green-50 border-green-200 hover:bg-green-100',
                                  [BookingStatus.CANCELLED]:
                                    'bg-red-50 border-red-200 hover:bg-red-100'
                                };

                                return (
                                  <td
                                    key={court.id}
                                    className={cn(
                                      'border px-2 py-2 text-center transition-colors',
                                      isBooked
                                        ? cn('cursor-pointer', statusClasses[status])
                                        : 'border-border bg-background'
                                    )}
                                  >
                                    {bookingCell ? (
                                      <ManagedDialog
                                        id={`schedule-booking-${bookingCell.booking.id}-${court.id}-${startTime}`}
                                      >
                                        <DialogTrigger asChild>
                                          <div className="space-y-1">
                                            <div className="rounded px-2 py-1.5 text-xs">
                                              <div className="mb-1 flex items-center justify-center gap-1">
                                                <div className="truncate text-xs font-semibold">
                                                  {bookingCell.customerName}
                                                </div>
                                                <Badge
                                                  variant={BOOKING_STATUS_BADGE_VARIANT[status]}
                                                  className="h-4 px-1 py-0 text-[10px]"
                                                >
                                                  {BOOKING_STATUS_MAP[status]}
                                                </Badge>
                                              </div>
                                              <div className="text-muted-foreground text-[10px]">
                                                {formatPhone(bookingCell.customerPhone)}
                                              </div>
                                              {/* Show add-ons indicators */}
                                              {(() => {
                                                // Check if coaches is BookingCoach[] or Staff[]
                                                const coachesArray =
                                                  bookingCell.booking.coaches || [];
                                                const isBookingCoachArray =
                                                  coachesArray.length > 0 &&
                                                  'slot' in coachesArray[0];
                                                const bookingCoaches = isBookingCoachArray
                                                  ? (coachesArray as any[] as BookingCoach[])
                                                  : bookingCell.booking.bookingCoaches || [];
                                                const staffCoaches = !isBookingCoachArray
                                                  ? (coachesArray as any[] as Staff[])
                                                  : [];

                                                // Get coach names
                                                const coachNames: string[] = [];
                                                bookingCoaches.forEach((bookingCoach) => {
                                                  const coach = bookingCoach.slot?.staff;
                                                  if (coach?.name) {
                                                    coachNames.push(coach.name);
                                                  }
                                                });
                                                staffCoaches.forEach((coach) => {
                                                  if (coach.name) {
                                                    coachNames.push(coach.name);
                                                  }
                                                });

                                                // Get inventory names
                                                const inventoriesArray =
                                                  bookingCell.booking.inventories || [];
                                                const isBookingInventoryArray =
                                                  inventoriesArray.length > 0 &&
                                                  'inventory' in inventoriesArray[0];
                                                const inventoryNames: string[] = [];

                                                if (isBookingInventoryArray) {
                                                  (
                                                    inventoriesArray as any[] as BookingInventory[]
                                                  ).forEach((bookingInventory) => {
                                                    if (bookingInventory.inventory?.name) {
                                                      inventoryNames.push(
                                                        bookingInventory.inventory.name
                                                      );
                                                    }
                                                  });
                                                } else {
                                                  (
                                                    inventoriesArray as any[] as Inventory[]
                                                  ).forEach((inventory) => {
                                                    if (inventory.name) {
                                                      inventoryNames.push(inventory.name);
                                                    }
                                                  });
                                                }

                                                const hasCoaches = coachNames.length > 0;
                                                const hasInventories = inventoryNames.length > 0;

                                                if (!hasCoaches && !hasInventories) return null;

                                                // Build display text
                                                const parts: string[] = [];
                                                if (hasCoaches) {
                                                  const coachDisplay =
                                                    coachNames.length === 1
                                                      ? coachNames[0]
                                                      : `${coachNames[0]}${coachNames.length > 1 ? ` +${coachNames.length - 1}` : ''}`;
                                                  parts.push(`Coach: ${coachDisplay}`);
                                                }
                                                if (hasInventories) {
                                                  const inventoryDisplay =
                                                    inventoryNames.length === 1
                                                      ? inventoryNames[0]
                                                      : `${inventoryNames[0]}${inventoryNames.length > 1 ? ` +${inventoryNames.length - 1}` : ''}`;
                                                  parts.push(`Inventory: ${inventoryDisplay}`);
                                                }

                                                return (
                                                  <div className="mt-1 flex items-center justify-center">
                                                    <Badge
                                                      variant="outline"
                                                      className="h-4 border-gray-200 bg-gray-50 px-1.5 py-0 text-[9px] text-gray-700"
                                                    >
                                                      {parts.join(', ')}
                                                    </Badge>
                                                  </div>
                                                );
                                              })()}
                                            </div>
                                          </div>
                                        </DialogTrigger>
                                        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col">
                                          <DialogHeader className="mb-4 shrink-0">
                                            <DialogTitle>Detail Pemesanan</DialogTitle>
                                          </DialogHeader>
                                          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <p className="text-muted-foreground text-sm">
                                                  ID Pemesanan
                                                </p>
                                                <p className="font-mono text-sm">
                                                  {bookingCell.booking.id}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground text-sm">
                                                  Status
                                                </p>
                                                <Badge
                                                  variant={BOOKING_STATUS_BADGE_VARIANT[status]}
                                                >
                                                  {BOOKING_STATUS_MAP[status]}
                                                </Badge>
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground text-sm">
                                                  Pelanggan
                                                </p>
                                                <p className="font-medium">
                                                  {bookingCell.customerName}
                                                </p>
                                                {bookingCell.customerPhone &&
                                                  bookingCell.customerPhone !== '-' && (
                                                    <p className="text-muted-foreground text-xs">
                                                      {formatPhone(bookingCell.customerPhone)}
                                                    </p>
                                                  )}
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground text-sm">
                                                  Total Harga
                                                </p>
                                                <p className="font-medium">
                                                  Rp{' '}
                                                  {new Intl.NumberFormat('id-ID').format(
                                                    bookingCell.booking.totalPrice +
                                                      (bookingCell.booking.processingFee || 0)
                                                  )}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground text-sm">
                                                  Dibuat Pada
                                                </p>
                                                <p className="text-sm">
                                                  {formatDateTime(
                                                    bookingCell.booking.createdAt,
                                                    'DD/MM/YYYY HH:mm'
                                                  )}
                                                </p>
                                              </div>
                                              {bookingCell.booking.holdExpiresAt && (
                                                <div>
                                                  <p className="text-muted-foreground text-sm">
                                                    Kedaluwarsa
                                                  </p>
                                                  <p className="text-sm">
                                                    {formatDateTime(
                                                      bookingCell.booking.holdExpiresAt,
                                                      'DD/MM/YYYY HH:mm'
                                                    )}
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                            {bookingCell.booking.details &&
                                              bookingCell.booking.details.length > 0 && (
                                                <div className="border-t pt-4">
                                                  <p className="mb-2 text-sm font-medium">
                                                    Detail Slot
                                                  </p>
                                                  <div className="space-y-2">
                                                    {bookingCell.booking.details.map((detail) => (
                                                      <div
                                                        key={detail.id}
                                                        className="bg-muted/50 rounded-lg border p-3"
                                                      >
                                                        <div className="flex items-start justify-between">
                                                          <div>
                                                            <p className="text-sm font-medium">
                                                              {detail.court?.name || '-'}
                                                            </p>
                                                            {detail.slot && (
                                                              <p className="text-muted-foreground text-xs">
                                                                {formatDate(
                                                                  detail.slot.startAt,
                                                                  'DD MMM YYYY'
                                                                )}{' '}
                                                                -{' '}
                                                                {formatSlotTime(
                                                                  detail.slot.startAt
                                                                )}{' '}
                                                                -{' '}
                                                                {formatSlotTime(detail.slot.endAt)}
                                                              </p>
                                                            )}
                                                          </div>
                                                          <p className="text-base font-medium">
                                                            Rp{' '}
                                                            {new Intl.NumberFormat('id-ID').format(
                                                              detail.price
                                                            )}
                                                          </p>
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            {/* Coaches Section */}
                                            {(() => {
                                              // Check if coaches is BookingCoach[] or Staff[]
                                              const coachesArray =
                                                bookingCell.booking.coaches || [];
                                              const isBookingCoachArray =
                                                coachesArray.length > 0 &&
                                                'slot' in coachesArray[0];
                                              const bookingCoaches = isBookingCoachArray
                                                ? (coachesArray as any[] as BookingCoach[])
                                                : bookingCell.booking.bookingCoaches || [];
                                              const staffCoaches = !isBookingCoachArray
                                                ? (coachesArray as any[] as Staff[])
                                                : [];

                                              const totalCoaches =
                                                bookingCoaches.length + staffCoaches.length;

                                              if (totalCoaches === 0) return null;

                                              return (
                                                <div className="border-t pt-4">
                                                  <div className="mb-3 flex items-center gap-2">
                                                    <IconUser className="h-4 w-4 text-blue-600" />
                                                    <p className="text-sm font-medium">
                                                      Coaches ({totalCoaches})
                                                    </p>
                                                  </div>
                                                  <div className="space-y-2">
                                                    {/* Display BookingCoach[] with slot details */}
                                                    {bookingCoaches.map((bookingCoach) => {
                                                      const coach = bookingCoach.slot?.staff;
                                                      const coachDescription =
                                                        (bookingCoach as any).description ??
                                                        (bookingCoach as any).coachDescription ??
                                                        null;
                                                      return (
                                                        <div
                                                          key={bookingCoach.id}
                                                          className="rounded-lg border border-blue-200 bg-blue-50 p-3"
                                                        >
                                                          <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                              <div className="mb-1 flex items-center gap-2">
                                                                <p className="text-sm font-semibold">
                                                                  {coach?.name || 'Unknown Coach'}
                                                                </p>
                                                                {coach?.role && (
                                                                  <Badge
                                                                    variant="outline"
                                                                    className="h-4 px-1.5 py-0 text-[10px]"
                                                                  >
                                                                    {coach.role}
                                                                  </Badge>
                                                                )}
                                                                {bookingCoach.bookingCoachType && (
                                                                  <Badge
                                                                    variant="outline"
                                                                    className="h-4 bg-blue-100 px-1.5 py-0 text-[10px]"
                                                                  >
                                                                    {
                                                                      bookingCoach.bookingCoachType
                                                                        .name
                                                                    }
                                                                  </Badge>
                                                                )}
                                                              </div>
                                                              <div className="space-y-0.5">
                                                                {bookingCoach.slot && (
                                                                  <p className="mb-1 text-xs font-medium text-blue-700">
                                                                    🕐{' '}
                                                                    {formatSlotTime(
                                                                      bookingCoach.slot.startAt
                                                                    )}{' '}
                                                                    -{' '}
                                                                    {formatSlotTime(
                                                                      bookingCoach.slot.endAt
                                                                    )}
                                                                  </p>
                                                                )}
                                                                {coach?.phone && (
                                                                  <p className="text-muted-foreground text-xs">
                                                                    📞 {formatPhone(coach.phone)}
                                                                  </p>
                                                                )}
                                                                {coach?.email && (
                                                                  <p className="text-muted-foreground text-xs">
                                                                    ✉️ {coach.email}
                                                                  </p>
                                                                )}
                                                                {coachDescription && (
                                                                  <p className="text-muted-foreground mt-1 text-xs whitespace-pre-line">
                                                                    📝 {coachDescription}
                                                                  </p>
                                                                )}
                                                                {bookingCoach.price !==
                                                                  undefined && (
                                                                  <p className="mt-1 text-xs font-medium text-blue-700">
                                                                    💰 Rp{' '}
                                                                    {new Intl.NumberFormat(
                                                                      'id-ID'
                                                                    ).format(bookingCoach.price)}
                                                                  </p>
                                                                )}
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      );
                                                    })}
                                                    {/* Fallback: Display Staff[] without bookingCoach data */}
                                                    {staffCoaches.map((coach) => (
                                                      <div
                                                        key={coach.id}
                                                        className="rounded-lg border border-blue-200 bg-blue-50 p-3"
                                                      >
                                                        <div className="flex items-start justify-between gap-3">
                                                          <div className="flex-1">
                                                            <div className="mb-1 flex items-center gap-2">
                                                              <p className="text-sm font-semibold">
                                                                {coach.name}
                                                              </p>
                                                              {coach.role && (
                                                                <Badge
                                                                  variant="outline"
                                                                  className="h-4 px-1.5 py-0 text-[10px]"
                                                                >
                                                                  {coach.role}
                                                                </Badge>
                                                              )}
                                                            </div>
                                                            <div className="space-y-0.5">
                                                              {coach.phone && (
                                                                <p className="text-muted-foreground text-xs">
                                                                  📞 {formatPhone(coach.phone)}
                                                                </p>
                                                              )}
                                                              {coach.email && (
                                                                <p className="text-muted-foreground text-xs">
                                                                  ✉️ {coach.email}
                                                                </p>
                                                              )}
                                                              {coach.coachType && (
                                                                <p className="text-muted-foreground text-xs">
                                                                  🎯 Type: {coach.coachType}
                                                                </p>
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              );
                                            })()}

                                            {/* Inventories Section */}
                                            {(() => {
                                              const inventoriesArray =
                                                bookingCell.booking.inventories || [];
                                              if (inventoriesArray.length === 0) return null;

                                              // Check if inventories is BookingInventory[] or Inventory[]
                                              const isBookingInventoryArray =
                                                'inventory' in inventoriesArray[0];

                                              return (
                                                <div className="border-t pt-4">
                                                  <div className="mb-3 flex items-center gap-2">
                                                    <IconShoppingCart className="h-4 w-4 text-green-600" />
                                                    <p className="text-sm font-medium">
                                                      Inventories ({inventoriesArray.length})
                                                    </p>
                                                  </div>
                                                  <div className="space-y-2">
                                                    {isBookingInventoryArray
                                                      ? (
                                                          inventoriesArray as any[] as BookingInventory[]
                                                        ).map((bookingInventory) => {
                                                          const inventory =
                                                            bookingInventory.inventory;
                                                          if (!inventory) return null;

                                                          return (
                                                            <div
                                                              key={bookingInventory.id}
                                                              className="rounded-lg border border-green-200 bg-green-50 p-3"
                                                            >
                                                              <div className="flex items-start justify-between gap-3">
                                                                <div className="flex-1">
                                                                  <p className="mb-1 text-sm font-semibold">
                                                                    {inventory.name}
                                                                  </p>
                                                                  <div className="space-y-0.5">
                                                                    {inventory.description && (
                                                                      <p className="text-muted-foreground text-xs">
                                                                        {inventory.description}
                                                                      </p>
                                                                    )}
                                                                    <div className="mt-1 flex items-center gap-3">
                                                                      {bookingInventory.price !==
                                                                        undefined && (
                                                                        <p className="text-xs font-medium text-green-700">
                                                                          💰 Rp{' '}
                                                                          {new Intl.NumberFormat(
                                                                            'id-ID'
                                                                          ).format(
                                                                            bookingInventory.price
                                                                          )}
                                                                        </p>
                                                                      )}
                                                                      {bookingInventory.quantity !==
                                                                        undefined && (
                                                                        <p className="text-muted-foreground text-xs">
                                                                          📦 Qty:{' '}
                                                                          {
                                                                            bookingInventory.quantity
                                                                          }
                                                                        </p>
                                                                      )}
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            </div>
                                                          );
                                                        })
                                                      : (
                                                          inventoriesArray as any[] as Inventory[]
                                                        ).map((inventory) => (
                                                          <div
                                                            key={inventory.id}
                                                            className="rounded-lg border border-green-200 bg-green-50 p-3"
                                                          >
                                                            <div className="flex items-start justify-between gap-3">
                                                              <div className="flex-1">
                                                                <p className="mb-1 text-sm font-semibold">
                                                                  {inventory.name}
                                                                </p>
                                                                <div className="space-y-0.5">
                                                                  {inventory.description && (
                                                                    <p className="text-muted-foreground text-xs">
                                                                      {inventory.description}
                                                                    </p>
                                                                  )}
                                                                  <div className="mt-1 flex items-center gap-3">
                                                                    {inventory.price !==
                                                                      undefined && (
                                                                      <p className="text-xs font-medium text-green-700">
                                                                        💰 Rp{' '}
                                                                        {new Intl.NumberFormat(
                                                                          'id-ID'
                                                                        ).format(inventory.price)}
                                                                        /hr
                                                                      </p>
                                                                    )}
                                                                    {inventory.quantity !==
                                                                      undefined && (
                                                                      <p className="text-muted-foreground text-xs">
                                                                        📦 Qty: {inventory.quantity}
                                                                      </p>
                                                                    )}
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        ))}
                                                  </div>
                                                </div>
                                              );
                                            })()}

                                            {bookingCell.booking.cancellationReason && (
                                              <div className="border-t pt-4">
                                                <p className="text-muted-foreground text-sm">
                                                  Alasan Pembatalan
                                                </p>
                                                <p className="text-sm">
                                                  {bookingCell.booking.cancellationReason}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </DialogContent>
                                      </ManagedDialog>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </SectionContent>
      </Section>
    </main>
  );
}
