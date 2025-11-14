'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn, getPlaceholderImageUrl } from '@/lib/utils';
import { formatSlotTimeRange, getSlotTimeKey } from '@/lib/time-utils';
import { courtsSlotsQueryOptions } from '@/queries/court';
import { useBookingStore } from '@/stores/useBookingStore';
import type { Court, Slot } from '@/types/model';
import { IconCalendar, IconCheck, IconClock, IconMapPin, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Time slots will be generated from actual API data

type SelectedBooking = {
  courtId: string;
  courtName: string;
  timeSlot: string;
  price: number;
  date: string;
};

// Indonesian day and month mappings
// const indonesianDays = {
//   Sun: 'Min',
//   Mon: 'Sen',
//   Tue: 'Sel',
//   Wed: 'Rab',
//   Thu: 'Kam',
//   Fri: 'Jum',
//   Sat: 'Sab'
// };

// const indonesianMonths = {
//   Jan: 'Jan',
//   Feb: 'Feb',
//   Mar: 'Mar',
//   Apr: 'Apr',
//   May: 'Mei',
//   Jun: 'Jun',
//   Jul: 'Jul',
//   Aug: 'Agu',
//   Sep: 'Sep',
//   Oct: 'Okt',
//   Nov: 'Nov',
//   Dec: 'Des'
// };

// Helper functions for Indonesian formatting
// const getIndonesianDay = (date: dayjs.Dayjs) => {
//   const englishDay = date.format('ddd');
//   return indonesianDays[englishDay as keyof typeof indonesianDays] || englishDay;
// };

// const getIndonesianMonth = (date: dayjs.Dayjs) => {
//   const englishMonth = date.format('MMM');
//   return indonesianMonths[englishMonth as keyof typeof indonesianMonths] || englishMonth;
// };

export default function BookingLapangan() {
  const router = useRouter();
  const {
    bookingItems,
    selectedDate,
    setBookingItems,
    setSelectedDate: setStoreDate
    // getTotalAmount,
    // getTotalWithTax
  } = useBookingStore();

  const [localSelectedDate, setLocalSelectedDate] = useState<Date>(selectedDate);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [bookings, setBookings] = useState<SelectedBooking[]>(
    bookingItems.map((item) => ({
      courtId: item.courtId,
      courtName: item.courtName,
      timeSlot: item.timeSlot,
      price: item.price,
      date: item.date
    }))
  );
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Fetch slots for the selected date
  // Include next day's 00:00 slot (which is actually the end of the current day in Jakarta time)
  const selectedDateString = dayjs(localSelectedDate).format('YYYY-MM-DD');
  const slotQueryParams = useMemo(
    () => ({
      startAt: dayjs(selectedDateString).startOf('day').toISOString(),
      endAt: dayjs(selectedDateString).add(1, 'day').startOf('day').toISOString()
    }),
    [selectedDateString]
  );

  const { data: slotsData, isLoading: isSlotsLoading } = useQuery(
    courtsSlotsQueryOptions(slotQueryParams)
  );

  const slots = useMemo(() => slotsData ?? [], [slotsData]);

  // Extract courts from slots
  const courts = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; image?: string | null; pricePerHour: number; description?: string }
    >();
    slots.forEach((slot) => {
      const courtId = slot.courtId || slot.court?.id;
      if (!courtId) return;
      if (!map.has(courtId)) {
        const court = slot.court as Court | undefined;
        map.set(courtId, {
          id: courtId,
          name: court?.name || `Court ${map.size + 1}`,
          image: court?.image || getPlaceholderImageUrl({ width: 160, height: 90, text: 'No Image' }),
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

  // Get available slots for the selected date, grouped by court and time
  const slotsByCourtAndTime = useMemo(() => {
    const map = new Map<string, Map<string, Slot & { court?: Court }>>();
    slots.forEach((slot) => {
      const courtId = slot.courtId || slot.court?.id;
      if (!courtId) return;
      
      // Check if this slot belongs to the selected date
      // Convert slot date to Jakarta timezone for comparison
      const slotDateInJakarta = dayjs.utc(slot.startAt).tz('Asia/Jakarta').format('YYYY-MM-DD');
      
      // Only include slots that belong to the selected date
      if (slotDateInJakarta === selectedDateString) {
        if (!map.has(courtId)) {
          map.set(courtId, new Map());
        }
        
        // Format time as "07.00" instead of "07:00"
        const slotTime = getSlotTimeKey(slot.startAt).replace(':', '.');
        map.get(courtId)!.set(slotTime, slot);
      }
    });
    
    return map;
  }, [slots, selectedDateString]);

  // Get all unique time slots from available slots (sorted)
  const availableTimeSlots = useMemo(() => {
    const timeSet = new Set<string>();
    slots.forEach((slot) => {
      const slotDateInJakarta = dayjs.utc(slot.startAt).tz('Asia/Jakarta').format('YYYY-MM-DD');
      if (slotDateInJakarta === selectedDateString) {
        const slotTime = getSlotTimeKey(slot.startAt).replace(':', '.');
        timeSet.add(slotTime);
      }
    });
    
    // Sort times
    return Array.from(timeSet).sort((a, b) => {
      const timeA = parseInt(a.replace('.', ''));
      const timeB = parseInt(b.replace('.', ''));
      return timeA - timeB;
    });
  }, [slots, selectedDateString]);

  // Sync with store when component mounts
  useEffect(() => {
    setLocalSelectedDate(selectedDate);
  }, [selectedDate]);

  // Get current week for horizontal scroll
  const getWeekDates = () => {
    const start = dayjs(localSelectedDate).startOf('week');
    return Array.from({ length: 14 }, (_, i) => {
      const date = start.add(i, 'day');
      return {
        date: date.toDate(),
        day: date.format('ddd'),
        dayNumber: date.format('D'),
        month: date.format('MMM'),
        isToday: date.isSame(dayjs(), 'day'),
        isCurrentMonth: date.isSame(dayjs(localSelectedDate), 'month')
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
      .filter((item): item is { timeSlot: string; slot: Slot & { court?: Court } } => item !== null);

    if (selectedSlots.length === 0) {
      toast.error('Selected slots are not available');
      return;
    }

    // Create new bookings with the current selected date
    const currentDateFormatted = dayjs(localSelectedDate).format('YYYY-MM-DD');
    const newBookings = selectedSlots.map(({ slot }) => {
      const timeSlot = formatSlotTimeRange(slot.startAt, slot.endAt);
      
      return {
        courtId: selectedCourt,
        courtName: court.name,
        timeSlot,
        price: slot.price || 0,
        date: currentDateFormatted
      };
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
      date: booking.date
    }));

    const allBookingItems: any = [...existingBookingItems, ...newBookingItems];
    setBookingItems(allBookingItems);

    // Don't override the selected date in store - keep it as is

    setSelectedTimeSlots([]);
    setSelectedCourt(null);
    toast.success(
      `Added ${newBookings.length} booking(s) for ${dayjs(localSelectedDate).format('DD MMM YYYY')}`
    );
  };

  // Remove booking
  const handleRemoveBooking = (index: number) => {
    const updatedBookings = bookings.filter((_, i) => i !== index);
    setBookings(updatedBookings);

    // Update store to remove the booking item
    const updatedBookingItems: any = updatedBookings.map((booking) => ({
      courtId: booking.courtId,
      courtName: booking.courtName,
      timeSlot: booking.timeSlot,
      price: booking.price,
      date: booking.date,
      endTime: dayjs(`2000-01-01 ${booking.timeSlot}`).add(1, 'hour').format('HH:mm')
    }));

    setBookingItems(updatedBookingItems);
  };

  // Calculate total price
  const totalPrice = bookings.reduce((sum, booking) => sum + booking.price, 0);

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

  // Check if a time slot is available for a court
  const isTimeSlotAvailableForCourt = (timeSlot: string, courtId: string) => {
    const slot = slotsByCourtAndTime.get(courtId)?.get(timeSlot);
    
    // If slot doesn't exist, it's booked
    if (!slot) return false;
    
    // If slot exists but isAvailable is false, it's booked
    if (!slot.isAvailable) return false;
    
    const dateToCheck = dayjs(localSelectedDate).format('YYYY-MM-DD');
    const timeSlotWithColon = timeSlot.replace('.', ':');
    const slotTimeRange = formatSlotTimeRange(slot.startAt, slot.endAt);
    
    // Check user bookings for the specific date
    const userBooked = bookings.some(
      (booking) =>
        booking.timeSlot === slotTimeRange && 
        booking.courtId === courtId && 
        booking.date === dateToCheck
    );

    return !userBooked;
  };

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
                  {dayjs(localSelectedDate).format('DD MMM YYYY')}
                </span>
                <span className="sm:hidden">{dayjs(localSelectedDate).format('DD MMM')}</span>
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
          <CardContent className="p-4">
            {/* Scrollable Date Selection */}
            <div
              className="flex gap-3 overflow-x-auto px-1 pb-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {weekDates.map((dateInfo, index) => (
                <Button
                  key={index}
                  variant={
                    dayjs(localSelectedDate).isSame(dayjs(dateInfo.date), 'day')
                      ? 'default'
                      : 'outline'
                  }
                  className={cn(
                    'h-16 min-w-16 flex-shrink-0 shrink-0 flex-col p-3',
                    dateInfo.isToday && 'border-primary border-2',
                    !dateInfo.isCurrentMonth && 'opacity-50'
                  )}
                  onClick={() => setLocalSelectedDate(dateInfo.date)}
                  disabled={dayjs(dateInfo.date).isBefore(dayjs(), 'day')}
                >
                  <span className="text-xs leading-tight font-medium">{dateInfo.day}</span>
                  <span className="my-1 text-lg leading-none font-bold">{dateInfo.dayNumber}</span>
                  <span className="text-xs leading-tight">{dateInfo.month}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 xl:flex-row">
          {/* Mobile: Enhanced Booking Summary at top */}
          <div className="xl:hidden">
            <Card className="from-primary/5 to-primary/10 border-primary/20 bg-linear-to-r">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-primary">Quick Summary</CardTitle>
                  {bookings.length > 0 && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {bookings.length} items
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {bookings.length > 0 ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total:</span>
                    <span className="text-primary font-bold">
                      Rp {(totalPrice * 1.1).toLocaleString('id-ID')}
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No bookings yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Time Selection & Court Selection */}
          <div className="flex-1 space-y-6">
            {/* Time Slot Selection (Red Section) */}
            <Card>
              <CardHeader className="pb-3 lg:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  <IconClock className="h-4 w-4 lg:h-5 lg:w-5" />
                  Select Time Slots
                </CardTitle>
                <p className="text-muted-foreground text-xs lg:text-sm">
                  Choose multiple time slots for your booking
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {isSlotsLoading ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground text-sm">Loading time slots...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:flex lg:flex-wrap">
                    {availableTimeSlots.map((timeSlot) => {
                      const isSelected = selectedTimeSlots.includes(timeSlot);
                      const isBooked = selectedCourt
                        ? !isTimeSlotAvailableForCourt(timeSlot, selectedCourt)
                        : !courts.some((court) => isTimeSlotAvailableForCourt(timeSlot, court.id));
                      const availableCourts = courts.filter((court) =>
                        isTimeSlotAvailableForCourt(timeSlot, court.id)
                      );

                      return (
                        <div key={timeSlot} className="relative">
                          <Badge
                            variant={isSelected ? 'default' : isBooked ? 'secondary' : 'outline'}
                            className={cn(
                              'w-full justify-center px-2 py-1 text-xs font-medium transition-all lg:w-auto lg:px-4 lg:py-2 lg:text-sm',
                              isSelected && 'bg-primary text-primary-foreground shadow-lg',
                              isBooked && 'cursor-not-allowed bg-gray-100 text-gray-500 opacity-50',
                              !isBooked &&
                                !isSelected &&
                                'hover:bg-primary/10 hover:border-primary cursor-pointer hover:scale-105'
                            )}
                            onClick={() => !isBooked && handleTimeSlotSelect(timeSlot)}
                          >
                            <span className="truncate">{timeSlot}</span>
                            {!selectedCourt && availableCourts.length > 0 && (
                              <span className="ml-1 hidden text-xs opacity-75 sm:inline">
                                ({availableCourts.length})
                              </span>
                            )}
                          </Badge>
                          {isBooked && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-red-500"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedTimeSlots.length > 0 && (
                  <div className="bg-primary/5 mt-4 rounded-lg p-3">
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
                    <p className="text-muted-foreground text-sm">No courts available for this date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
                    {courts.map((court) => {
                    const availableSlotsCount = availableTimeSlots.filter((timeSlot) =>
                      isTimeSlotAvailableForCourt(timeSlot, court.id)
                    ).length;
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
                            <img
                              src={court.image}
                              alt={court.name}
                              className="h-full w-full object-cover"
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
                                {availableSlotsCount} available
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
          </div>

          {/* Right Sidebar - Booking Summary */}
          <div className="hidden xl:block xl:w-[618px] xl:shrink-0">
            <Card className="lg:sticky lg:top-6">
              <CardHeader className="pb-3 lg:pb-6">
                <CardTitle className="text-lg lg:text-xl">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 lg:space-y-4">
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
                            {dayjs(date).format('dddd, DD MMM YYYY')}
                          </div>
                          {dateBookings.map((booking) => (
                            <div
                              key={booking.originalIndex}
                              className="bg-muted border-l-primary ml-2 flex items-start justify-between rounded-lg border-l-4 p-2 lg:p-3"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center gap-1 lg:gap-2">
                                  <IconMapPin className="text-primary h-3 w-3 shrink-0" />
                                  <p className="truncate text-xs font-medium lg:text-sm">
                                    {booking.courtName}
                                  </p>
                                </div>
                                <div className="mb-1 flex items-center gap-1 lg:gap-2">
                                  <IconClock className="text-muted-foreground h-3 w-3 shrink-0" />
                                  <p className="text-muted-foreground truncate text-xs">
                                    {booking.timeSlot}
                                  </p>
                                </div>
                                <p className="text-primary text-xs font-semibold">
                                  Rp {booking.price.toLocaleString('id-ID')}
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
                          ))}
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
                          Rp {totalPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs lg:text-sm">Tax (10%)</span>
                        <span className="text-xs font-medium lg:text-sm">
                          Rp {(totalPrice * 0.1).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-base font-bold lg:text-lg">
                        <span>Total</span>
                        <span className="text-primary">
                          Rp {(totalPrice * 1.1).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Booking Actions */}
                    <div className="space-y-2 pt-3 lg:pt-4">
                      <Button
                        className="w-full"
                        size="default"
                        onClick={() => {
                          if (bookings.length === 0) {
                            toast.error('Please add at least one booking before proceeding');
                            return;
                          }
                          // Save current bookings to store with their individual dates
                          const bookingItemsForStore: any = bookings.map((booking) => ({
                            courtId: booking.courtId,
                            courtName: booking.courtName,
                            timeSlot: booking.timeSlot,
                            price: booking.price,
                            date: booking.date
                          }));
                          setBookingItems(bookingItemsForStore);

                          // Set the selected date to the most recent booking date
                          const latestDate = bookings.reduce((latest, booking) => {
                            return dayjs(booking.date).isAfter(dayjs(latest))
                              ? booking.date
                              : latest;
                          }, bookings[0].date);
                          setStoreDate(new Date(latestDate));

                          toast.success('Proceeding to add-ons...');
                          router.push('/admin/booking-add-ons');
                        }}
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
