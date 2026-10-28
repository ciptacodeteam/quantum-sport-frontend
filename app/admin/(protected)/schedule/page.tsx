'use client';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';

import { BookingBallboySection } from '@/components/admin/bookings/BookingBallboySection';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  BookingStatus,
  getCoachTypeLabel
} from '@/lib/constants';
import { formatSlotTime } from '@/lib/time-utils';
import { formatPhone } from '@/lib/utils';
import { adminScheduleQueryOptions } from '@/queries/admin/booking';
import { adminCourtsQueryOptions, adminCourtsWithSlotsQueryOptions } from '@/queries/admin/court';
import type {
  Booking,
  BookingDetail,
  BookingCoach,
  BookingBallboy,
  BookingInventory,
  Staff,
  Inventory
} from '@/types/model';
import {
  IconCalendar,
  IconUser,
  IconShoppingCart,
  IconMaximize,
  IconMinimize,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useMemo, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

// Helper to parse datetime string - handles both ISO format and space-separated format
const parseDatetime = (value: string | Date): dayjs.Dayjs => {
  if (value instanceof Date) {
    return dayjs(value);
  }

  // Check if it's space-separated format "YYYY-MM-DD HH:mm:ss"
  if (typeof value === 'string' && value.includes(' ') && !value.includes('T')) {
    // Parse as "YYYY-MM-DD HH:mm:ss" format
    return dayjs(value, 'YYYY-MM-DD HH:mm:ss');
  }

  // Otherwise parse as ISO or standard format
  return dayjs(value);
};

// Helper to format date as YYYY-MM-DD
const formatDateString = (date: Date | string): string => {
  return parseDatetime(date).format('YYYY-MM-DD');
};

// Helper to extract date from ISO string or Date object
const getDateStringFromISO = (value: string | Date): string => {
  return parseDatetime(value).format('YYYY-MM-DD');
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

const getBookingDetailChargedPrice = (detail: BookingDetail) => detail.price;

const getBookingCourtTotal = (booking: Booking) =>
  booking.details?.reduce((total, detail) => total + getBookingDetailChargedPrice(detail), 0) ?? 0;

const timeRangesOverlap = (
  first: { startAt?: string | Date | null; endAt?: string | Date | null },
  second: { startAt?: string | Date | null; endAt?: string | Date | null }
) => {
  if (!first.startAt || !first.endAt || !second.startAt || !second.endAt) return false;

  const firstStart = parseDatetime(first.startAt);
  const firstEnd = parseDatetime(first.endAt);
  const secondStart = parseDatetime(second.startAt);
  const secondEnd = parseDatetime(second.endAt);

  return firstStart.isBefore(secondEnd) && firstEnd.isAfter(secondStart);
};

const coachMatchesCourtSport = (coach: BookingCoach, courtSport: 'PADEL' | 'TENNIS') => {
  const coachType = coach.slot?.staff?.coachType;

  if (!coachType || coachType === 'PADEL_TENNIS') {
    return true;
  }

  return coachType === courtSport;
};

const mergeBallboys = (
  current: BookingBallboy[] | undefined,
  incoming: BookingBallboy[]
): BookingBallboy[] => {
  const map = new Map<string, BookingBallboy>();

  current?.forEach((ballboy) => map.set(ballboy.id, ballboy));
  incoming.forEach((ballboy) => map.set(ballboy.id, ballboy));

  return Array.from(map.values());
};

const mergeCoaches = (
  current: BookingCoach[] | undefined,
  incoming: BookingCoach[]
): BookingCoach[] => {
  const map = new Map<string, BookingCoach>();

  current?.forEach((coach) => map.set(coach.id, coach));
  incoming.forEach((coach) => map.set(coach.id, coach));

  return Array.from(map.values());
};

const mergeInventories = (
  current: BookingInventory[] | undefined,
  incoming: BookingInventory[]
): BookingInventory[] => {
  const map = new Map<string, BookingInventory>();

  current?.forEach((inventory) => map.set(inventory.id, inventory));
  incoming.forEach((inventory) => map.set(inventory.id, inventory));

  return Array.from(map.values());
};

const getCoachesForBookingCell = (bookingCell: BookingCell): BookingCoach[] => {
  const coaches = (bookingCell.booking.coaches || []) as BookingCoach[];
  const detailSlot = bookingCell.detail.slot;

  if (!detailSlot) return [];

  return coaches.filter((coach) => {
    if (!coach.slot) return false;
    return timeRangesOverlap(coach.slot, detailSlot);
  });
};

const getInventoriesForBookingCell = (bookingCell: BookingCell): BookingInventory[] => {
  const inventories = (bookingCell.booking.inventories || []) as BookingInventory[];
  const detailSlot = bookingCell.detail.slot;

  if (!detailSlot) return [];

  return inventories.filter((inventory) => {
    if (!inventory.slot) return true;
    return timeRangesOverlap(inventory.slot, detailSlot);
  });
};

const getBallboysForBookingCell = (bookingCell: BookingCell): BookingBallboy[] => {
  const ballboys = (bookingCell.booking.ballboys || []) as BookingBallboy[];
  const detailSlot = bookingCell.detail.slot;
  const detailCourtId = bookingCell.detail.court?.id;

  if (!detailSlot) return [];

  return ballboys.filter((ballboy) => {
    if (!ballboy.slot || !timeRangesOverlap(ballboy.slot, detailSlot)) {
      return false;
    }

    if (ballboy.courtSlot?.court?.id) {
      return ballboy.courtSlot.court.id === detailCourtId;
    }

    if (ballboy.courtSlot) {
      return timeRangesOverlap(ballboy.courtSlot, detailSlot);
    }

    return true;
  });
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
  const { branchId: activeBranchId } = useAdminCourtSports();
  const [courtSport, setCourtSport] = useState<'PADEL' | 'TENNIS'>('PADEL');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const selectedDateString = formatDateString(selectedDate);

  // Handle escape key to exit full screen
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

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
    adminCourtsQueryOptions({ courtSport })
  );
  const courts = useMemo(
    () =>
      (courtsData || [])
        .filter((court) => court.sport === courtSport)
        .slice()
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [courtsData, courtSport]
  );

  // Fetch all bookings - we'll filter by slot date on client side
  // Fetch without date filters to ensure we get all bookings, then filter by slot date
  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery(
    adminScheduleQueryOptions({ courtSport })
  );
  const allBookings = bookingsData || [];

  // Filter bookings that have slots on the selected date
  const bookings = useMemo(() => {
    return allBookings.filter((booking) => {
      const hasCourtSlotOnDate = booking.details?.some((detail) => {
        if (!detail.slot) return false;
        const slotDate = getDateStringFromISO(detail.slot.startAt);
        return slotDate === selectedDateString;
      });

      if (hasCourtSlotOnDate) return true;

      const hasBallboySlotOnDate = booking.ballboys?.some((ballboy) => {
        const scheduleSlot = ballboy.courtSlot ?? ballboy.slot;
        if (!scheduleSlot?.startAt) return false;
        const slotDate = getDateStringFromISO(scheduleSlot.startAt);
        return slotDate === selectedDateString;
      });

      if (hasBallboySlotOnDate) return true;

      return booking.coaches?.some((coach) => {
        if (!('slot' in coach) || !coach.slot?.startAt) return false;
        const slotDate = getDateStringFromISO(coach.slot.startAt);
        return slotDate === selectedDateString;
      });
    });
  }, [allBookings, selectedDateString]);

  // Fetch slots for the selected date to get all time slots (optional - for dynamic slots)
  const { data: slotsData, isLoading: isSlotsLoading } = useQuery(
    adminCourtsWithSlotsQueryOptions(selectedDateString, undefined, courtSport)
  );
  const slots = slotsData?.slots || [];

  // Extract unique time slots with end times, or use standard time slots
  const timeSlotRanges = useMemo(() => {
    const map = new Map<string, string>();

    // Add time slots from API slots data
    if (slots.length > 0) {
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
    }

    // Also add time slots from bookings to ensure booked slots are visible even if not in slots API
    bookings.forEach((booking) => {
      booking.details?.forEach((detail) => {
        if (detail.slot) {
          const slotDate = getDateStringFromISO(detail.slot.startAt);
          if (slotDate === selectedDateString) {
            const startTime = formatSlotTime(detail.slot.startAt);
            const endTime = formatSlotTime(detail.slot.endAt);
            if (!map.has(startTime) || (endTime && endTime > (map.get(startTime) || ''))) {
              map.set(startTime, endTime);
            }
          }
        }
      });
    });

    const uniqueStarts = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
    if (uniqueStarts.length > 0) {
      return uniqueStarts.map((startTime) => ({
        startTime,
        endTime: map.get(startTime) || addOneHourToTime(startTime)
      }));
    }

    // Fallback to standard time slots if no slots or bookings
    return standardTimeSlots.map((startTime) => ({
      startTime,
      endTime: addOneHourToTime(startTime)
    }));
  }, [slots, selectedDateString, standardTimeSlots, bookings]);

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
      booking.details?.forEach((detail) => {
        if (!detail.slot || !detail.court) return;

        const slotDate = getDateStringFromISO(detail.slot.startAt);

        if (slotDate !== selectedDateString) return;

        const courtId = detail.court.id;
        const customerName = booking.user?.name || 'Walk-in Customer';
        const customerPhone = booking.user?.phone || '-';
        const status = getBookingStatus(booking.status as number | BookingStatus);

        // Parse start and end times - handles both ISO and space-separated formats
        const slotStart = parseDatetime(detail.slot.startAt);
        const slotEnd = parseDatetime(detail.slot.endAt);

        if (!map.has(courtId)) {
          map.set(courtId, new Map());
        }

        // Generate entries for ALL hour slots within the booking's time range
        // For example, a 10:00-12:00 booking should appear in both 10:00 and 11:00 slots
        timeSlotRanges.forEach(({ startTime }) => {
          // Create a datetime for this time slot on the selected date
          const timeSlotDateTime = parseDatetime(`${selectedDateString} ${startTime}:00`);

          // Check if this time slot falls within the booking's time range
          // A slot matches if its start time is >= booking start AND < booking end
          const isWithinRange =
            (timeSlotDateTime.isSame(slotStart) || timeSlotDateTime.isAfter(slotStart)) &&
            timeSlotDateTime.isBefore(slotEnd);

          if (isWithinRange) {
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

    sortedBookings.forEach((booking) => {
      const status = getBookingStatus(booking.status as number | BookingStatus);
      if (status === BookingStatus.CANCELLED) return;

      const bookingCoaches = (booking.coaches || []).filter(
        (coach): coach is BookingCoach => 'slot' in coach
      );

      bookingCoaches.forEach((coach) => {
        const coachSlot = coach.slot;
        if (!coachSlot?.startAt || !coachSlot.endAt) return;
        if (!coachMatchesCourtSport(coach, courtSport)) return;

        let placements = (booking.details || [])
          .filter((detail) => {
            if (!detail.court?.id || !detail.slot) return false;
            if (detail.court.sport !== courtSport) return false;
            return timeRangesOverlap(coachSlot, detail.slot);
          })
          .map((detail) => ({
            courtId: detail.court!.id,
            slot: detail.slot!
          }));

        if (placements.length === 0) {
          const inferredPlacements: Array<{
            courtId: string;
            slot: NonNullable<BookingDetail['slot']>;
          }> = [];
          const coachUserId = booking.userId ?? booking.user?.id;
          const coachPhone = booking.user?.phone;

          map.forEach((courtCells, courtId) => {
            courtCells.forEach((cell) => {
              const cellUserId = cell.booking.userId ?? cell.booking.user?.id;
              const cellPhone = cell.booking.user?.phone;
              const sameCustomer =
                (coachUserId && cellUserId && coachUserId === cellUserId) ||
                (coachPhone && cellPhone && coachPhone === cellPhone);

              if (!sameCustomer || !cell.detail.slot || !cell.detail.court) return;
              if (cell.detail.court.sport !== courtSport) return;
              if (!timeRangesOverlap(coachSlot, cell.detail.slot)) return;

              if (
                inferredPlacements.some(
                  (placement) =>
                    placement.courtId === courtId && placement.slot.id === cell.detail.slot?.id
                )
              ) {
                return;
              }

              inferredPlacements.push({
                courtId,
                slot: cell.detail.slot
              });
            });
          });

          placements = inferredPlacements;
        }

        placements.forEach(({ courtId, slot }) => {
          if (!slot.startAt || !slot.endAt) return;

          const slotDate = getDateStringFromISO(slot.startAt);
          if (slotDate !== selectedDateString) return;

          const slotStart = parseDatetime(slot.startAt);
          const slotEnd = parseDatetime(slot.endAt);

          if (!map.has(courtId)) {
            map.set(courtId, new Map());
          }

          timeSlotRanges.forEach(({ startTime }) => {
            const timeSlotDateTime = parseDatetime(`${selectedDateString} ${startTime}:00`);
            const isWithinRange =
              (timeSlotDateTime.isSame(slotStart) || timeSlotDateTime.isAfter(slotStart)) &&
              timeSlotDateTime.isBefore(slotEnd);

            if (!isWithinRange) return;

            const existingCell = map.get(courtId)!.get(startTime);
            if (!existingCell) return;

            map.get(courtId)!.set(startTime, {
              ...existingCell,
              booking: {
                ...existingCell.booking,
                coaches: mergeCoaches((existingCell.booking.coaches || []) as BookingCoach[], [
                  coach
                ])
              }
            });
          });
        });
      });

      booking.ballboys?.forEach((ballboy) => {
        const ballboySlot = ballboy.slot;
        if (!ballboySlot?.startAt || !ballboySlot.endAt) return;

        let placements =
          ballboy.courtSlot?.court?.id && ballboy.courtSlot.startAt && ballboy.courtSlot.endAt
            ? [
                {
                  courtId: ballboy.courtSlot.court.id,
                  slot: ballboy.courtSlot
                }
              ]
            : (booking.details || [])
                .filter((detail) => {
                  if (!detail.court?.id || !detail.slot) return false;
                  if (detail.court.sport !== courtSport) return false;
                  return timeRangesOverlap(ballboySlot, detail.slot);
                })
                .map((detail) => ({
                  courtId: detail.court!.id,
                  slot: detail.slot!
                }));

        if (placements.length === 0) {
          const inferredPlacements: Array<{
            courtId: string;
            slot: NonNullable<BookingDetail['slot']>;
          }> = [];
          const ballboyUserId = booking.userId ?? booking.user?.id;
          const ballboyPhone = booking.user?.phone;

          map.forEach((courtCells, courtId) => {
            courtCells.forEach((cell) => {
              const cellUserId = cell.booking.userId ?? cell.booking.user?.id;
              const cellPhone = cell.booking.user?.phone;
              const sameCustomer =
                (ballboyUserId && cellUserId && ballboyUserId === cellUserId) ||
                (ballboyPhone && cellPhone && ballboyPhone === cellPhone);

              if (!sameCustomer || !cell.detail.slot || !cell.detail.court) return;
              if (cell.detail.court.sport !== courtSport) return;
              if (!timeRangesOverlap(ballboySlot, cell.detail.slot)) return;

              if (
                inferredPlacements.some(
                  (placement) =>
                    placement.courtId === courtId && placement.slot.id === cell.detail.slot?.id
                )
              ) {
                return;
              }

              inferredPlacements.push({
                courtId,
                slot: cell.detail.slot
              });
            });
          });

          placements = inferredPlacements;
        }

        placements.forEach(({ courtId, slot }) => {
          if (!slot.startAt || !slot.endAt) return;

          const slotDate = getDateStringFromISO(slot.startAt);
          if (slotDate !== selectedDateString) return;

          const slotStart = parseDatetime(slot.startAt);
          const slotEnd = parseDatetime(slot.endAt);

          if (!map.has(courtId)) {
            map.set(courtId, new Map());
          }

          timeSlotRanges.forEach(({ startTime }) => {
            const timeSlotDateTime = parseDatetime(`${selectedDateString} ${startTime}:00`);
            const isWithinRange =
              (timeSlotDateTime.isSame(slotStart) || timeSlotDateTime.isAfter(slotStart)) &&
              timeSlotDateTime.isBefore(slotEnd);

            if (!isWithinRange) return;

            const existingCell = map.get(courtId)!.get(startTime);
            if (!existingCell) return;

            map.get(courtId)!.set(startTime, {
              ...existingCell,
              booking: {
                ...existingCell.booking,
                ballboys: mergeBallboys((existingCell.booking.ballboys || []) as BookingBallboy[], [
                  ballboy as BookingBallboy
                ])
              }
            });
          });
        });
      });

      booking.inventories?.forEach((inventory) => {
        const inventorySlot = inventory.slot;
        if (!inventorySlot?.startAt || !inventorySlot.endAt) return;
        if (inventory.inventory?.sport && inventory.inventory.sport !== courtSport) return;

        let placements = (booking.details || [])
          .filter((detail) => {
            if (!detail.court?.id || !detail.slot) return false;
            if (detail.court.sport !== courtSport) return false;
            return timeRangesOverlap(inventorySlot, detail.slot);
          })
          .map((detail) => ({
            courtId: detail.court!.id,
            slot: detail.slot!
          }));

        if (placements.length === 0) {
          const inferredPlacements: Array<{
            courtId: string;
            slot: NonNullable<BookingDetail['slot']>;
          }> = [];
          const inventoryUserId = booking.userId ?? booking.user?.id;
          const inventoryPhone = booking.user?.phone;

          map.forEach((courtCells, courtId) => {
            courtCells.forEach((cell) => {
              const cellUserId = cell.booking.userId ?? cell.booking.user?.id;
              const cellPhone = cell.booking.user?.phone;
              const sameCustomer =
                (inventoryUserId && cellUserId && inventoryUserId === cellUserId) ||
                (inventoryPhone && cellPhone && inventoryPhone === cellPhone);

              if (!sameCustomer || !cell.detail.slot || !cell.detail.court) return;
              if (cell.detail.court.sport !== courtSport) return;
              if (!timeRangesOverlap(inventorySlot, cell.detail.slot)) return;

              if (
                inferredPlacements.some(
                  (placement) =>
                    placement.courtId === courtId && placement.slot.id === cell.detail.slot?.id
                )
              ) {
                return;
              }

              inferredPlacements.push({
                courtId,
                slot: cell.detail.slot
              });
            });
          });

          placements = inferredPlacements;
        }

        placements.forEach(({ courtId, slot }) => {
          if (!slot.startAt || !slot.endAt) return;

          const slotDate = getDateStringFromISO(slot.startAt);
          if (slotDate !== selectedDateString) return;

          const slotStart = parseDatetime(slot.startAt);
          const slotEnd = parseDatetime(slot.endAt);

          if (!map.has(courtId)) {
            map.set(courtId, new Map());
          }

          timeSlotRanges.forEach(({ startTime }) => {
            const timeSlotDateTime = parseDatetime(`${selectedDateString} ${startTime}:00`);
            const isWithinRange =
              (timeSlotDateTime.isSame(slotStart) || timeSlotDateTime.isAfter(slotStart)) &&
              timeSlotDateTime.isBefore(slotEnd);

            if (!isWithinRange) return;

            const existingCell = map.get(courtId)!.get(startTime);
            if (!existingCell) return;

            map.get(courtId)!.set(startTime, {
              ...existingCell,
              booking: {
                ...existingCell.booking,
                inventories: mergeInventories(
                  (existingCell.booking.inventories || []) as BookingInventory[],
                  [inventory as BookingInventory]
                )
              }
            });
          });
        });
      });
    });

    return map;
  }, [bookings, courtSport, selectedDateString, timeSlotRanges]);

  const isLoading = isCourtsLoading || isBookingsLoading || isSlotsLoading;

  return (
    <div className="w-full min-w-0">
      <Section className="min-w-0 gap-5 bg-transparent pt-0">
        <SectionHeader className="px-0">
          <SectionTitle title="Jadwal Lapangan" />
          <SectionDescription description="Lihat jadwal pemesanan lapangan untuk tanggal tertentu." />
        </SectionHeader>
        <SectionContent className="min-w-0 px-0">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-col flex-wrap justify-between gap-3 sm:flex-row sm:items-center">
              <Tabs
                value={courtSport}
                onValueChange={(value) => setCourtSport(value as 'PADEL' | 'TENNIS')}
              >
                <TabsList className="grid h-10 w-full grid-cols-2 sm:w-52">
                  <TabsTrigger value="PADEL">Padel</TabsTrigger>
                  <TabsTrigger
                    value="TENNIS"
                    disabled={!!activeBranchId && activeBranchId !== 'cemara'}
                  >
                    Tennis
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="h-10 rounded-lg shadow-none"
                  onClick={() => setSelectedDate(today)}
                >
                  Hari ini
                </Button>
                <div className="bg-background flex items-center overflow-hidden rounded-lg border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 rounded-none"
                    aria-label="Tanggal sebelumnya"
                    onClick={() => setSelectedDate(dayjs(selectedDate).subtract(1, 'day').toDate())}
                  >
                    <IconChevronLeft className="size-4" />
                  </Button>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 min-w-40 gap-2 rounded-none border-x border-y-0 shadow-none"
                        aria-label="Pilih tanggal jadwal"
                      >
                        <IconCalendar className="h-4 w-4" />
                        <span>{formatDate(selectedDate, 'DD MMM YYYY')}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-auto rounded-xl p-0">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 rounded-none"
                    aria-label="Tanggal berikutnya"
                    onClick={() => setSelectedDate(dayjs(selectedDate).add(1, 'day').toDate())}
                  >
                    <IconChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Schedule Table */}
            <Card
              className={cn(
                'min-w-0 gap-0 overflow-hidden pb-0 shadow-none',
                isFullScreen &&
                  'fixed inset-0 z-50 flex h-dvh w-full flex-col rounded-none border-0'
              )}
            >
              <CardHeader className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-3 pb-4">
                <div className="space-y-1.5">
                  <CardTitle className="text-base">
                    {formatDate(selectedDate, 'dddd, DD MMM YYYY')}
                  </CardTitle>
                  <p className="text-muted-foreground text-xs">
                    {courtSport === 'TENNIS' ? 'Tennis' : 'Padel'} · {courts.length} lapangan ·
                    Waktu dalam WIB
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-4">
                  <div className="text-muted-foreground hidden flex-wrap items-center gap-3 text-xs sm:flex">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-green-500" />
                      Dikonfirmasi
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-yellow-500" />
                      Ditahan
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-red-400" />
                      Dibatalkan
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullScreen}
                    title={isFullScreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                    aria-label={isFullScreen ? 'Keluar layar penuh' : 'Layar penuh'}
                  >
                    {isFullScreen ? (
                      <IconMinimize className="h-4 w-4" />
                    ) : (
                      <IconMaximize className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="min-h-0 min-w-0 flex-1 px-0">
                {isLoading ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground text-sm">Memuat jadwal...</p>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'isolate overflow-auto border-t',
                      isFullScreen ? 'h-full' : 'max-h-[65vh]'
                    )}
                  >
                    {courts.length === 0 ? (
                      <div className="text-muted-foreground py-16 text-center text-sm">
                        Tidak ada lapangan untuk cabang dan olahraga ini.
                      </div>
                    ) : (
                      <table
                        className="w-full table-fixed border-separate border-spacing-0"
                        style={{ minWidth: 128 + courts.length * 240 }}
                        aria-label="Jadwal pemesanan lapangan"
                      >
                        <thead>
                          <tr>
                            <th className="border-border bg-muted sticky top-0 left-0 z-30 w-32 min-w-32 border-r border-b px-3 py-2 text-left text-base font-semibold">
                              Waktu
                            </th>
                            {courts.map((court) => (
                              <th
                                key={court.id}
                                className="border-border bg-muted sticky top-0 z-20 min-w-[240px] border-r border-b px-3 py-2 text-center text-sm font-medium last:border-r-0"
                              >
                                {court.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {timeSlotRanges.map(({ startTime, endTime }) => (
                            <tr key={startTime} className="hover:bg-muted/50 transition-colors">
                              <td className="border-border bg-background sticky left-0 z-10 w-32 min-w-32 border-r border-b px-3 py-2 text-base font-medium whitespace-nowrap tabular-nums">
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
                                      'border-border h-16 border-r border-b p-0 text-center align-middle transition-colors last:border-r-0',
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
                                          <button
                                            type="button"
                                            className="focus-visible:ring-ring flex min-h-16 w-full flex-col items-center justify-center gap-0.5 px-3 py-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-inset"
                                            aria-label={`Detail booking ${bookingCell.customerName}, ${court.name}, ${startTime}`}
                                          >
                                            <span
                                              className="max-w-full truncate text-xs font-medium"
                                              title={bookingCell.customerName}
                                            >
                                              {bookingCell.customerName}
                                            </span>
                                            {bookingCell.customerPhone &&
                                              bookingCell.customerPhone !== '-' && (
                                                <span className="text-muted-foreground text-xs tabular-nums">
                                                  {formatPhone(bookingCell.customerPhone)}
                                                </span>
                                              )}
                                            <Badge
                                              variant={BOOKING_STATUS_BADGE_VARIANT[status]}
                                              className="shrink-0 px-2 py-0 text-xs font-normal"
                                            >
                                              {BOOKING_STATUS_MAP[status]}
                                            </Badge>
                                          </button>
                                        </DialogTrigger>
                                        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col">
                                          <DialogHeader className="mb-4 shrink-0">
                                            <DialogTitle>Detail Pemesanan</DialogTitle>
                                          </DialogHeader>
                                          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                                  Membership
                                                </p>
                                                {bookingCell.booking.membershipUserId ? (
                                                  <>
                                                    <Badge variant="success">Ya</Badge>
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                      Sesi digunakan:{' '}
                                                      {bookingCell.booking.membershipSessionsUsed ??
                                                        0}
                                                    </p>
                                                  </>
                                                ) : (
                                                  <Badge variant="secondary">Tidak</Badge>
                                                )}
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
                                                  Total Tagihan
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
                                                  Total Booking Lapangan
                                                </p>
                                                <p className="font-medium">
                                                  Rp{' '}
                                                  {new Intl.NumberFormat('id-ID').format(
                                                    getBookingCourtTotal(bookingCell.booking)
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
                                              {bookingCell.booking.adminNote && (
                                                <div className="col-span-2">
                                                  <p className="text-muted-foreground text-sm">
                                                    Note Admin
                                                  </p>
                                                  <p className="text-sm whitespace-pre-line">
                                                    {bookingCell.booking.adminNote}
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
                                                              getBookingDetailChargedPrice(detail)
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
                                                ? getCoachesForBookingCell(bookingCell)
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
                                                                  🎯 Type:{' '}
                                                                  {getCoachTypeLabel(
                                                                    coach.coachType
                                                                  )}
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

                                            <BookingBallboySection
                                              ballboys={getBallboysForBookingCell(bookingCell)}
                                              details={bookingCell.booking.details}
                                            />

                                            {/* Inventories Section */}
                                            {(() => {
                                              const inventoriesArray =
                                                getInventoriesForBookingCell(bookingCell);
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
                                      <span
                                        className="text-muted-foreground/30 text-xs"
                                        aria-label="Tidak ada booking"
                                      >
                                        ·
                                      </span>
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
    </div>
  );
}
