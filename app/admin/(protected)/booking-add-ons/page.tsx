'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/stores/useBookingStore';
import type { Coach, InventoryItem } from '@/stores/useBookingStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import AppSectionHeader from '@/components/ui/app-section-header';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { adminCustomerSearchQueryOptions, type CustomerSearchResult } from '@/queries/admin/customer';
import { adminCoachAvailabilityQueryOptions } from '@/queries/admin/coach';
import { adminInventoryAvailabilityQueryOptions } from '@/queries/admin/inventory';
import { useMembershipDiscount } from '@/hooks/useMembershipDiscount';
import BookingSummary from '@/components/admin/booking/BookingSummary';
import { 
  IconChevronLeft,
  IconStar, 
  IconUser, 
  IconClock,
  IconShoppingCart,
  IconMinus,
  IconPlus,
  IconCheck,
  IconX,
  IconCalendar,
  IconMapPin
} from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { adminCheckoutMutationOptions } from '@/mutations/admin/checkout';
import type { AdminCheckoutPayload } from '@/api/admin/checkout';

export default function BookingAddOns() {
  const router = useRouter();
  const {
    bookingItems,
    selectedDate,
    selectedCustomerId,
    selectedCustomerName: storeCustomerName,
    selectedCustomerPhone: storeCustomerPhone,
    setSelectedCustomerId,
    setSelectedCustomerDetails,
    walkInName: storeWalkInName,
    walkInPhone: storeWalkInPhone,
    setWalkInCustomer,
    selectedCoaches,
    selectedBallboys,
    selectedInventories,
    addCoach,
    removeCoach,
    addInventory,
    removeInventory,
    removeBookingItem,
    updateInventoryQuantity,
    getTotalAmount,
    setMembershipDiscount,
    courtTotal,
    coachTotal,
    inventoryTotal
  } = useBookingStore();

  const [activeTab, setActiveTab] = useState<'coaches' | 'inventory'>('coaches');
  const [inventoryQuantities, setInventoryQuantities] = useState<Record<string, number>>({});
  // Selected date and time for add-ons when no court bookings exist
  const [selectedAddOnDate, setSelectedAddOnDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [selectedAddOnTimeSlot, setSelectedAddOnTimeSlot] = useState<string>('');
  
  // Customer selection is now handled by BookingSummary component
  // Keep selectedCustomer state for membership discount calculation
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);

  // Calculate membership discount for court bookings
  // Pass membership data from selected customer to avoid separate API call
  const membershipDiscount = useMembershipDiscount(
    selectedCustomerId || null,
    bookingItems,
    selectedCustomer ? { activeMembership: selectedCustomer.activeMembership } : null
  );

  // Update store with membership discount
  useEffect(() => {
    setMembershipDiscount(membershipDiscount.discountAmount);
  }, [membershipDiscount.discountAmount, setMembershipDiscount]);

  // Get date range from bookings or selected add-on date
  const dateRange = useMemo(() => {
    if (bookingItems.length > 0) {
      const dates = bookingItems.map(item => item.date);
      const sortedDates = dates.sort();
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];
      
      return {
        startAt: dayjs(startDate).startOf('day').toISOString(),
        endAt: dayjs(endDate).endOf('day').toISOString()
      };
    }
    
    // If no bookings, use selected add-on date
    return {
      startAt: dayjs(selectedAddOnDate).startOf('day').toISOString(),
      endAt: dayjs(selectedAddOnDate).endOf('day').toISOString()
    };
  }, [bookingItems, selectedAddOnDate]);

  // Fetch coach availability
  const { data: coachAvailabilityData } = useQuery(
    adminCoachAvailabilityQueryOptions(dateRange?.startAt, dateRange?.endAt)
  );

  // Helpers to avoid timezone shifts; use UTC time parts from ISO strings
  const getISODate = (isoString: string) => (isoString ? isoString.slice(0, 10) : '');
  const getHHmmUTC = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch {
      return '';
    }
  };
  const getTimeRangeUTC = (startAt: string, endAt: string) =>
    `${getHHmmUTC(startAt)} - ${getHHmmUTC(endAt)}`;

  // Fetch inventory availability
  const { data: inventoryAvailabilityData } = useQuery(
    adminInventoryAvailabilityQueryOptions(dateRange?.startAt, dateRange?.endAt)
  );

  // Transform coach availability data to match component format
  const coaches = useMemo(() => {
    if (!coachAvailabilityData) return [];

    // Group by coach
    const coachMap = new Map<string, {
      id: string;
      name: string;
      image: string | null;
      slots: typeof coachAvailabilityData;
    }>();

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

  type AdminCoachSlot = {
    id: string;
    coachId: string;
    coachName: string;
    timeRange: string;
    price: number;
    startAt: string;
    endAt: string;
  };

  const coachAvailabilityByDate = useMemo(() => {
    if (!coachAvailabilityData || coachAvailabilityData.length === 0) return [];

    const map = new Map<
      string,
      {
        dateLabel: string;
        slots: AdminCoachSlot[];
      }
    >();

    coachAvailabilityData.forEach((slot) => {
      const dateKey = getISODate(slot.startAt);
      const dateLabel = getISODate(slot.startAt); // keep simple; avoids TZ confusion
      const timeRange = getTimeRangeUTC(slot.startAt, slot.endAt);

      if (!map.has(dateKey)) {
        map.set(dateKey, {
          dateLabel,
          slots: []
        });
      }

      map.get(dateKey)!.slots.push({
        id: slot.slotId,
        coachId: slot.coach.id,
        timeRange,
        coachName: slot.coach.name,
        price: slot.price,
        startAt: slot.startAt,
        endAt: slot.endAt
      });
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, info]) => ({
        date,
        dateLabel: info.dateLabel,
        slots: info.slots.sort((slotA, slotB) => {
          const [a] = slotA.timeRange.split(' - ');
          const [b] = slotB.timeRange.split(' - ');
          return a.localeCompare(b);
        })
      }));
  }, [coachAvailabilityData]);

  // Transform inventory availability data
  const inventoryItems = useMemo(() => {
    if (!inventoryAvailabilityData) return [];
    
    return inventoryAvailabilityData.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      availableQuantity: item.availableQuantity,
      totalQuantity: item.totalQuantity,
    }));
  }, [inventoryAvailabilityData]);

  // No longer redirecting - allow add-ons without court bookings

  // Group bookings by date and get unique dates with their time slots
  const bookingsByDate = bookingItems.reduce((groups, item) => {
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
  }, {} as Record<string, {
    date: string;
    dayName: string;
    formattedDate: string;
    shortDate: string;
    timeSlots: string[];
    items: typeof bookingItems;
  }>);

  // Get all unique time slots across all dates
  const bookedTimeSlots = Array.from(new Set(bookingItems.map(item => item.timeSlot)));
  
  // Get all unique dates
  const bookedDates = Object.keys(bookingsByDate).sort();

  // Helper functions for coach availability - now uses real API data
  const isCoachAvailable = (coachId: string, timeSlot: string, date: string): boolean => {
    if (!coachAvailabilityData) return false;
    const wantedDate = date; // already YYYY-MM-DD in store
    return coachAvailabilityData.some((slot) => {
      const slotDateStr = getISODate(slot.startAt);
      const slotTimeRange = getTimeRangeUTC(slot.startAt, slot.endAt);
      return slot.coach.id === coachId && slotDateStr === wantedDate && slotTimeRange === timeSlot;
    });
  };

  // Check if inventory is available for specific time slot and date
  const isInventoryAvailable = (inventoryId: string, timeSlot: string, date: string): { available: boolean; quantity: number } => {
    if (!inventoryAvailabilityData) return { available: false, quantity: 0 };
    
    // Find inventory by ID - inventory availability is not time-slot specific
    const item = inventoryAvailabilityData.find((inv) => inv.id === inventoryId);
    
    if (!item) {
      return { available: false, quantity: 0 };
    }
    return { available: item.availableQuantity > 0, quantity: item.availableQuantity };
  };

  // Helper function to check if coach is available for any of the booked dates/slots
  // If no bookings, check against selected add-on date/time
  const isCoachAvailableForBookings = (coach: { id: string }) => {
    if (bookingItems.length > 0) {
      return bookedDates.some(date => 
        bookingsByDate[date].timeSlots.some(timeSlot => 
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

  const handleAddCoachFromAvailability = (slot: AdminCoachSlot) => {
    const date = dayjs(slot.startAt).format('YYYY-MM-DD');
    const timeSlot = slot.timeRange;
    const dateInfo = bookingsByDate[date];

    if (!dateInfo) {
      toast.error('Tidak ada booking untuk tanggal ini. Tambahkan court terlebih dahulu.');
      return;
    }

    if (!dateInfo.timeSlots.includes(timeSlot)) {
      toast.error('Slot coach tidak cocok dengan jadwal booking yang ada.');
      return;
    }

    const alreadySelected = selectedCoaches.some(
      (coach) => coach.coachId === slot.coachId && coach.timeSlot === timeSlot && coach.date === date
    );
    if (alreadySelected) {
      toast.info('Coach sudah ditambahkan untuk jadwal ini.');
      return;
    }

    addCoach({
      coachId: slot.coachId,
      coachName: slot.coachName,
      timeSlot,
      price: slot.price,
      date,
      startAt: slot.startAt,
      endAt: slot.endAt,
      slotId: slot.id
    });

    toast.success(`Coach ${slot.coachName} ditambahkan untuk ${dayjs(date).format('DD MMM')} ${timeSlot}`);
  };

  // Handle coach selection - now uses real API data
  const handleCoachSelect = (
    coachId: string, 
    coachName: string, 
    timeSlot: string, 
    date: string, 
    price: number,
    matchingSlot?: { id: string; startAt: string; endAt: string }
  ) => {
    const isSelected = selectedCoaches.some(c => c.coachId === coachId && c.timeSlot === timeSlot && c.date === date);
    
    if (isSelected) {
      // Find the selected coach to get slotId for removal
      const selectedCoach = selectedCoaches.find(c => c.coachId === coachId && c.timeSlot === timeSlot && c.date === date);
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

  // Handle inventory quantity change - now uses real API data
  const handleInventoryQuantityChange = (inventoryId: string, inventoryName: string, timeSlot: string, date: string, quantity: number, pricePerHour: number) => {
    const key = `${inventoryId}-${timeSlot}-${date}`;
    setInventoryQuantities(prev => ({ ...prev, [key]: quantity }));

    if (quantity > 0) {
      addInventory({
        inventoryId,
        inventoryName,
        timeSlot,
        price: pricePerHour * quantity,
        quantity,
        date: date
      });
    } else {
      removeInventory(inventoryId, timeSlot);
    }
  };

  // Get current quantity for inventory item
  const getCurrentQuantity = (inventoryId: string, timeSlot: string, date: string): number => {
    const selected = selectedInventories.find(i => i.inventoryId === inventoryId && i.timeSlot === timeSlot && i.date === date);
    return selected ? selected.quantity : 0;
  };

  const { mutate: confirmCheckout, isPending: isConfirming } = useMutation(
    adminCheckoutMutationOptions({
      onSuccess: () => {
        // Reset booking store after successful admin checkout
        useBookingStore.getState().clearAll();
        router.push('/admin/kelola-pemesanan/lapangan');
      }
    })
  );

  const handleConfirmBooking = () => {
    // Allow checkout with only add-ons (no court bookings required)
    if (bookingItems.length === 0 && selectedCoaches.length === 0 && selectedBallboys.length === 0 && selectedInventories.length === 0) {
      toast.error('Minimal satu item harus dipilih.');
      return;
    }

    const courtSlots = bookingItems.map((b) => b.slotId).filter(Boolean);
    const coachSlots = selectedCoaches.map((c) => c.slotId).filter(Boolean) as string[];
    const ballboySlots = selectedBallboys.map((b) => b.slotId).filter(Boolean) as string[];
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
    const totalHours = bookingItems.length > 0 ? bookingItems.reduce((total, item) => {
      try {
        // Parse timeSlot and endTime to calculate hours
        const startTimeStr = item.timeSlot.includes(':') ? item.timeSlot : `${item.timeSlot}:00`;
        const endTimeStr = item.endTime && item.endTime.includes(':') 
          ? item.endTime 
          : item.endTime 
            ? `${item.endTime}:00`
            : null;
        
        const startTime = dayjs(`${item.date} ${startTimeStr}`, ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD H:mm'], true);
        
        if (!startTime.isValid()) {
          // Fallback: assume 1 hour per booking if parsing fails
          return total + 1;
        }
        
        let endTime;
        if (endTimeStr) {
          endTime = dayjs(`${item.date} ${endTimeStr}`, ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD H:mm'], true);
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
    }, 0) : 1; // Default to 1 hour if no court bookings

    const payload: AdminCheckoutPayload = {
      totalHours: Math.max(1, Math.round(totalHours * 100) / 100), // Round to 2 decimal places, minimum 1,
      courtSlots: courtSlots.length > 0 ? courtSlots : undefined,
      coachSlots: coachSlots.length > 0 ? coachSlots : undefined,
      ballboySlots: ballboySlots.length > 0 ? ballboySlots : undefined,
      inventories: inventories.length > 0 ? inventories : undefined
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

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Court Bookings Summary or Date/Time Selection */}
          {bookingItems.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCalendar className="h-5 w-5 text-primary" />
                  Your Court Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(bookingsByDate).map(([date, dateInfo]) => (
                    <div key={date} className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground border-b pb-1">
                        {dateInfo.dayName}, {dateInfo.formattedDate}
                      </div>
                      {dateInfo.items.map((booking, index) => (
                        <div key={`${date}-${index}`} className="flex items-center justify-between p-3 bg-muted rounded-lg border-l-4 border-l-primary ml-2">
                          <div className="flex items-center gap-3">
                            <IconMapPin className="h-4 w-4 text-primary" />
                            <div>
                              <p className="font-medium text-sm">{booking.courtName}</p>
                              <p className="text-xs text-muted-foreground">
                                {booking.timeSlot}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-primary">
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
                  <IconCalendar className="h-5 w-5 text-primary" />
                  Select Date & Time for Add-Ons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date</label>
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
                    <label className="text-sm font-medium mb-2 block">Time Slot</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00'].map((slot) => (
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
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={activeTab === 'coaches' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setActiveTab('coaches')}
            >
              <IconUser className="h-4 w-4 mr-2" />
              Coaches
              {selectedCoaches.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedCoaches.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'inventory' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setActiveTab('inventory')}
            >
              <IconShoppingCart className="h-4 w-4 mr-2" />
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
                        const range = getTimeRangeUTC(slot.startAt, slot.endAt);
                        return bookedPairs.has(`${d}|${range}`) ? acc + 1 : acc;
                      }, 0);

                      return count;
                    })()} slots
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {bookingItems.length > 0 ? (
                    Object.entries(bookingsByDate).map(([date, info]) => (
                      <span key={date} className="mr-3 inline-block">
                        <span className="font-medium">{info.shortDate}:</span> {info.timeSlots.join(', ')}
                      </span>
                    ))
                  ) : selectedAddOnTimeSlot ? (
                    <span>
                      <span className="font-medium">{dayjs(selectedAddOnDate).format('ddd, DD MMM')}:</span> {selectedAddOnTimeSlot}
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
                    const availableSlots = bookingItems.length > 0
                      ? Object.entries(bookingsByDate).reduce((acc, [date, dateInfo]) => {
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
                        }, [] as Array<{ date: string; shortDate: string; timeSlots: string[] }>)
                      : selectedAddOnTimeSlot && isCoachAvailable(coach.id, selectedAddOnTimeSlot, selectedAddOnDate)
                        ? [{
                            date: selectedAddOnDate,
                            shortDate: dayjs(selectedAddOnDate).format('ddd, DD MMM'),
                            timeSlots: [selectedAddOnTimeSlot]
                          }]
                        : [];

                    const firstSlot = coach.slots[0];
                    if (!firstSlot) return null;

                    return (
                      <Card key={coach.id} className="border-muted">
                        <CardContent className="p-3 sm:p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold">{firstSlot.coach.name}</h3>
                                <p className="text-[11px] text-muted-foreground">{firstSlot.coach.role || 'Coach'}</p>
                              </div>
                              <span className="shrink-0 text-sm font-bold text-primary">
                                Rp {firstSlot.price.toLocaleString('id-ID')}/hr
                              </span>
                            </div>

                            <div className="space-y-2">
                              {availableSlots.map(({ date, shortDate, timeSlots }) => (
                                <div key={date} className="space-y-1">
                                  <div className="text-[11px] font-medium text-muted-foreground">
                                    {shortDate}
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                    {timeSlots.map((timeSlot) => {
                                      const isSelected = selectedCoaches.some(
                                        (c) => c.coachId === coach.id && c.timeSlot === timeSlot && c.date === date
                                      );

                                      // Find the matching slot for price and slotId
                                      // timeSlot is in format "13:00 - 14:00", so we need to extract just the start time
                                      const timeSlotStart = timeSlot.split(' - ')[0];
                                      const matchingSlot = coach.slots.find((slot) => {
                                        const slotTime = getHHmmUTC(slot.startAt);
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
                                            'h-7 text-[11px] w-full truncate whitespace-nowrap px-2',
                                            isSelected && 'bg-primary text-primary-foreground shadow-sm',
                                            !isSelected && 'hover:bg-primary/10 hover:border-primary'
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
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="text-center py-3 bg-slate-50 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">
                  Select equipment for your booked dates and times
                </p>
                <div className="text-xs text-muted-foreground mb-2">
                  {Object.entries(bookingsByDate).map(([date, info]) => (
                    <div key={date} className="inline-block mx-2">
                      <strong>{info.shortDate}:</strong> {info.timeSlots.join(', ')}
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>In Stock</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span>Limited Stock</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Out of Stock</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inventoryItems.map((item) => {
                  // Get all available times for this item across all booked dates, or use selected add-on date/time
                  const availableSlots = bookingItems.length > 0
                    ? Object.entries(bookingsByDate).reduce((acc, [date, dateInfo]) => {
                        const availableForDate = dateInfo.timeSlots.map(timeSlot => {
                          const availability = isInventoryAvailable(item.id, timeSlot, date);
                          return {
                            timeSlot,
                            availability
                          };
                        });

                        acc.push({
                          date,
                          shortDate: dateInfo.shortDate,
                          slots: availableForDate
                        });

                        return acc;
                      }, [] as Array<{date: string; shortDate: string; slots: Array<{timeSlot: string; availability: {available: boolean; quantity: number}}>}>)
                    : selectedAddOnTimeSlot
                      ? [{
                          date: selectedAddOnDate,
                          shortDate: dayjs(selectedAddOnDate).format('ddd, DD MMM'),
                          slots: [{
                            timeSlot: selectedAddOnTimeSlot,
                            availability: isInventoryAvailable(item.id, selectedAddOnTimeSlot, selectedAddOnDate)
                          }]
                        }]
                      : [];

                  const hasAnyAvailability = availableSlots.some(({ slots }) =>
                    slots.some(({ availability }) => availability.available)
                  );

                    return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.description || 'Available for rent'}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">
                            Rp {item.price.toLocaleString('id-ID')}/hr
                          </span>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <p className="text-sm font-medium">Available Times:</p>
                          
                          {/* Show only available times */}
                          {availableSlots.map(({ date, shortDate, slots }) => (
                            <div key={date} className="space-y-2">
                              <div className="text-xs font-medium text-muted-foreground border-b pb-1">
                                {shortDate}
                              </div>
                              
                              <div className="space-y-2 ml-2">
                                {slots.map(({ timeSlot, availability }) => {
                                  const currentQuantity = getCurrentQuantity(item.id, timeSlot, date);

                                  return (
                                    <div key={`${date}-${timeSlot}`} className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{timeSlot}</span>
                                        {availability.available ? (
                                          <Badge variant="outline" className={cn(
                                            availability.quantity > 10 ? "bg-green-50 text-green-700 border-green-200" :
                                            availability.quantity > 5 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                            "bg-orange-50 text-orange-700 border-orange-200"
                                          )}>
                                            {availability.quantity} available
                                            {availability.quantity <= 5 && " (Limited)"}
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                                            <IconX className="h-3 w-3 mr-1" />
                                            Unavailable
                                          </Badge>
                                        )}
                                      </div>

                                      {availability.available && (
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
                                                timeSlot,
                                                date,
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
                                            max={availability.quantity}
                                            value={currentQuantity}
                                            onChange={(e) =>
                                              handleInventoryQuantityChange(
                                                item.id,
                                                item.name,
                                                timeSlot,
                                                date,
                                                Math.min(availability.quantity, Math.max(0, parseInt(e.target.value) || 0)),
                                                item.price
                                              )
                                            }
                                            className="h-8 w-16 text-center"
                                          />
                                          
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            disabled={currentQuantity >= availability.quantity}
                                            onClick={() =>
                                              handleInventoryQuantityChange(
                                                item.id,
                                                item.name,
                                                timeSlot,
                                                date,
                                                Math.min(availability.quantity, currentQuantity + 1),
                                                item.price
                                              )
                                            }
                                          >
                                            <IconPlus className="h-3 w-3" />
                                          </Button>
                                          
                                          {currentQuantity > 0 && (
                                            <span className="text-xs text-primary font-medium ml-2">
                                              Rp {(item.price * currentQuantity).toLocaleString('id-ID')}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
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
          onWalkInClear={() => {
            setWalkInCustomer(null, null);
          }}
          selectedCoaches={selectedCoaches}
          selectedInventories={selectedInventories}
          onCoachRemove={removeCoach}
          onInventoryRemove={removeInventory}
          onBookingRemove={removeBookingItem}
          courtTotal={courtTotal}
          coachTotal={coachTotal}
          inventoryTotal={inventoryTotal}
          totalAmount={getTotalAmount()}
          membershipDiscountDetails={membershipDiscount}
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
              icon: <IconChevronLeft className="h-4 w-4 mr-2" />
            }
          ]}
          width="w-full xl:w-[400px] xl:shrink-0"
        />
      </div>
    </div>
  );
}