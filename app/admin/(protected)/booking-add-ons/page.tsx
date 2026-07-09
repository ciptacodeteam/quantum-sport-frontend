'use client';

import type { AdminCheckoutPayload } from '@/api/admin/checkout';
import BookingSummary from '@/components/admin/booking/BookingSummary';
import AppSectionHeader from '@/components/ui/app-section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMembershipDiscount } from '@/hooks/useMembershipDiscount';
import { formatSlotTime, formatSlotTimeRange } from '@/lib/time-utils';
import { cn } from '@/lib/utils';
import { adminBallboyAvailabilityQueryOptions } from '@/queries/admin/ballboy';
import { adminCheckoutMutationOptions } from '@/mutations/admin/checkout';
import { adminCoachAvailabilityQueryOptions } from '@/queries/admin/coach';
import { type CustomerSearchResult } from '@/queries/admin/customer';
import { adminInventoryAvailabilityQueryOptions } from '@/queries/admin/inventory';
import { useBookingStore } from '@/stores/useBookingStore';
import {
  IconCalendar,
  IconChevronLeft,
  IconMapPin,
  IconMinus,
  IconPlus,
  IconShoppingCart,
  IconUser
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function BookingAddOns() {
  const router = useRouter();
  const {
    bookingItems,
    // selectedDate,
    selectedCustomerId,
    selectedCustomerName: storeCustomerName,
    selectedCustomerPhone: storeCustomerPhone,
    setSelectedCustomerId,
    setSelectedCustomerDetails,
    walkInName: storeWalkInName,
    walkInPhone: storeWalkInPhone,
    bookingAdminNote,
    setBookingAdminNote,
    setWalkInCustomer,
    selectedCoaches,
    selectedBallboys,
    selectedInventories,
    addCoach,
    removeCoach,
    addBallboy,
    removeBallboy,
    addInventory,
    removeInventory,
    removeBookingItem,
    // updateInventoryQuantity,
    setMembershipDiscount,
    courtTotal,
    coachTotal,
    ballboyTotal,
    inventoryTotal,
    coachDescription,
    setCoachDescription
  } = useBookingStore();

  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'coaches' | 'ballboys' | 'inventory'>('coaches');
  // const [inventoryQuantities, setInventoryQuantities] = useState<Record<string, number>>({});
  // Selected date and time for add-ons when no court bookings exist
  const [selectedAddOnDate, setSelectedAddOnDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [selectedAddOnTimeSlot, setSelectedAddOnTimeSlot] = useState<string>('');
  const [useMembership, setUseMembership] = useState(true);
  const courtSport = useMemo<'PADEL' | 'TENNIS'>(
    () => bookingItems.find((item) => item.sport)?.sport ?? 'PADEL',
    [bookingItems]
  );

  // Customer selection is now handled by BookingSummary component
  // Keep selectedCustomer state for membership discount calculation
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);

  // Calculate membership discount for court bookings
  // Pass membership data from selected customer to avoid separate API call
  const membershipDiscount = useMembershipDiscount(
    selectedCustomerId || null,
    bookingItems,
    selectedCustomer ? { activeMembership: selectedCustomer.activeMembership } : null,
    false,
    courtSport,
    useMembership
  );

  // Update store with membership discount
  useEffect(() => {
    setMembershipDiscount(membershipDiscount.discountAmount);
  }, [membershipDiscount.discountAmount, setMembershipDiscount]);

  const totalAmount =
    membershipDiscount.discountedTotal + coachTotal + ballboyTotal + inventoryTotal;

  // Get date range from bookings or selected add-on date
  // Helper to create ISO string for start/end of day in UTC
  // Treats the date string as UTC date (not local timezone) to match API expectations
  const getDateRangeISO = (dateString: string, isStart: boolean): string => {
    // dateString is in format YYYY-MM-DD
    // Treat it as UTC date, not local timezone date
    // So November 30 becomes 2025-11-30T00:00:00.000Z (not 2025-11-29T17:00:00.000Z)
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        isStart ? 0 : 23,
        isStart ? 0 : 59,
        isStart ? 0 : 59,
        isStart ? 0 : 999
      )
    );
    return date.toISOString();
  };

  const dateRange = useMemo(() => {
    if (bookingItems.length > 0) {
      const dates = bookingItems.map((item) => item.date);
      const sortedDates = dates.sort();
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];

      return {
        startAt: getDateRangeISO(startDate, true),
        endAt: getDateRangeISO(endDate, false)
      };
    }

    // If no bookings, use selected add-on date
    return {
      startAt: getDateRangeISO(selectedAddOnDate, true),
      endAt: getDateRangeISO(selectedAddOnDate, false)
    };
  }, [bookingItems, selectedAddOnDate]);

  // Generate time slots from 06:00 to 23:00
  const availableTimeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 6; hour < 24; hour++) {
      const start = `${String(hour).padStart(2, '0')}:00`;
      const end = `${String(hour + 1).padStart(2, '0')}:00`;
      slots.push(`${start} - ${end}`);
    }
    return slots;
  }, []);

  // Fetch coach availability
  const { data: coachAvailabilityData } = useQuery(
    adminCoachAvailabilityQueryOptions(dateRange?.startAt, dateRange?.endAt, courtSport)
  );

  // Fetch ballboy availability. Ballboy is only available for tennis bookings.
  const { data: ballboyAvailabilityData } = useQuery(
    adminBallboyAvailabilityQueryOptions(dateRange?.startAt, dateRange?.endAt, courtSport)
  );

  const inventoryDateRange = useMemo(() => {
    const bookingsWithSlotRange = bookingItems.filter((item) => item.startAt && item.endAt);

    if (bookingsWithSlotRange.length === 0) {
      return dateRange;
    }

    const sortedStarts = bookingsWithSlotRange.map((item) => item.startAt as string).sort();
    const sortedEnds = bookingsWithSlotRange.map((item) => item.endAt as string).sort();

    return {
      startAt: sortedStarts[0],
      endAt: sortedEnds[sortedEnds.length - 1]
    };
  }, [bookingItems, dateRange]);

  // Helpers to avoid timezone shifts; use local time parts from ISO strings (same as court slots)
  const getISODate = (isoString?: string | null) => (isoString ? isoString.slice(0, 10) : '');
  const getTimeRangeLocal = (startAt: string, endAt: string) => formatSlotTimeRange(startAt, endAt);
  const normalizeTime = (time?: string | null) => {
    if (!time) {
      return '';
    }

    const cleaned = time.trim().split(' ')[0];
    const [hour, minute = '00'] = cleaned.split(':');
    if (!hour) {
      return '';
    }

    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  };
  const timeToMinutes = (time: string) => {
    const [hour, minute] = normalizeTime(time).split(':').map(Number);

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      return null;
    }

    return hour * 60 + minute;
  };
  const normalizeEndMinutes = (startMinutes: number, endMinutes: number) =>
    endMinutes <= startMinutes ? endMinutes + 24 * 60 : endMinutes;
  const getBookingStartTime = (booking: (typeof bookingItems)[number]) => {
    if (booking.startAt) {
      return formatSlotTime(booking.startAt);
    }

    const [startTime] = booking.timeSlot.split(' - ');
    return normalizeTime(startTime);
  };
  const getBookingEndTime = (booking: (typeof bookingItems)[number]) => {
    if (booking.endAt) {
      return formatSlotTime(booking.endAt);
    }

    const [, endTimeFromRange] = booking.timeSlot.split(' - ');
    return normalizeTime(booking.endTime || endTimeFromRange);
  };

  // Fetch inventory availability
  const { data: inventoryAvailabilityData } = useQuery(
    adminInventoryAvailabilityQueryOptions(
      inventoryDateRange?.startAt,
      inventoryDateRange?.endAt,
      courtSport
    )
  );

  // Transform coach availability data to match component format
  const coaches = useMemo(() => {
    if (!coachAvailabilityData) return [];

    // Group by coach
    const coachMap = new Map<
      string,
      {
        id: string;
        name: string;
        image: string | null;
        slots: typeof coachAvailabilityData;
      }
    >();

    coachAvailabilityData.forEach((slot) => {
      if (!coachMap.has(slot.coach.id)) {
        coachMap.set(slot.coach.id, {
          id: slot.coach.id,
          name: slot.coach.name,
          image: slot.coach.image || null,
          slots: []
        });
      }
      coachMap.get(slot.coach.id)!.slots.push(slot);
    });

    return Array.from(coachMap.values());
  }, [coachAvailabilityData]);

  // type AdminCoachSlot = {
  //   id: string;
  //   coachId: string;
  //   coachName: string;
  //   timeRange: string;
  //   price: number;
  //   startAt: string;
  //   endAt: string;
  // };

  // const coachAvailabilityByDate = useMemo(() => {
  //   if (!coachAvailabilityData || coachAvailabilityData.length === 0) return [];

  //   const map = new Map<
  //     string,
  //     {
  //       dateLabel: string;
  //       slots: AdminCoachSlot[];
  //     }
  //   >();

  //   coachAvailabilityData.forEach((slot) => {
  //     const dateKey = getISODate(slot.startAt);
  //     const dateLabel = getISODate(slot.startAt); // keep simple; avoids TZ confusion
  //     const timeRange = getTimeRangeLocal(slot.startAt, slot.endAt);

  //     if (!map.has(dateKey)) {
  //       map.set(dateKey, {
  //         dateLabel,
  //         slots: []
  //       });
  //     }

  //     map.get(dateKey)!.slots.push({
  //       id: slot.slotId,
  //       coachId: slot.coach.id,
  //       timeRange,
  //       coachName: slot.coach.name,
  //       price: slot.price,
  //       startAt: slot.startAt,
  //       endAt: slot.endAt
  //     });
  //   });

  //   return Array.from(map.entries())
  //     .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  //     .map(([date, info]) => ({
  //       date,
  //       dateLabel: info.dateLabel,
  //       slots: info.slots.sort((slotA, slotB) => {
  //         const [a] = slotA.timeRange.split(' - ');
  //         const [b] = slotB.timeRange.split(' - ');
  //         return a.localeCompare(b);
  //       })
  //     }));
  // }, [coachAvailabilityData]);

  // Transform inventory availability data
  const inventoryItems = useMemo(() => {
    if (!inventoryAvailabilityData) return [];

    return inventoryAvailabilityData.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      availableQuantity: item.availableQuantity,
      totalQuantity: item.totalQuantity
    }));
  }, [inventoryAvailabilityData]);

  // No longer redirecting - allow add-ons without court bookings

  // Group bookings by date and get unique dates with their time slots
  const bookingsByDate = bookingItems.reduce(
    (groups, item) => {
      const date = item.date;
      if (!groups[date]) {
        groups[date] = {
          date,
          dayName: dayjs(date).format('dddd'),
          formattedDate: dayjs(date).format('DD MMM YYYY'),
          shortDate: dayjs(date).format('ddd, DD MMM'),
          timeSlots: [],
          items: []
        };
      }
      if (!groups[date].timeSlots.includes(item.timeSlot)) {
        groups[date].timeSlots.push(item.timeSlot);
      }
      groups[date].items.push(item);
      return groups;
    },
    {} as Record<
      string,
      {
        date: string;
        dayName: string;
        formattedDate: string;
        shortDate: string;
        timeSlots: string[];
        items: typeof bookingItems;
      }
    >
  );

  // Get all unique time slots across all dates
  // const bookedTimeSlots = Array.from(new Set(bookingItems.map((item) => item.timeSlot)));

  // Get all unique dates
  const bookedDates = Object.keys(bookingsByDate).sort();

  // Helper functions for coach availability - now uses real API data
  const isCoachAvailable = (coachId: string, timeSlot: string, date: string): boolean => {
    if (!coachAvailabilityData) return false;
    const wantedDate = date; // already YYYY-MM-DD in store
    return coachAvailabilityData.some((slot) => {
      const slotDateStr = getISODate(slot.startAt);
      const slotTimeRange = getTimeRangeLocal(slot.startAt, slot.endAt);
      return slot.coach.id === coachId && slotDateStr === wantedDate && slotTimeRange === timeSlot;
    });
  };

  const ballboyCoversBooking = (
    slot: NonNullable<typeof ballboyAvailabilityData>[number],
    booking: (typeof bookingItems)[number]
  ) => {
    const bookingDate = getISODate(booking.startAt) || booking.date;

    if (!slot.startAt || !slot.endAt || getISODate(slot.startAt) !== bookingDate) {
      return false;
    }

    const ballboyStart = timeToMinutes(formatSlotTime(slot.startAt));
    const rawBallboyEnd = timeToMinutes(formatSlotTime(slot.endAt));
    const bookingStart = timeToMinutes(getBookingStartTime(booking));
    const rawBookingEnd = timeToMinutes(getBookingEndTime(booking));

    if (
      ballboyStart === null ||
      rawBallboyEnd === null ||
      bookingStart === null ||
      rawBookingEnd === null
    ) {
      return false;
    }

    const ballboyEnd = normalizeEndMinutes(ballboyStart, rawBallboyEnd);
    const bookingEnd = normalizeEndMinutes(bookingStart, rawBookingEnd);

    return ballboyStart <= bookingStart && ballboyEnd >= bookingEnd;
  };

  const ballboyAvailableForBookings = useMemo(() => {
    if (!ballboyAvailabilityData || courtSport !== 'TENNIS' || bookingItems.length === 0) {
      return [];
    }

    return bookingItems
      .map((booking) => ({
        booking,
        slots: ballboyAvailabilityData.filter((slot) => ballboyCoversBooking(slot, booking))
      }))
      .filter(({ slots }) => slots.length > 0);
  }, [ballboyAvailabilityData, bookingItems, courtSport]);

  // Helper function to check if coach is available for any of the booked dates/slots
  // If no bookings, check against selected add-on date/time
  const isCoachAvailableForBookings = (coach: { id: string }) => {
    if (bookingItems.length > 0) {
      return bookedDates.some((date) =>
        bookingsByDate[date].timeSlots.some((timeSlot) =>
          isCoachAvailable(coach.id, timeSlot, date)
        )
      );
    }
    // If no bookings, check if coach is available for selected add-on date/time
    if (selectedAddOnTimeSlot) {
      return isCoachAvailable(coach.id, selectedAddOnTimeSlot, selectedAddOnDate);
    }
    // If no time slot selected, show all coaches
    return true;
  };

  // const handleAddCoachFromAvailability = (slot: AdminCoachSlot) => {
  //   const date = dayjs(slot.startAt).format('YYYY-MM-DD');
  //   const timeSlot = slot.timeRange;
  //   const dateInfo = bookingsByDate[date];

  //   if (!dateInfo) {
  //     toast.error('Tidak ada booking untuk tanggal ini. Tambahkan court terlebih dahulu.');
  //     return;
  //   }

  //   if (!dateInfo.timeSlots.includes(timeSlot)) {
  //     toast.error('Slot coach tidak cocok dengan jadwal booking yang ada.');
  //     return;
  //   }

  //   const alreadySelected = selectedCoaches.some(
  //     (coach) =>
  //       coach.coachId === slot.coachId && coach.timeSlot === timeSlot && coach.date === date
  //   );
  //   if (alreadySelected) {
  //     toast.info('Coach sudah ditambahkan untuk jadwal ini.');
  //     return;
  //   }

  //   addCoach({
  //     coachId: slot.coachId,
  //     coachName: slot.coachName,
  //     timeSlot,
  //     price: slot.price,
  //     date,
  //     startAt: slot.startAt,
  //     endAt: slot.endAt,
  //     slotId: slot.id
  //   });

  //   toast.success(
  //     `Coach ${slot.coachName} ditambahkan untuk ${dayjs(date).format('DD MMM')} ${timeSlot}`
  //   );
  // };

  // Handle coach selection - now uses real API data
  const handleCoachSelect = (
    coachId: string,
    coachName: string,
    timeSlot: string,
    date: string,
    price: number,
    matchingSlot?: { id: string; startAt: string; endAt: string }
  ) => {
    const isSelected = selectedCoaches.some(
      (c) => c.coachId === coachId && c.timeSlot === timeSlot && c.date === date
    );

    if (isSelected) {
      // Find the selected coach to get slotId for removal
      const selectedCoach = selectedCoaches.find(
        (c) => c.coachId === coachId && c.timeSlot === timeSlot && c.date === date
      );
      removeCoach(coachId, timeSlot, selectedCoach?.slotId);
      toast.success(`Removed ${coachName} from ${timeSlot} on ${dayjs(date).format('DD MMM')}`);
    } else {
      addCoach({
        coachId,
        coachName,
        timeSlot,
        price,
        date: date,
        slotId: matchingSlot?.id,
        startAt: matchingSlot?.startAt,
        endAt: matchingSlot?.endAt
      });
      toast.success(`Added ${coachName} for ${timeSlot} on ${dayjs(date).format('DD MMM')}`);
    }
  };

  const handleBallboySelect = (
    ballboySlot: NonNullable<typeof ballboyAvailabilityData>[number],
    booking: (typeof bookingItems)[number]
  ) => {
    if (courtSport !== 'TENNIS') {
      toast.error('Ballboy hanya tersedia untuk tennis.');
      return;
    }

    if (!ballboySlot.slotId || !ballboySlot.ballboy?.id) {
      toast.error('Data ballboy tidak valid.');
      return;
    }

    const selectedForCourt = selectedBallboys.find((b) => b.courtSlotId === booking.slotId);
    if (selectedForCourt?.slotId === ballboySlot.slotId) {
      removeBallboy(ballboySlot.ballboy.id, selectedForCourt.timeSlot, ballboySlot.slotId);
      toast.success(`Removed ${ballboySlot.ballboy.name ?? 'Ballboy'} from ${booking.timeSlot}`);
      return;
    }

    const selectedBySlot = selectedBallboys.find((b) => b.slotId === ballboySlot.slotId);
    if (selectedBySlot && selectedBySlot.courtSlotId !== booking.slotId) {
      toast.error('Ballboy ini sudah dipilih untuk lapangan lain di jam yang sama.');
      return;
    }

    if (selectedForCourt) {
      removeBallboy(selectedForCourt.ballboyId, selectedForCourt.timeSlot, selectedForCourt.slotId);
    }

    const timeSlot = getTimeRangeLocal(ballboySlot.startAt, ballboySlot.endAt);

    addBallboy({
      ballboyId: ballboySlot.ballboy.id,
      ballboyName: ballboySlot.ballboy.name ?? 'Ballboy',
      timeSlot,
      price: ballboySlot.price ?? 0,
      date: getISODate(ballboySlot.startAt),
      slotId: ballboySlot.slotId,
      courtId: booking.courtId,
      courtName: booking.courtName,
      courtSlotId: booking.slotId,
      startAt: ballboySlot.startAt,
      endAt: ballboySlot.endAt
    });

    toast.success(
      `Added ${ballboySlot.ballboy.name ?? 'Ballboy'} for ${dayjs(booking.date).format('DD MMM')} ${booking.timeSlot}`
    );
  };

  // Handle inventory quantity change - now uses real API data
  const handleInventoryQuantityChange = (
    inventoryId: string,
    inventoryName: string,
    timeSlot: string,
    date: string,
    quantity: number,
    pricePerItem: number
  ) => {
    if (quantity > 0) {
      addInventory({
        inventoryId,
        inventoryName,
        timeSlot,
        price: pricePerItem * quantity,
        quantity,
        date: date
      });
    } else {
      removeInventory(inventoryId, timeSlot);
    }
  };

  const { mutate: confirmCheckout, isPending: isConfirming } = useMutation(
    adminCheckoutMutationOptions({
      onSuccess: () => {
        // Invalidate slots query to refresh availability
        queryClient.invalidateQueries({ queryKey: ['admin', 'court-costing'] });
        // Reset booking store after successful admin checkout
        useBookingStore.getState().clearAll();
        router.push('/admin/kelola-pemesanan/lapangan');
      }
    })
  );

  const handleConfirmBooking = () => {
    // Allow checkout with only add-ons (no court bookings required)
    if (
      bookingItems.length === 0 &&
      selectedCoaches.length === 0 &&
      selectedBallboys.length === 0 &&
      selectedInventories.length === 0
    ) {
      toast.error('Minimal satu item harus dipilih.');
      return;
    }

    const courtSlots = bookingItems.map((b) => b.slotId).filter(Boolean);
    const coachSlots = selectedCoaches.map((c) => c.slotId).filter(Boolean) as string[];
    const ballboySlots = selectedBallboys
      .filter((b) => b.slotId && b.courtSlotId)
      .map((b) => ({
        slotId: b.slotId as string,
        courtSlotId: b.courtSlotId as string
      }));
    const inventories = selectedInventories
      .filter((i) => i.quantity > 0)
      .map((i) => ({ inventoryId: i.inventoryId, quantity: i.quantity }));

    // Validate at least one of the items exists
    if (
      courtSlots.length === 0 &&
      coachSlots.length === 0 &&
      ballboySlots.length === 0 &&
      inventories.length === 0
    ) {
      toast.error('Minimal satu slot atau inventori harus dipilih.');
      return;
    }

    // Calculate totalHours from booking items (or default to 1 if no bookings)
    const totalHours =
      bookingItems.length > 0
        ? bookingItems.reduce((total, item) => {
            try {
              // Parse timeSlot and endTime to calculate hours
              const startTimeStr = item.timeSlot.includes(':')
                ? item.timeSlot
                : `${item.timeSlot}:00`;
              const endTimeStr =
                item.endTime && item.endTime.includes(':')
                  ? item.endTime
                  : item.endTime
                    ? `${item.endTime}:00`
                    : null;

              const startTime = dayjs(
                `${item.date} ${startTimeStr}`,
                ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD H:mm'],
                true
              );

              if (!startTime.isValid()) {
                // Fallback: assume 1 hour per booking if parsing fails
                return total + 1;
              }

              let endTime;
              if (endTimeStr) {
                endTime = dayjs(
                  `${item.date} ${endTimeStr}`,
                  ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD H:mm'],
                  true
                );
              } else {
                // If no endTime, assume 1 hour duration
                endTime = startTime.add(1, 'hour');
              }

              if (endTime.isValid()) {
                const hours = endTime.diff(startTime, 'hour', true);
                // Ensure at least 1 hour per booking
                return total + Math.max(1, hours);
              }

              // Fallback: assume 1 hour per booking
              return total + 1;
            } catch (error) {
              console.warn('Error calculating hours for booking item:', item, error);
              // Fallback: assume 1 hour per booking
              return total + 1;
            }
          }, 0)
        : 1; // Default to 1 hour if no court bookings

    const payload: AdminCheckoutPayload = {
      totalHours: Math.max(1, Math.round(totalHours * 100) / 100), // Round to 2 decimal places, minimum 1,
      courtSlots: courtSlots.length > 0 ? courtSlots : undefined,
      coachSlots: coachSlots.length > 0 ? coachSlots : undefined,
      ballboySlots: ballboySlots.length > 0 ? ballboySlots : undefined,
      inventories: inventories.length > 0 ? inventories : undefined,
      coachDescription: coachDescription || undefined,
      adminNote: bookingAdminNote || undefined,
      useMembership
    };

    if (selectedCustomerId) {
      payload.userId = selectedCustomerId;
    } else if (storeWalkInName && storeWalkInPhone) {
      payload.name = storeWalkInName;
      payload.phone = storeWalkInPhone;
    } else {
      toast.error('Pilih pelanggan atau lengkapi data walk-in.');
      return;
    }

    confirmCheckout(payload);
  };

  // No longer returning null - allow add-ons without court bookings

  return (
    <div className="w-full">
      <AppSectionHeader
        title="Booking Add-Ons"
        description="Add coaches and equipment to enhance your court booking experience"
        className="mb-6"
      />

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Court Bookings Summary or Date/Time Selection */}
          {bookingItems.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCalendar className="text-primary h-5 w-5" />
                  Your Court Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(bookingsByDate).map(([date, dateInfo]) => (
                    <div key={date} className="space-y-2">
                      <div className="text-muted-foreground border-b pb-1 text-sm font-medium">
                        {dateInfo.dayName}, {dateInfo.formattedDate}
                      </div>
                      {dateInfo.items.map((booking, index) => (
                        <div
                          key={`${date}-${index}`}
                          className="bg-muted border-l-primary ml-2 flex items-center justify-between rounded-lg border-l-4 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <IconMapPin className="text-primary h-4 w-4" />
                            <div>
                              <p className="text-sm font-medium">{booking.courtName}</p>
                              <p className="text-muted-foreground text-xs">{booking.timeSlot}</p>
                            </div>
                          </div>
                          <span className="text-primary font-semibold">
                            Rp {booking.price.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCalendar className="text-primary h-5 w-5" />
                  Select Date & Time for Add-Ons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Date</label>
                    <Input
                      type="date"
                      value={selectedAddOnDate}
                      onChange={(e) => {
                        setSelectedAddOnDate(e.target.value);
                        setSelectedAddOnTimeSlot(''); // Reset time slot when date changes
                      }}
                      min={dayjs().format('YYYY-MM-DD')}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Time Slot</label>
                    <div className="grid grid-cols-3 gap-2">
                      {availableTimeSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedAddOnTimeSlot === slot ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedAddOnTimeSlot(slot)}
                        >
                          {slot.split(' - ')[0]}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <div className="bg-muted flex gap-2 rounded-lg p-1">
            <Button
              variant={activeTab === 'coaches' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setActiveTab('coaches')}
            >
              <IconUser className="mr-2 h-4 w-4" />
              Coaches
              {selectedCoaches.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedCoaches.length}
                </Badge>
              )}
            </Button>
            {courtSport === 'TENNIS' && (
              <Button
                variant={activeTab === 'ballboys' ? 'default' : 'ghost'}
                className="flex-1"
                onClick={() => setActiveTab('ballboys')}
              >
                <IconUser className="mr-2 h-4 w-4" />
                Ballboy
                {selectedBallboys.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedBallboys.length}
                  </Badge>
                )}
              </Button>
            )}
            <Button
              variant={activeTab === 'inventory' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setActiveTab('inventory')}
            >
              <IconShoppingCart className="mr-2 h-4 w-4" />
              Equipment
              {selectedInventories.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedInventories.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Coaches Tab */}
          {activeTab === 'coaches' && (
            <div className="space-y-4">
              <div className="rounded-md border bg-white p-3 sm:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">Select coaches</p>
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {(() => {
                      // Count only slots that match booked dates and time ranges
                      if (!coachAvailabilityData || bookingItems.length === 0) return 0;

                      const bookedPairs = new Set<string>();
                      Object.entries(bookingsByDate).forEach(([date, info]) => {
                        info.timeSlots.forEach((t) => bookedPairs.add(`${date}|${t}`));
                      });

                      const count = coachAvailabilityData.reduce((acc, slot) => {
                        const d = getISODate(slot.startAt);
                        const range = getTimeRangeLocal(slot.startAt, slot.endAt);
                        return bookedPairs.has(`${d}|${range}`) ? acc + 1 : acc;
                      }, 0);

                      return count;
                    })()}{' '}
                    slots
                  </Badge>
                </div>
                <div className="text-muted-foreground text-[11px]">
                  {bookingItems.length > 0 ? (
                    Object.entries(bookingsByDate).map(([date, info]) => (
                      <span key={date} className="mr-3 inline-block">
                        <span className="font-medium">{info.shortDate}:</span>{' '}
                        {info.timeSlots.join(', ')}
                      </span>
                    ))
                  ) : selectedAddOnTimeSlot ? (
                    <span>
                      <span className="font-medium">
                        {dayjs(selectedAddOnDate).format('ddd, DD MMM')}:
                      </span>{' '}
                      {selectedAddOnTimeSlot}
                    </span>
                  ) : (
                    <span className="text-amber-600">Please select a date and time slot above</span>
                  )}
                </div>
              </div>

              {/* Group timeslots per coach */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {coaches
                  .filter((coach) => isCoachAvailableForBookings(coach))
                  .map((coach) => {
                    // Collect available times per booked date for this coach, or use selected add-on date/time
                    const availableSlots =
                      bookingItems.length > 0
                        ? Object.entries(bookingsByDate).reduce(
                            (acc, [date, dateInfo]) => {
                              const availableForDate = dateInfo.timeSlots.filter((timeSlot) =>
                                isCoachAvailable(coach.id, timeSlot, date)
                              );
                              if (availableForDate.length > 0) {
                                acc.push({
                                  date,
                                  shortDate: dateInfo.shortDate,
                                  timeSlots: availableForDate
                                });
                              }
                              return acc;
                            },
                            [] as Array<{ date: string; shortDate: string; timeSlots: string[] }>
                          )
                        : selectedAddOnTimeSlot &&
                            isCoachAvailable(coach.id, selectedAddOnTimeSlot, selectedAddOnDate)
                          ? [
                              {
                                date: selectedAddOnDate,
                                shortDate: dayjs(selectedAddOnDate).format('ddd, DD MMM'),
                                timeSlots: [selectedAddOnTimeSlot]
                              }
                            ]
                          : [];

                    const firstSlot = coach.slots[0];
                    if (!firstSlot) return null;

                    return (
                      <Card key={coach.id} className="border-muted">
                        <CardContent className="p-3 sm:p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold">
                                  {firstSlot.coach.name}
                                </h3>
                                <p className="text-muted-foreground text-[11px]">
                                  {firstSlot.coach.role || 'Coach'}
                                </p>
                              </div>
                              <span className="text-primary shrink-0 text-sm font-bold">
                                Rp {firstSlot.price.toLocaleString('id-ID')}/hr
                              </span>
                            </div>

                            <div className="space-y-2">
                              {availableSlots.map(({ date, shortDate, timeSlots }) => (
                                <div key={date} className="space-y-1">
                                  <div className="text-muted-foreground text-[11px] font-medium">
                                    {shortDate}
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                                    {timeSlots.map((timeSlot) => {
                                      const isSelected = selectedCoaches.some(
                                        (c) =>
                                          c.coachId === coach.id &&
                                          c.timeSlot === timeSlot &&
                                          c.date === date
                                      );

                                      // Find the matching slot for price and slotId
                                      // timeSlot is in format "13:00 - 14:00", so we need to extract just the start time
                                      const timeSlotStart = timeSlot.split(' - ')[0];
                                      const matchingSlot = coach.slots.find((slot) => {
                                        const slotTime = formatSlotTime(slot.startAt);
                                        const slotDate = getISODate(slot.startAt);
                                        return slotTime === timeSlotStart && slotDate === date;
                                      });

                                      // Ensure we have a matching slot with slotId before allowing selection
                                      if (!matchingSlot || !matchingSlot.slotId) {
                                        return null;
                                      }

                                      return (
                                        <Button
                                          key={`${date}-${timeSlot}`}
                                          variant={isSelected ? 'default' : 'outline'}
                                          size="sm"
                                          className={cn(
                                            'h-7 w-full truncate px-2 text-[11px] whitespace-nowrap',
                                            isSelected &&
                                              'bg-primary text-primary-foreground shadow-sm',
                                            !isSelected &&
                                              'hover:bg-primary/10 hover:border-primary'
                                          )}
                                          onClick={() =>
                                            handleCoachSelect(
                                              coach.id,
                                              firstSlot.coach.name,
                                              timeSlot,
                                              date,
                                              matchingSlot.price || firstSlot.price,
                                              {
                                                id: matchingSlot.slotId,
                                                startAt: matchingSlot.startAt,
                                                endAt: matchingSlot.endAt
                                              }
                                            )
                                          }
                                        >
                                          {timeSlot.split(' - ')[0]}
                                        </Button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>

              {/* Coach Description Field */}
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Coach Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Field>
                      <FieldLabel htmlFor="coachDescription">Deskripsi Coach</FieldLabel>
                      <Textarea
                        id="coachDescription"
                        value={coachDescription ?? ''}
                        onChange={(e) => setCoachDescription(e.target.value || null)}
                        placeholder="Tuliskan catatan atau deskripsi untuk coach (opsional)"
                        className="min-h-24"
                      />
                    </Field>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Ballboys Tab */}
          {activeTab === 'ballboys' && courtSport === 'TENNIS' && (
            <div className="space-y-4">
              <div className="rounded-md border bg-white p-3 sm:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">Select ballboys</p>
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {ballboyAvailableForBookings.reduce(
                      (acc, group) => acc + group.slots.length,
                      0
                    )}{' '}
                    slots
                  </Badge>
                </div>
                <div className="text-muted-foreground text-[11px]">
                  {bookingItems.length > 0 ? (
                    Object.entries(bookingsByDate).map(([date, info]) => (
                      <span key={date} className="mr-3 inline-block">
                        <span className="font-medium">{info.shortDate}:</span>{' '}
                        {info.timeSlots.join(', ')}
                      </span>
                    ))
                  ) : (
                    <span className="text-amber-600">
                      Ballboy hanya bisa dipilih bersama booking lapangan tennis.
                    </span>
                  )}
                </div>
              </div>

              {bookingItems.length === 0 && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground text-sm">
                      Tambahkan booking lapangan tennis terlebih dahulu untuk memilih ballboy.
                    </p>
                  </CardContent>
                </Card>
              )}

              {bookingItems.length > 0 && ballboyAvailableForBookings.length === 0 && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground text-sm">
                      Ballboy tidak tersedia untuk jadwal booking yang dipilih.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {ballboyAvailableForBookings.map(({ booking, slots }) => {
                  const selectedForCourt = selectedBallboys.find(
                    (b) => b.courtSlotId === booking.slotId
                  );

                  return (
                    <Card key={booking.slotId} className="border-muted">
                      <CardContent className="space-y-3 p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold">{booking.courtName}</h3>
                            <p className="text-muted-foreground text-xs">
                              {dayjs(booking.date).format('ddd, DD MMM')} • {booking.timeSlot}
                            </p>
                          </div>
                          {selectedForCourt && <Badge>Dipilih</Badge>}
                        </div>

                        {slots.length === 0 ? (
                          <p className="text-muted-foreground rounded-md border px-3 py-2 text-sm">
                            Ballboy tidak tersedia di jam ini.
                          </p>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {slots.map((slot) => {
                              const isSelected = selectedForCourt?.slotId === slot.slotId;
                              const isUsedElsewhere = selectedBallboys.some(
                                (b) => b.slotId === slot.slotId && b.courtSlotId !== booking.slotId
                              );

                              return (
                                <Button
                                  key={slot.slotId}
                                  type="button"
                                  variant={isSelected ? 'default' : 'outline'}
                                  className="h-auto justify-between gap-3 px-3 py-2"
                                  disabled={isUsedElsewhere}
                                  onClick={() => handleBallboySelect(slot, booking)}
                                >
                                  <span className="min-w-0 text-left">
                                    <span className="block truncate">
                                      {slot.ballboy?.name ?? 'Ballboy'}
                                    </span>
                                    <span className="text-xs opacity-75">
                                      Rp {Number(slot.price ?? 0).toLocaleString('id-ID')}/hr
                                    </span>
                                  </span>
                                  {isUsedElsewhere && (
                                    <span className="text-[11px] opacity-70">Terpakai</span>
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-slate-50 py-3 text-center">
                <p className="text-muted-foreground mb-2 text-sm">
                  Select equipment for your booked dates and times
                </p>
                <div className="text-muted-foreground mb-2 text-xs">
                  {Object.entries(bookingsByDate).map(([date, info]) => (
                    <div key={date} className="mx-2 inline-block">
                      <strong>{info.shortDate}:</strong> {info.timeSlots.join(', ')}
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span>In Stock</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                    <span>Limited Stock</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <span>Out of Stock</span>
                  </div>
                </div>
              </div>

              {inventoryItems.length === 0 && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground text-sm">
                      {courtSport === 'TENNIS' && bookingItems.length > 0
                        ? 'Raket di jam tersebut tidak tersedia.'
                        : 'Inventory tidak tersedia.'}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {inventoryItems.map((item) => {
                  const selectedDateForInventory = bookingItems[0]?.date ?? selectedAddOnDate;
                  const currentQuantity =
                    selectedInventories.find(
                      (inventory) =>
                        inventory.inventoryId === item.id &&
                        (inventory.timeSlot ?? 'default') === 'default'
                    )?.quantity ?? 0;
                  const availableQuantity = item.availableQuantity ?? 0;

                  return (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-muted-foreground line-clamp-2 text-xs">
                              {item.description || 'Available for rent'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-primary font-bold">
                              Rp {item.price.toLocaleString('id-ID')}/item
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                availableQuantity > 10
                                  ? 'border-green-200 bg-green-50 text-green-700'
                                  : availableQuantity > 5
                                    ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                                    : 'border-orange-200 bg-orange-50 text-orange-700'
                              )}
                            >
                              {availableQuantity} tersedia
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={currentQuantity <= 0}
                              onClick={() =>
                                handleInventoryQuantityChange(
                                  item.id,
                                  item.name,
                                  'default',
                                  selectedDateForInventory,
                                  Math.max(0, currentQuantity - 1),
                                  item.price
                                )
                              }
                            >
                              <IconMinus className="h-3 w-3" />
                            </Button>

                            <Input
                              type="number"
                              min="0"
                              max={availableQuantity}
                              value={currentQuantity}
                              onChange={(e) =>
                                handleInventoryQuantityChange(
                                  item.id,
                                  item.name,
                                  'default',
                                  selectedDateForInventory,
                                  Math.min(
                                    availableQuantity,
                                    Math.max(0, parseInt(e.target.value) || 0)
                                  ),
                                  item.price
                                )
                              }
                              className="h-8 w-16 text-center"
                            />

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={currentQuantity >= availableQuantity}
                              onClick={() =>
                                handleInventoryQuantityChange(
                                  item.id,
                                  item.name,
                                  'default',
                                  selectedDateForInventory,
                                  Math.min(availableQuantity, currentQuantity + 1),
                                  item.price
                                )
                              }
                            >
                              <IconPlus className="h-3 w-3" />
                            </Button>

                            {currentQuantity > 0 && (
                              <span className="text-primary ml-2 text-xs font-medium">
                                Rp {(item.price * currentQuantity).toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Booking Summary - Responsive */}
        <BookingSummary
          bookingItems={bookingItems}
          selectedCustomerId={selectedCustomerId}
          selectedCustomerName={storeCustomerName}
          selectedCustomerPhone={storeCustomerPhone}
          walkInName={storeWalkInName}
          walkInPhone={storeWalkInPhone}
          adminNote={bookingAdminNote}
          onCustomerSelect={(customerId, customer) => {
            setSelectedCustomerId(customerId);
            setSelectedCustomer(customer);
            setSelectedCustomerDetails(customer.name, customer.phone);
            setWalkInCustomer(null, null);
          }}
          onCustomerClear={() => {
            setSelectedCustomerId(null);
            setSelectedCustomer(null);
          }}
          onWalkInSet={(name, phone) => {
            setWalkInCustomer(name, phone);
            setSelectedCustomerId(null);
            setSelectedCustomer(null);
          }}
          onAdminNoteChange={setBookingAdminNote}
          onWalkInClear={() => {
            setWalkInCustomer(null, null);
            setBookingAdminNote(null);
          }}
          selectedCoaches={selectedCoaches}
          selectedBallboys={selectedBallboys}
          selectedInventories={selectedInventories}
          onCoachRemove={removeCoach}
          onBallboyRemove={removeBallboy}
          onInventoryRemove={removeInventory}
          onBookingRemove={removeBookingItem}
          courtTotal={courtTotal}
          coachTotal={coachTotal}
          ballboyTotal={ballboyTotal}
          inventoryTotal={inventoryTotal}
          totalAmount={totalAmount}
          membershipDiscountDetails={membershipDiscount}
          useMembership={useMembership}
          onUseMembershipChange={setUseMembership}
          primaryAction={{
            label: isConfirming ? 'Processing...' : 'Confirm Booking',
            onClick: handleConfirmBooking,
            disabled: isConfirming,
            loading: isConfirming
          }}
          secondaryActions={[
            {
              label: 'Back to Court Selection',
              onClick: () => router.push('/admin/booking-lapangan'),
              variant: 'outline',
              icon: <IconChevronLeft className="mr-2 h-4 w-4" />
            }
          ]}
          width="w-full xl:w-[400px] xl:shrink-0"
        />
      </div>
    </div>
  );
}
