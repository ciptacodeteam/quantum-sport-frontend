'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { formatSlotTime } from '@/lib/time-utils';
import { cn, getPlaceholderImageUrl } from '@/lib/utils';
import { adminCourtCostingQueryOptions } from '@/queries/admin/court';
import { adminCustomerSearchQueryOptions, type CustomerSearchResult } from '@/queries/admin/customer';
import { useMembershipDiscount } from '@/hooks/useMembershipDiscount';
import { useBookingStore } from '@/stores/useBookingStore';
import type { Court, Slot } from '@/types/model';
import { IconCalendar, IconCheck, IconClock, IconMapPin, IconX } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';

// Helper functions to replace dayjs
const formatDate = (date: Date | string, format: string): string => {
  // Ensure we have a Date object
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
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

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return format
    .replace('YYYY', year.toString())
    .replace('MMM', monthNames[month])
    .replace('MM', pad(month + 1))
    .replace('DD', pad(day))
    .replace('dddd', dayNames[dateObj.getDay()])
    .replace('ddd', dayNamesShort[dateObj.getDay()])
    .replace('HH', pad(hours))
    .replace('mm', pad(minutes));
};

const formatDateString = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return formatDate(dateObj, 'YYYY-MM-DD');
};

// Helper to extract date string from ISO string without timezone conversion
const getDateStringFromISO = (isoString: string): string => {
  // Use the same parsing logic as formatSlotTime to avoid timezone conversion
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
  const match = isoString.match(isoRegex);
  
  if (match) {
    const year = match[1];
    const month = match[2];
    const day = match[3];
    return `${year}-${month}-${day}`;
  }
  
  // Fallback to Date parsing if regex doesn't match
  return formatDateString(new Date(isoString));
};

const startOfDay = (date: Date | string): Date => {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const isSameMonth = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
};

const isBefore = (date1: Date | string, date2: Date | string, unit?: string): boolean => {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  if (unit === 'day') {
    return startOfDay(d1).getTime() < startOfDay(d2).getTime();
  }
  return d1.getTime() < d2.getTime();
};

