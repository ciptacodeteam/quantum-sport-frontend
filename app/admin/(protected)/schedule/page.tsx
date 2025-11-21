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
import {
  BOOKING_STATUS_BADGE_VARIANT,
  BOOKING_STATUS_MAP,
  BookingStatus
} from '@/lib/constants';
import { formatSlotTime } from '@/lib/time-utils';
import { formatPhone } from '@/lib/utils';
import { adminBookingsQueryOptions } from '@/queries/admin/booking';
import { adminCourtsQueryOptions, adminCourtsWithSlotsQueryOptions } from '@/queries/admin/court';
import type { Booking, BookingDetail } from '@/types/model';
import { IconCalendar } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';

// Helper to format date as YYYY-MM-DD
const formatDateString = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to extract date from ISO string or Date object
const getDateStringFromISO = (value: string | Date): string => {
  if (value instanceof Date) {
    return formatDateString(value);
  }
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})T/;
  const match = value.match(isoRegex);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return formatDateString(new Date(value));
};

// Helper to format date for display
const formatDate = (date: Date | string, format: string): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const day = dateObj.getDate();

  const pad = (n: number) => n.toString().padStart(2, '0');

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  return format
    .replace('YYYY', year.toString())
    .replace('MMM', monthNames[month])
    .replace('MM', pad(month + 1))
    .replace('DD', pad(day));
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
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const day = dateObj.getDate();
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();

  const pad = (n: number) => n.toString().padStart(2, '0');

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  return format
    .replace('YYYY', year.toString())
    .replace('MMM', monthNames[month])
    .replace('MM', pad(month + 1))
    .replace('DD', pad(day))
    .replace('HH', pad(hours))
    .replace('mm', pad(minutes));
};