const addDays = (date: Date | string, days: number): Date => {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const startOfWeek = (date: Date | string): Date => {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return startOfDay(new Date(d.setDate(diff)));
};

// Time slots will be generated from actual API data

type SelectedBooking = {
  courtId: string;
  courtName: string;
  timeSlot: string;
  price: number;
  date: string;
  slotId: string;
  endTime?: string;
};

export default function BookingLapangan() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    bookingItems,
    selectedDate,
    selectedCustomerId,
    setBookingItems,
    setSelectedDate: setStoreDate,
    setSelectedCustomerId,
    setWalkInCustomer,
    setMembershipDiscount,
    walkInName: storeWalkInName,
    walkInPhone: storeWalkInPhone
  } = useBookingStore();

  const [localSelectedDate, setLocalSelectedDate] = useState<Date>(selectedDate);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [localCustomerId, setLocalCustomerId] = useState<string>(selectedCustomerId ?? '');
  const [bookings, setBookings] = useState<SelectedBooking[]>(
    bookingItems.map((item) => ({
      courtId: item.courtId,
      courtName: item.courtName,
      timeSlot: item.timeSlot,
      price: item.price,
      date: item.date,
      slotId: item.slotId || '',
      endTime: item.endTime
    }))
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  // Removed "Tambah Baru" (create customer) utility
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(customerSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Fetch slots for the selected date
  // Include next day's 00:00 slot (which is actually the end of the current day in Jakarta time)
  const selectedDateString = formatDateString(localSelectedDate);
  const slotQueryParams = useMemo(
    () => {
      const start = startOfDay(localSelectedDate);
      const end = startOfDay(addDays(localSelectedDate, 1));
      return {
        startAt: start.toISOString(),
        endAt: end.toISOString()
      };
    },
    [localSelectedDate]
  );

  const { data: slotsData, isLoading: isSlotsLoading } = useQuery(
    // courtsSlotsQueryOptions(slotQueryParams)
    adminCourtCostingQueryOptions(slotQueryParams)
  );

  // Use search endpoint instead of fetching all customers
  const { data: searchResults, isLoading: isSearching } = useQuery(
    adminCustomerSearchQueryOptions({
      q: debouncedSearch,
      limit: '20'
    })
  );

  // Calculate membership discount - convert SelectedBooking to BookingItem format
  const bookingItemsForDiscount = useMemo(
    () =>
      bookings.map((booking) => ({
        slotId: booking.slotId,
        courtId: booking.courtId,
        courtName: booking.courtName,
        timeSlot: booking.timeSlot,
        price: booking.price,
        date: booking.date,
        endTime: booking.endTime || booking.timeSlot.split(' - ')[1] || ''
      })),
    [bookings]
  );
  
  // Pass membership data from selected customer to avoid separate API call
  const membershipDiscount = useMembershipDiscount(
    localCustomerId,
    bookingItemsForDiscount,
    selectedCustomer ? { activeMembership: selectedCustomer.activeMembership } : null
  );

  // Update store with membership discount
  useEffect(() => {
    setMembershipDiscount(membershipDiscount.discountAmount);
  }, [membershipDiscount.discountAmount, setMembershipDiscount]);

  const slots = useMemo(() => slotsData ?? [], [slotsData]);

  // Extract courts from slots
  const courts = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        image?: string | null;
        pricePerHour: number;
        description?: string;
      }
    >();
    slots.forEach((slot) => {
      const courtId = slot.courtId || slot.court?.id;
      if (!courtId) return;
      if (!map.has(courtId)) {
        const court = slot.court as Court | undefined;
        map.set(courtId, {
          id: courtId,
          name: court?.name || `Court ${map.size + 1}`,
          image:
            court?.image || getPlaceholderImageUrl({ width: 160, height: 90, text: 'No Image' }),
          pricePerHour: slot.price || 0,
          description: court?.description || undefined
        });
      } else {
        // Update price if this slot has a higher price (for peak hours)
        const existing = map.get(courtId)!;
        if (slot.price && slot.price > existing.pricePerHour) {
          existing.pricePerHour = slot.price;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [slots]);

  // Get all slots for the selected date, grouped by court and time
  // Note: We include ALL slots regardless of isAvailable status
  // Slots with isAvailable: false will be shown but marked as "booked"
  const slotsByCourtAndTime = useMemo(() => {
    const map = new Map<string, Map<string, Slot & { court?: Court }>>();
    slots.forEach((slot) => {
      const courtId = slot.courtId || slot.court?.id;
      if (!courtId) return;

      // Check if this slot belongs to the selected date
      // Use timezone-safe date extraction to avoid conversion issues
      const slotDate = typeof slot.startAt === 'string' 
        ? getDateStringFromISO(slot.startAt)
        : formatDateString(slot.startAt);

      // Include ALL slots that belong to the selected date (both available and booked)
      if (slotDate === selectedDateString) {
        if (!map.has(courtId)) {
          map.set(courtId, new Map());
        }

        // Use start time (HH:mm) as key to match availableTimeSlots
        // IMPORTANT: Use the actual slot's start time, not a computed value
        const startTime = formatSlotTime(slot.startAt);
        
        // Store the slot with its start time as the key
        // If there's already a slot at this time, we'll overwrite it
        // (This shouldn't normally happen, but if it does, the last one wins)
        map.get(courtId)!.set(startTime, slot);
      }
    });

    return map;
  }, [slots, selectedDateString]);

  // Get time slots filtered by selected court (if a court is selected)
  // IMPORTANT: We include ALL time slots regardless of isAvailable status
  // Slots with isAvailable: false will be shown but marked as "booked" status
  // We do NOT filter out any slots - all slots are displayed to the user
  const availableTimeSlots = useMemo(() => {
    const timeSet = new Set<string>();
    
    // Iterate through slots and collect unique start times
    // If a court is selected, only show slots for that court
    // If no court is selected, show all slots from all courts
    slots.forEach((slot) => {
      const slotCourtId = slot.courtId || slot.court?.id;
      
      // If a court is selected, only include slots for that court
      if (selectedCourt && slotCourtId !== selectedCourt) {
        return;
      }
      
      // Use timezone-safe date extraction to avoid conversion issues
      const slotDate = typeof slot.startAt === 'string' 
        ? getDateStringFromISO(slot.startAt)
        : formatDateString(slot.startAt);
      
      // Include ALL slots for the selected date - regardless of isAvailable status
      if (slotDate === selectedDateString) {
        // Format start time as HH:mm
        const startTime = formatSlotTime(slot.startAt);
        // Add to set (automatically handles uniqueness)
        timeSet.add(startTime);
      }
    });

    // Convert to array and sort
    return Array.from(timeSet)
      .sort((a, b) => a.localeCompare(b));
  }, [slots, selectedDateString, selectedCourt]);

  // Debug: Log fetched data
  useEffect(() => {
    // Debug slots for selected date
    const slotsForDate = slots.filter((slot) => {
      const slotDate = typeof slot.startAt === 'string' 
        ? getDateStringFromISO(slot.startAt)
        : formatDateString(slot.startAt);
      return slotDate === selectedDateString;
    });
    slotsForDate.forEach((slot, index) => {
      const startTime = formatSlotTime(slot.startAt);
    });
  }, [slotsData, slots, courts, slotQueryParams, selectedDateString, availableTimeSlots]);

  // Sync with store when component mounts
  useEffect(() => {
    setLocalSelectedDate(selectedDate);
  }, [selectedDate]);

  // Get current week for horizontal scroll
  const getWeekDates = () => {
    const start = startOfWeek(localSelectedDate);
    return Array.from({ length: 14 }, (_, i) => {
      const date = addDays(start, i);
      const today = new Date();
      return {
        date: date,
        day: formatDate(date, 'ddd'),
        dayNumber: date.getDate().toString(),
        month: formatDate(date, 'MMM'),
        isToday: isSameDay(date, today),
        isCurrentMonth: isSameMonth(date, localSelectedDate)
      };
    });
  };

  const weekDates = getWeekDates();

  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot: string) => {
    if (selectedTimeSlots.includes(timeSlot)) {
      setSelectedTimeSlots((prev) => prev.filter((time) => time !== timeSlot));
    } else {
      setSelectedTimeSlots((prev) => [...prev, timeSlot]);
    }
  };

  // Handle court selection
  const handleCourtSelect = (courtId: string) => {
    setSelectedCourt(courtId);
    // Clear selected time slots when switching courts
    // This prevents selecting slots that don't exist for the new court
    setSelectedTimeSlots([]);
  };

  // Add booking to selection
  const handleAddBooking = () => {
    if (!selectedCourt || selectedTimeSlots.length === 0) {
      toast.error('Please select both time slots and a court');
      return;
    }

    const court = courts.find((c) => c.id === selectedCourt);
    if (!court) return;

    // Get the selected slots
    const selectedSlots = selectedTimeSlots
      .map((timeSlot) => {
        const slot = slotsByCourtAndTime.get(selectedCourt)?.get(timeSlot);
        return slot ? { timeSlot, slot } : null;
      })
      .filter(
        (item): item is { timeSlot: string; slot: Slot & { court?: Court } } => item !== null
      );

    if (selectedSlots.length === 0) {
      toast.error('Selected slots are not available');
      return;
    }

    // Create new bookings with the current selected date
    const currentDateFormatted = formatDateString(localSelectedDate);
    const newBookings = selectedSlots.map(({ slot, timeSlot }) => {
      // Use simple time format without timezone conversion
      const startTime = formatSlotTime(slot.startAt);
      const endTime = formatSlotTime(slot.endAt);
      const timeRange = `${startTime} - ${endTime}`;

      return {
        courtId: selectedCourt,
        courtName: court.name,
        timeSlot: timeRange,
        price: slot.price || 0,
        date: currentDateFormatted,
        slotId: slot.id,
        endTime: endTime
      } as SelectedBooking;
    });

    const updatedBookings = [...bookings, ...newBookings];
    setBookings(updatedBookings);

    // Update store - preserve existing bookings with their original dates
    const existingBookingItems = bookingItems.filter(
      (item) =>
        item.date !== currentDateFormatted ||
        !newBookings.some((nb) => nb.courtId === item.courtId && nb.timeSlot === item.timeSlot)
    );

    const newBookingItems = newBookings.map((booking) => ({
      courtId: booking.courtId,
      courtName: booking.courtName,
      timeSlot: booking.timeSlot,
      price: booking.price,
      date: booking.date,
      slotId: booking.slotId,
      endTime: booking.endTime
    }));

    const allBookingItems: any = [...existingBookingItems, ...newBookingItems];
    setBookingItems(allBookingItems);

    // Don't override the selected date in store - keep it as is

    setSelectedTimeSlots([]);
    setSelectedCourt(null);
    toast.success(
      `Added ${newBookings.length} booking(s) for ${formatDate(localSelectedDate, 'DD MMM YYYY')}`
    );
  };

  // Remove booking
  const handleRemoveBooking = (index: number) => {
    const updatedBookings = bookings.filter((_, i) => i !== index);
    setBookings(updatedBookings);

    // Update store to remove the booking item
    const updatedBookingItems: any = updatedBookings.map((booking) => {
      // Extract end time from timeSlot (format: "HH:mm - HH:mm") or use stored endTime
      const endTime = booking.endTime || booking.timeSlot.split(' - ')[1] || '';
      
      return {
        courtId: booking.courtId,
        courtName: booking.courtName,
        timeSlot: booking.timeSlot,
        price: booking.price,
        date: booking.date,
        slotId: booking.slotId,
        endTime: endTime
      };
    });

    setBookingItems(updatedBookingItems);
  };

  // Use membership discount calculation
  const totalPrice = membershipDiscount.discountedTotal;

  // Handle proceed to add-ons
  const handleProceedToAddOns = () => {
    if (!localCustomerId && !(storeWalkInName && storeWalkInPhone)) {
      toast.error('Silakan pilih pelanggan atau isi data walk-in terlebih dahulu');
      return;
    }

    if (bookings.length === 0) {
      toast.error('Silakan tambahkan minimal satu booking');
      return;
    }

    // Save customer ID to store
    setSelectedCustomerId(localCustomerId);

    // Save current bookings to store with their individual dates
    const bookingItemsForStore: any = bookings.map((booking) => ({
      courtId: booking.courtId,
      courtName: booking.courtName,
      timeSlot: booking.timeSlot,
      price: booking.price,
      date: booking.date,
      slotId: booking.slotId,
      endTime: booking.endTime || booking.timeSlot.split(' - ')[1] || ''
    }));
    setBookingItems(bookingItemsForStore);

    // Set the selected date to the most recent booking date
    const latestDate = bookings.reduce((latest, booking) => {
      const bookingDate = new Date(booking.date);
      const latestDateObj = new Date(latest);
      return bookingDate.getTime() > latestDateObj.getTime() ? booking.date : latest;
    }, bookings[0].date);
    setStoreDate(new Date(latestDate));

    toast.success('Proceeding to add-ons...');
    router.push('/admin/booking-add-ons');
  };

  // Check if time slot is already booked (system bookings + user selections)
  // const isTimeSlotBooked = (timeSlot: string, courtId?: string, checkDate?: string) => {
  //   const dateToCheck = checkDate || dayjs(localSelectedDate).format('YYYY-MM-DD');

  //   // System bookings (mock data - assuming they're for current date)
  //   const systemBooked = bookedSlots.some(
  //     (slot) => slot.timeSlot === timeSlot && (!courtId || slot.courtId === courtId)
  //   );

  //   // User bookings - only check for the specific date
  //   const userBooked = bookings.some(
  //     (booking) =>
  //       booking.timeSlot === timeSlot &&
  //       booking.date === dateToCheck &&
  //       (!courtId || booking.courtId === courtId)
  //   );

  //   return systemBooked || userBooked;
  // };

  // Get available time slots (not booked by system)
  // const getAvailableTimeSlots = () => {
  //   return timeSlots.filter((timeSlot) => {
  //     // Check if this time is available for any court
  //     return mockCourts.some(
  //       (court) =>
  //         !isTimeSlotBooked(timeSlot, court.id) ||
  //         bookings.some((b) => b.timeSlot === timeSlot && b.courtId === court.id)
  //     );
  //   });
  // };

  // Simple check: is a time slot booked?
  // 1. Check if user has already added this slot to bookings
  // 2. Find the slot by court and start time
  // 3. If isAvailable is false, it's booked
  // 4. If current time > start time, it's booked (past time)
  const isTimeSlotBooked = (timeSlot: string, courtId: string) => {
    // First, check if user has already added this slot to their bookings
    // timeSlot is in format "HH:mm" (just the start time)
    const isUserBooked = bookings.some((booking) => {
      if (booking.courtId !== courtId) return false;
      if (booking.date !== selectedDateString) return false;
      
      // Extract start time from booking.timeSlot (format: "HH:mm - HH:mm")
      const bookingStartTime = booking.timeSlot.split(' - ')[0];
      return bookingStartTime === timeSlot;
    });

    if (isUserBooked) {
      return true;
    }

    // Find the slot for this court and time
    const matchingSlot = slots.find((slot) => {
      const slotCourtId = slot.courtId || slot.court?.id;
      if (slotCourtId !== courtId) return false;

      // Check if this slot belongs to the selected date
      const slotDate = typeof slot.startAt === 'string' 
        ? getDateStringFromISO(slot.startAt)
        : formatDateString(slot.startAt);
      if (slotDate !== selectedDateString) return false;

      // Check if the slot's start time matches the timeSlot we're checking
      const slotStartTime = formatSlotTime(slot.startAt);
      return slotStartTime === timeSlot;
    });

    // If no matching slot found, it's not shown (not booked, just doesn't exist)
    if (!matchingSlot) return false;

    // Check if slot is not available
    if (!matchingSlot.isAvailable) {
      return true;
    }

    // Check if the slot's start time is in the past
    const slotStartDateTime = new Date(matchingSlot.startAt);
    const now = new Date();
    if (slotStartDateTime.getTime() < now.getTime()) {
      return true;
    }

    // Otherwise, it's available
    return false;
  };


  // const handleClearBookings = () => {
  //   setBookings([]);
  //   setBookingItems([]);
  //   toast.success('Cleared all bookings');
  // };

  return (
    <div className="w-full space-y-4 lg:space-y-6">
      <div className="w-full space-y-4 lg:space-y-6">
        {/* Header with Calendar */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <IconMapPin className="text-primary h-5 w-5" />
            <h1 className="text-xl font-bold lg:text-2xl">Padel Court Booking</h1>
          </div>

          {/* Calendar Selector */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="shrink-0 gap-2">
                <IconCalendar className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {formatDate(localSelectedDate, 'DD MMM YYYY')}
                </span>
                <span className="sm:hidden">{formatDate(localSelectedDate, 'DD MMM')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={localSelectedDate}
                onSelect={(date) => {
                  if (date) {
                    setLocalSelectedDate(date);
                    setCalendarOpen(false);
                  }
                }}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date Navigation */}
        <Card>
          <CardContent className="px-4">
            {/* Scrollable Date Selection */}
            <div
              className="flex gap-3 overflow-x-auto px-1"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {weekDates.map((dateInfo, index) => (
                <Button
                  key={index}
                  variant={
                    isSameDay(localSelectedDate, dateInfo.date)
                      ? 'default'
                      : 'outline'
                  }
                  className={cn(
                    'min-h-20 min-w-16 shrink-0 flex-col p-2 text-center',
                    dateInfo.isToday && 'border-primary border-2',
                    !dateInfo.isCurrentMonth && 'opacity-50'
                  )}
                  onClick={() => setLocalSelectedDate(dateInfo.date)}
                  disabled={isBefore(dateInfo.date, new Date(), 'day')}
                >
                  <span className="text-xs leading-tight font-medium">{dateInfo.day}</span>
                  <span className="text-lg leading-none font-bold">{dateInfo.dayNumber}</span>
                  <span className="text-xs leading-tight">{dateInfo.month}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 xl:flex-row">
          {/* Main Content - Court Selection & Time Selection */}
          <div className="flex-1 space-y-6">
            {/* Court Selection (Green Section) */}
            <Card>
              <CardHeader className="pb-3 lg:pb-6">
                <CardTitle className="text-lg lg:text-xl">Select Court</CardTitle>
                <p className="text-muted-foreground text-xs lg:text-sm">
                  Choose your preferred court
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {isSlotsLoading ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground text-sm">Loading courts...</p>
                  </div>
                ) : courts.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground text-sm">
                      No courts available for this date
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
                    {courts.map((court) => {
                      // Count slots directly from the slots array for this specific court
                      const courtSlots = slots.filter((slot) => {
                        const slotCourtId = slot.courtId || slot.court?.id;
                        if (slotCourtId !== court.id) return false;
                        const slotDate = typeof slot.startAt === 'string' 
                          ? getDateStringFromISO(slot.startAt)
                          : formatDateString(slot.startAt);
                        return slotDate === selectedDateString;
                      });

                      // Total slots for this court (all slots regardless of availability)
                      const totalSlotsCount = courtSlots.length;

                      // Available slots (not booked) for this court
                      const availableSlotsCount = courtSlots.filter((slot) => {
                        // Check if slot is available (not booked and not in the past)
                        if (!slot.isAvailable) return false;
                        const slotStartDateTime = new Date(slot.startAt);
                        const now = new Date();
                        return slotStartDateTime.getTime() >= now.getTime();
                      }).length;

                      const isDisabled = false;

                      return (
                        <div
                          key={court.id}
                          className={cn(
                            'relative overflow-hidden rounded-lg border transition-all',
                            selectedCourt === court.id
                              ? 'border-primary bg-primary/5 border-2 shadow-lg'
                              : 'border-gray-200',
                            isDisabled
                              ? 'cursor-not-allowed opacity-50'
                              : 'hover:border-primary/50 cursor-pointer hover:shadow-lg'
                          )}
                          onClick={() => !isDisabled && handleCourtSelect(court.id)}
                        >
                          {/* Court Image */}
                          <div className="relative h-24 bg-linear-to-br from-green-100 to-green-200 sm:h-28 lg:h-32">
                            {court.image ? (
                              <Image
                                src={
                                  court.image || getPlaceholderImageUrl({ width: 160, height: 90 })
                                }
                                unoptimized
                                alt={court.name}
                                className="h-full w-full object-cover"
                                fill
                                loading="eager"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <IconMapPin className="h-8 w-8 text-green-600 sm:h-10 sm:w-10 lg:h-12 lg:w-12" />
                              </div>
                            )}

                            {/* Selected Indicator */}
                            {selectedCourt === court.id && (
                              <div className="bg-primary text-primary-foreground absolute top-1 right-1 rounded-full p-1 lg:top-2 lg:right-2">
                                <IconCheck className="h-3 w-3 lg:h-4 lg:w-4" />
                              </div>
                            )}
                          </div>

                          {/* Court Info */}
                          <div className="p-3 lg:p-4">
                            <div className="mb-2 flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <h3 className="mb-1 truncate text-xs font-semibold sm:text-sm">
                                  {court.name}
                                </h3>
                                <p className="text-muted-foreground line-clamp-2 text-xs lg:line-clamp-none">
                                  {court.description}
                                </p>
                              </div>
                              <div className="ml-2 shrink-0 text-right">
                                <Badge
                                  variant="outline"
                                  className="border-green-200 bg-green-50 text-xs text-green-700"
                                >
                                  {availableSlotsCount}/{totalSlotsCount} available
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-primary truncate text-xs font-bold sm:text-sm">
                                Rp {court.pricePerHour.toLocaleString('id-ID')}/hr
                              </span>
                              {selectedCourt === court.id && (
                                <Badge variant="default" className="shrink-0 text-xs">
                                  Selected
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add to Booking Button */}
                {selectedCourt && selectedTimeSlots.length > 0 && (
                  <div className="mt-3 flex justify-center lg:mt-4 lg:justify-end">
                    <Button
                      onClick={handleAddBooking}
                      className="w-full gap-2 sm:w-auto"
                      size="default"
                    >
                      <IconCheck className="h-4 w-4" />
                      Add to Booking ({selectedTimeSlots.length})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Time Slot Selection (Red Section) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  <IconClock className="h-4 w-4 lg:h-5 lg:w-5" />
                  Select Time Slots
                </CardTitle>
                <p className="text-muted-foreground text-xs lg:text-sm">
                  {selectedCourt
                    ? 'Choose multiple time slots for your booking'
                    : 'Select a court first to see available time slots'}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {isSlotsLoading ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground text-sm">Loading time slots...</p>
                  </div>
                ) : selectedCourt ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:flex lg:flex-wrap">
                    {availableTimeSlots.length === 0 ? (
                      <div className="flex-center w-full py-8 text-center">
                        <p className="text-muted-foreground text-sm">
                          No time slots available for the selected court on this date
                        </p>
                      </div>
                    ) : (
                      // Display ALL time slots - never hide booked slots, just show them with booked indicator
                      availableTimeSlots.map((timeSlot) => {
                        const isSelected = selectedTimeSlots.includes(timeSlot);
                        const isBooked = selectedCourt
                          ? isTimeSlotBooked(timeSlot, selectedCourt)
                          : courts.some((court) => isTimeSlotBooked(timeSlot, court.id));
                        const availableCourts = courts.filter((court) =>
                          !isTimeSlotBooked(timeSlot, court.id)
                        );

                        // Always show the time slot, even if booked - just mark it visually
                        return (
                          <div key={timeSlot} className="relative">
                            <Badge
                              variant={isSelected ? 'default' : isBooked ? 'secondary' : 'outline'}
                              className={cn(
                                'w-full justify-center px-2 py-1 text-xs font-medium transition-all lg:w-auto lg:px-4 lg:py-2 lg:text-sm',
                                isSelected && 'bg-primary text-primary-foreground shadow-lg',
                                isBooked &&
                                  'cursor-not-allowed bg-gray-100 text-gray-500 opacity-50',
                                !isBooked &&
                                  !isSelected &&
                                  'hover:bg-primary/10 hover:border-primary cursor-pointer hover:scale-105'
                              )}
                              onClick={() => {
                                if (isBooked) {
                                  toast.info('Slot ini sudah dipesan');
                                } else {
                                  handleTimeSlotSelect(timeSlot);
                                }
                              }}
                            >
                              <span className="truncate">{timeSlot}</span>
                              {!selectedCourt && availableCourts.length > 0 && !isBooked && (
                                <span className="ml-1 hidden text-xs opacity-75 sm:inline">
                                  ({availableCourts.length})
                                </span>
                              )}
                            </Badge>
                            {isBooked && (
                              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" title="Booked"></div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground text-sm">
                      Select a court first to view time slots
                    </p>
                  </div>
                )}

                {selectedTimeSlots.length > 0 && (
                  <div className="bg-primary/5 flex-between mt-4 rounded-lg p-3">
                    <p className="text-primary text-sm font-medium">
                      Selected: {selectedTimeSlots.join(', ')}
                    </p>
                  </div>
                )}

                {/* Legend */}
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="mb-2 text-xs font-medium text-gray-700">Legend:</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded border border-gray-300"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="bg-primary h-3 w-3 rounded"></div>
                      <span>Selected</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="relative h-3 w-3 rounded bg-gray-300">
                        <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-red-500"></div>
                      </div>
                      <span>Booked</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">(2) = Courts available</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary - Responsive */}
          <div className="w-full xl:w-[618px] xl:shrink-0">
            <Card className="xl:sticky xl:top-6">
              <CardHeader className="pb-3 lg:pb-6">
                <CardTitle className="text-lg lg:text-xl">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 lg:space-y-4">
                {/* Customer Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pilih Pelanggan</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Popover
                        open={isCustomerOpen}
                        onOpenChange={(o) => {
                          setIsCustomerOpen(o);
                          if (!o) {
                            setCustomerSearch('');
                            setDebouncedSearch('');
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isCustomerOpen}
                            className="w-full justify-between"
                          >
                            {selectedCustomer
                              ? `${selectedCustomer.name}${selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ''}`
                              : 'Pilih pelanggan...'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                          <Command>
                            <CommandInput
                              placeholder="Cari pelanggan (min 2 karakter)..."
                              value={customerSearch}
                              onValueChange={setCustomerSearch}
                            />
                            <CommandList>
                              {isSearching ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  Mencari...
                                </div>
                              ) : debouncedSearch.length < 2 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  Ketik minimal 2 karakter untuk mencari
                                </div>
                              ) : !searchResults || searchResults.length === 0 ? (
                                <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                              ) : (
                                searchResults.map((customer) => (
                                  <CommandItem
                                    key={customer.id}
                                    value={customer.name}
                                    onSelect={() => {
                                      setLocalCustomerId(customer.id);
                                      setSelectedCustomerId(customer.id);
                                      setSelectedCustomer(customer);
                                      // Clear any walk-in selection when a customer is picked
                                      setWalkInCustomer(null, null);
                                      setIsCustomerOpen(false);
                                      setCustomerSearch('');
                                      setDebouncedSearch('');
                                    }}
                                  >
                                    <span className="truncate">
                                      {customer.name} {customer.phone && `(${customer.phone})`}
                                    </span>
                                  </CommandItem>
                                ))
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* Walk-in customer capture */}
                    <Dialog open={isWalkInOpen} onOpenChange={setIsWalkInOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          Walk-in
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Tambah Walk-in Customer</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="walkInName">Nama</Label>
                            <Input
                              id="walkInName"
                              placeholder="Nama pelanggan"
                              value={walkInName}
                              onChange={(e) => setWalkInName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="walkInPhone">Nomor Telepon</Label>
                            <Input
                              id="walkInPhone"
                              placeholder="08xxxxxxxxxx"
                              value={walkInPhone}
                              onChange={(e) => setWalkInPhone(e.target.value)}
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsWalkInOpen(false)}
                            >
                              Batal
                            </Button>
                            <Button
                              type="button"
                              disabled={!walkInName.trim() || !walkInPhone.trim()}
                              onClick={() => {
                                setWalkInCustomer(walkInName.trim(), walkInPhone.trim());
                                // Ensure we don't send userId if walk-in is set
                                setLocalCustomerId('');
                                setSelectedCustomerId(null);
                                setSelectedCustomer(null);
                                toast.success('Walk-in customer disimpan');
                                setIsWalkInOpen(false);
                              }}
                            >
                              Simpan
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Show current walk-in selection if available */}
                  {(storeWalkInName || storeWalkInPhone) && !localCustomerId && (
                    <div className="bg-muted mt-2 rounded-md border px-3 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">Walk-in:</span>{' '}
                          <span>{storeWalkInName || '-'}</span>
                          {storeWalkInPhone && (
                            <span className="text-muted-foreground ml-1">({storeWalkInPhone})</span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setWalkInCustomer(null, null);
                            toast.info('Walk-in customer dibersihkan');
                          }}
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Show membership information if available */}
                  {membershipDiscount.activeMembership && localCustomerId && (
                    <div className="bg-primary/5 mt-2 rounded-md border border-primary/20 px-3 py-2 text-xs">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-primary">Membership Aktif</span>
                        <Badge
                          variant={
                            membershipDiscount.activeMembership.isExpired ||
                            membershipDiscount.activeMembership.isSuspended
                              ? 'destructive'
                              : 'default'
                          }
                          className="text-xs"
                        >
                          {membershipDiscount.activeMembership.isExpired
                            ? 'Expired'
                            : membershipDiscount.activeMembership.isSuspended
                              ? 'Suspended'
                              : 'Active'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="text-muted-foreground">Paket:</span>{' '}
                          <span className="font-medium">
                            {membershipDiscount.activeMembership.membership.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sisa Sesi:</span>{' '}
                          <span className="font-medium">
                            {membershipDiscount.remainingSessions} sesi
                          </span>
                        </div>
                        {membershipDiscount.canUseMembership && bookings.length > 0 && (
                          <div className="text-primary mt-1 font-medium">
                            {membershipDiscount.slotsToDeduct} slot akan gratis menggunakan
                            membership
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {bookings.length === 0 ? (
                  <div className="py-6 text-center lg:py-8">
                    <IconCalendar className="text-muted-foreground/50 mx-auto mb-3 h-10 w-10 lg:mb-4 lg:h-12 lg:w-12" />
                    <p className="text-muted-foreground text-sm lg:text-base">
                      No bookings selected
                    </p>
                    <p className="text-muted-foreground text-xs lg:text-sm">
                      Select time slots and court to start booking
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Booking Items - Group by Date */}
                    <div className="max-h-48 space-y-2 overflow-y-auto lg:max-h-64 lg:space-y-3">
                      {Object.entries(
                        bookings.reduce(
                          (groups, booking, index) => {
                            const date = booking.date;
                            if (!groups[date]) groups[date] = [];
                            groups[date].push({ ...booking, originalIndex: index });
                            return groups;
                          },
                          {} as Record<string, Array<SelectedBooking & { originalIndex: number }>>
                        )
                      ).map(([date, dateBookings]) => (
                        <div key={date} className="space-y-2">
                          <div className="text-muted-foreground border-b pb-1 text-xs font-medium">
                            {formatDate(new Date(date), 'dddd, DD MMM YYYY')}
                          </div>
                          {dateBookings.map((booking) => {
                            // Check if this booking is free due to membership
                            const sortedBookings = [...bookings].sort((a, b) => {
                              const dateCompare = a.date.localeCompare(b.date);
                              if (dateCompare !== 0) return dateCompare;
                              return a.timeSlot.localeCompare(b.timeSlot);
                            });
                            const bookingIndex = sortedBookings.findIndex(
                              (b) =>
                                b.courtId === booking.courtId &&
                                b.timeSlot === booking.timeSlot &&
                                b.date === booking.date
                            );
                            const isFree =
                              membershipDiscount.canUseMembership &&
                              bookingIndex >= 0 &&
                              bookingIndex < membershipDiscount.slotsToDeduct;

                            return (
                              <div
                                key={booking.originalIndex}
                                className={cn(
                                  'bg-muted ml-2 flex items-start justify-between rounded-lg border-l-4 p-2 lg:p-3',
                                  isFree
                                    ? 'border-l-green-500 bg-green-50/50'
                                    : 'border-l-primary'
                                )}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex items-center gap-1 lg:gap-2">
                                    <IconMapPin className="text-primary h-3 w-3 shrink-0" />
                                    <p className="truncate text-xs font-medium lg:text-sm">
                                      {booking.courtName}
                                    </p>
                                    {isFree && (
                                      <Badge
                                        variant="outline"
                                        className="border-green-500 bg-green-50 text-xs text-green-700"
                                      >
                                        Gratis
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mb-1 flex items-center gap-1 lg:gap-2">
                                    <IconClock className="text-muted-foreground h-3 w-3 shrink-0" />
                                    <p className="text-muted-foreground truncate text-xs">
                                      {booking.timeSlot}
                                    </p>
                                  </div>
                                  <p
                                    className={cn(
                                      'text-xs font-semibold',
                                      isFree ? 'text-green-600 line-through' : 'text-primary'
                                    )}
                                  >
                                    {isFree ? (
                                      <>
                                        <span className="text-muted-foreground">
                                          Rp {booking.price.toLocaleString('id-ID')}
                                        </span>{' '}
                                        <span className="ml-1">Gratis</span>
                                      </>
                                    ) : (
                                      `Rp ${booking.price.toLocaleString('id-ID')}`
                                    )}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveBooking(booking.originalIndex)}
                                  className="ml-1 h-6 w-6 shrink-0 p-0 text-red-500 hover:bg-red-50 hover:text-red-700 lg:ml-2 lg:h-8 lg:w-8"
                                >
                                  <IconX className="h-3 w-3 lg:h-4 lg:w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Total */}
                    <div className="space-y-1 lg:space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs lg:text-sm">
                          Subtotal ({bookings.length} slots)
                        </span>
                        <span className="text-xs font-medium lg:text-sm">
                          Rp{' '}
                          {bookings
                            .reduce((sum, booking) => sum + booking.price, 0)
                            .toLocaleString('id-ID')}
                        </span>
                      </div>
                      {membershipDiscount.canUseMembership &&
                        membershipDiscount.slotsToDeduct > 0 && (
                          <>
                            <div className="flex items-center justify-between text-xs text-green-600 lg:text-sm">
                              <span>
                                Membership Discount ({membershipDiscount.slotsToDeduct} slot
                                {membershipDiscount.slotsToDeduct > 1 ? 's' : ''})
                              </span>
                              <span className="font-medium">
                                - Rp {membershipDiscount.discountAmount.toLocaleString('id-ID')}
                              </span>
                            </div>
                            <Separator />
                          </>
                        )}
                      <div className="flex items-center justify-between text-base font-bold lg:text-lg">
                        <span>Total</span>
                        <span className="text-primary">
                          Rp {totalPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Booking Actions */}
                    <div className="space-y-2 pt-3 lg:pt-4">
                      <Button
                        className="w-full"
                        size="default"
                        onClick={handleProceedToAddOns}
                        disabled={
                          (!localCustomerId && !(storeWalkInName && storeWalkInPhone)) ||
                          bookings.length === 0
                        }
                      >
                        Proceed to Add-Ons
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        size="sm"
                        onClick={() => {
                          setBookings([]);
                          setBookingItems([]);
                          setLocalCustomerId('');
                          setSelectedCustomerId('');
                          setSelectedCustomer(null);
                          setCustomerSearch('');
                          setDebouncedSearch('');
                          toast.info('All bookings cleared');
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