const addOneHourToTime = (time: string): string => {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = parseInt(hoursStr || '0', 10);
  const minutes = parseInt(minutesStr || '0', 10);
  const totalMinutes = hours * 60 + minutes + 60;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
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
  const { data: courtsData, isLoading: isCourtsLoading } = useQuery(
    adminCourtsQueryOptions()
  );
  const courts = useMemo(
    () =>
      (courtsData || [])
        .slice()
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [courtsData]
  );

  // Fetch all bookings - we'll filter by slot date on client side
  // Fetch without date filters to ensure we get all bookings, then filter by slot date
  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery(
    adminBookingsQueryOptions()
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
  const bookingsMap = useMemo(() => {
    const map = new Map<string, Map<string, BookingCell>>();
    
    bookings.forEach((booking) => {
      if (!booking.details || booking.details.length === 0) return;
      
      booking.details.forEach((detail) => {
        if (!detail.slot || !detail.court) return;
        
        const slotDate = getDateStringFromISO(detail.slot.startAt);
        if (slotDate !== selectedDateString) return;
        
        const courtId = detail.court.id;
        const timeSlot = formatSlotTime(detail.slot.startAt);
        const customerName = booking.user?.name || 'Walk-in Customer';
        const customerPhone = booking.user?.phone || '-';
        const status = getBookingStatus(booking.status as number | BookingStatus);
        
        if (!map.has(courtId)) {
          map.set(courtId, new Map());
        }
        
        map.get(courtId)!.set(timeSlot, {
          booking,
          detail,
          customerName,
          customerPhone,
          status
        });
      });
    });
    
    return map;
  }, [bookings, selectedDateString]);

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
                    <Button variant="outline" className="w-full sm:w-auto gap-2">
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
                        <p className="text-muted-foreground text-sm mb-4">Tidak ada lapangan tersedia.</p>
                        {/* Show empty table structure */}
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="sticky left-0 z-10 border border-border bg-muted px-4 py-2 text-left font-semibold w-[150px] min-w-[150px] max-w-[150px]">
                              Waktu
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {timeSlotRanges.map((timeSlot) => (
                            <tr key={timeSlot.startTime}>
                              <td className="sticky left-0 z-10 border border-border bg-background px-4 py-3 font-medium w-[150px] min-w-[150px] max-w-[150px]">
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
                            <th className="sticky left-0 z-10 border border-border bg-muted px-4 py-2 text-left font-semibold w-[150px] min-w-[150px] max-w-[150px]">
                              Waktu
                            </th>
                            {courts.map((court) => (
                              <th
                                key={court.id}
                                className="min-w-[200px] border border-border bg-muted px-4 py-2 text-center font-semibold"
                              >
                                {court.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {timeSlotRanges.map(({ startTime, endTime }) => (
                            <tr key={startTime} className="hover:bg-muted/50 transition-colors">
                              <td className="sticky left-0 z-10 border border-border bg-background px-4 py-3 font-medium w-[150px] min-w-[150px] max-w-[150px]">
                                {startTime} - {endTime}
                              </td>
                              {courts.map((court) => {
                                const bookingCell = bookingsMap.get(court.id)?.get(startTime);
                                const status = bookingCell?.status || BookingStatus.HOLD;
                                const isBooked = !!bookingCell;
                                
                                // Get color classes based on status
                                const statusClasses = {
                                  [BookingStatus.HOLD]: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
                                  [BookingStatus.CONFIRMED]: 'bg-green-50 border-green-200 hover:bg-green-100',
                                  [BookingStatus.CANCELLED]: 'bg-red-50 border-red-200 hover:bg-red-100'
                                };

                                return (
                                  <td
                                    key={court.id}
                                    className={cn(
                                      'border px-2 py-2 text-center transition-colors',
                                      isBooked
                                        ? cn(
                                            'cursor-pointer',
                                            statusClasses[status]
                                          )
                                        : 'border-border bg-background'
                                    )}
                                  >
                                    {bookingCell ? (
                                      <ManagedDialog id={`schedule-booking-${bookingCell.booking.id}-${court.id}-${startTime}`}>
                                        <DialogTrigger asChild>
                                          <div className="space-y-1">
                                            <div className="rounded px-2 py-1.5 text-xs">
                                              <div className="flex items-center justify-center gap-1 mb-1">
                                                <div className="font-semibold text-xs truncate">
                                                  {bookingCell.customerName}
                                                </div>
                                                <Badge
                                                  variant={BOOKING_STATUS_BADGE_VARIANT[status]}
                                                  className="text-[10px] px-1 py-0 h-4"
                                                >
                                                  {BOOKING_STATUS_MAP[status]}
                                                </Badge>
                                              </div>
                                              <div className="text-muted-foreground text-[10px]">
                                                {formatPhone(bookingCell.customerPhone)}
                                              </div>
                                            </div>
                                          </div>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                          <DialogHeader className="mb-4">
                                            <DialogTitle>Detail Pemesanan</DialogTitle>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <p className="text-muted-foreground text-sm">ID Pemesanan</p>
                                                <p className="font-mono text-sm">{bookingCell.booking.id}</p>
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground text-sm">Status</p>
                                                <Badge variant={BOOKING_STATUS_BADGE_VARIANT[status]}>
                                                  {BOOKING_STATUS_MAP[status]}
                                                </Badge>
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground text-sm">Pelanggan</p>
                                                <p className="font-medium">{bookingCell.customerName}</p>
                                                {bookingCell.customerPhone && bookingCell.customerPhone !== '-' && (
                                                  <p className="text-muted-foreground text-xs">
                                                    {formatPhone(bookingCell.customerPhone)}
                                                  </p>
                                                )}
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground text-sm">Total Harga</p>
                                                <p className="font-medium">
                                                  Rp{' '}
                                                  {new Intl.NumberFormat('id-ID').format(
                                                    bookingCell.booking.totalPrice +
                                                      (bookingCell.booking.processingFee || 0)
                                                  )}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground text-sm">Dibuat Pada</p>
                                                <p className="text-sm">
                                                  {formatDateTime(bookingCell.booking.createdAt, 'DD/MM/YYYY HH:mm')}
                                                </p>
                                              </div>
                                              {bookingCell.booking.holdExpiresAt && (
                                                <div>
                                                  <p className="text-muted-foreground text-sm">Kedaluwarsa</p>
                                                  <p className="text-sm">
                                                    {formatDateTime(
                                                      bookingCell.booking.holdExpiresAt,
                                                      'DD/MM/YYYY HH:mm'
                                                    )}
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                            {bookingCell.booking.details && bookingCell.booking.details.length > 0 && (
                                              <div className="border-t pt-4">
                                                <p className="mb-2 text-sm font-medium">Detail Slot</p>
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
                                                              {formatDate(detail.slot.startAt, 'DD MMM YYYY')} -{' '}
                                                              {formatSlotTime(detail.slot.startAt)} -{' '}
                                                              {formatSlotTime(detail.slot.endAt)}
                                                            </p>
                                                          )}
                                                        </div>
                                                        <p className="text-base font-medium">
                                                          Rp {new Intl.NumberFormat('id-ID').format(detail.price)}
                                                        </p>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            {bookingCell.booking.cancellationReason && (
                                              <div className="border-t pt-4">
                                                <p className="text-muted-foreground text-sm">Alasan Pembatalan</p>
                                                <p className="text-sm">{bookingCell.booking.cancellationReason}</p>
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

