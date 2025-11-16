'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { adminCustomersQueryOptions } from '@/queries/admin/customer';
import { adminCoachAvailabilityQueryOptions } from '@/queries/admin/coach';
import { adminInventoryAvailabilityQueryOptions } from '@/queries/admin/inventory';
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
import Image from 'next/image';
import { useMutation } from '@tanstack/react-query';
import { adminCheckoutMutationOptions } from '@/mutations/admin/checkout';

export default function BookingAddOns() {
  const router = useRouter();
  const {
    bookingItems,
    selectedDate,
    selectedCustomerId,
    selectedCoaches,
    selectedBallboys,
    selectedInventories,
    addCoach,
    removeCoach,
    addInventory,
    removeInventory,
    updateInventoryQuantity,
    getTotalAmount,
    courtTotal,
    coachTotal,
    inventoryTotal
  } = useBookingStore();

  const [activeTab, setActiveTab] = useState<'coaches' | 'inventory'>('coaches');
  const [inventoryQuantities, setInventoryQuantities] = useState<Record<string, number>>({});

  // Fetch customers to get customer name
  const { data: customers } = useQuery(adminCustomersQueryOptions);
  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

  // Get date range from bookings
  const dateRange = useMemo(() => {
    if (bookingItems.length === 0) return null;
    
    const dates = bookingItems.map(item => item.date);
    const sortedDates = dates.sort();
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];
    
    return {
      startAt: dayjs(startDate).startOf('day').toISOString(),
      endAt: dayjs(endDate).endOf('day').toISOString()
    };
  }, [bookingItems]);

  // Fetch coach availability
  const { data: coachAvailabilityData } = useQuery(
    adminCoachAvailabilityQueryOptions(dateRange?.startAt, dateRange?.endAt)
  );

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
      const dateKey = dayjs(slot.startAt).format('YYYY-MM-DD');
      const dateLabel = dayjs(slot.startAt).format('dddd, DD MMM YYYY');
      const timeRange = `${dayjs(slot.startAt).format('HH:mm')} - ${dayjs(slot.endAt).format('HH:mm')}`;

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
      .sort(([a], [b]) => dayjs(a).valueOf() - dayjs(b).valueOf())
      .map(([date, info]) => ({
        date,
        dateLabel: info.dateLabel,
        slots: info.slots.sort(
          (slotA, slotB) =>
            dayjs(`${date} ${slotA.timeRange.split(' - ')[0]}`).valueOf() -
            dayjs(`${date} ${slotB.timeRange.split(' - ')[0]}`).valueOf()
        )
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

  // If no bookings, redirect back
  useEffect(() => {
    if (bookingItems.length === 0) {
      toast.error('No court bookings found. Please book courts first.');
      router.push('/admin/booking-lapangan');
    }
  }, [bookingItems, router]);

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
    const slotDate = dayjs(date).format('YYYY-MM-DD');
    return coachAvailabilityData.some((slot) => {
      const slotStartTime = dayjs(slot.startAt).format('HH:mm');
      const slotDateStr = dayjs(slot.startAt).format('YYYY-MM-DD');
      return slot.coach.id === coachId && slotDateStr === slotDate && slotStartTime === timeSlot;
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
  const isCoachAvailableForBookings = (coach: { id: string }) => {
    return bookedDates.some(date => 
      bookingsByDate[date].timeSlots.some(timeSlot => 
        isCoachAvailable(coach.id, timeSlot, date)
      )
    );
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
  const handleCoachSelect = (coachId: string, coachName: string, timeSlot: string, date: string, price: number) => {
    const isSelected = selectedCoaches.some(c => c.coachId === coachId && c.timeSlot === timeSlot && c.date === date);
    
    if (isSelected) {
      removeCoach(coachId, timeSlot);
      toast.success(`Removed ${coachName} from ${timeSlot} on ${dayjs(date).format('DD MMM')}`);
    } else {
      addCoach({
        coachId,
        coachName,
        timeSlot,
        price,
        date: date
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
        router.push('/admin/kelola-pemesanan/lapangan');
      }
    })
  );

  const handleConfirmBooking = () => {
    if (!selectedCustomerId) {
      toast.error('Pilih pelanggan terlebih dahulu.');
      return;
    }
    if (bookingItems.length === 0) {
      toast.error('Tidak ada booking lapangan.');
      return;
    }

    const courtSlots = bookingItems.map((b) => b.slotId).filter(Boolean);
    const coachSlots = selectedCoaches.map((c) => c.slotId).filter(Boolean) as string[];
    const ballboySlots = selectedBallboys.map((b) => b.slotId).filter(Boolean) as string[];
    const inventories = selectedInventories
      .filter((i) => i.quantity > 0)
      .map((i) => ({ inventoryId: i.inventoryId, quantity: i.quantity }));

    confirmCheckout({
      userId: selectedCustomerId,
      courtSlots,
      coachSlots: coachSlots.length ? coachSlots : undefined,
      ballboySlots: ballboySlots.length ? ballboySlots : undefined,
      inventories: inventories.length ? inventories : undefined
    });
  };

  if (bookingItems.length === 0) {
    return null; // Component will redirect
  }

  return (
    <div className="w-full">
      <AppSectionHeader
        title="Booking Add-Ons"
        description="Add coaches and equipment to enhance your court booking experience"
        className="mb-6"
      />

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Mobile Summary */}
        <div className="xl:hidden">
          <Card className="bg-linear-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-primary">Booking Summary</CardTitle>
                {(bookingItems.length + selectedCoaches.length + selectedInventories.length) > 0 && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {bookingItems.length + selectedCoaches.length + selectedInventories.length} items
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {selectedCustomer && (
                <div className="mb-3 rounded-lg bg-white/50 p-2">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-semibold">{selectedCustomer.name}</p>
                  {selectedCustomer.phone && (
                    <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                  )}
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total:</span>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Total (excl. tax)</span>
                  <span className="font-bold text-primary">
                    Rp {getTotalAmount().toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Court Bookings Summary */}
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
                              {booking.timeSlot} - {booking.endTime}
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
            <div className="space-y-6">
              <div className="text-center py-3 bg-slate-50 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">
                  Select coaches for your booked dates and times
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
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span>Partially Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Unavailable</span>
                  </div>
                </div>
              </div>

              {coachAvailabilityByDate.length > 0 && (
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Coach Availability (Admin)</p>
                      <p className="text-xs text-muted-foreground">
                        Showing real-time availability from admin API
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {coachAvailabilityData?.length ?? 0} slots
                    </Badge>
                  </div>

                  <div className="mt-4 max-h-64 overflow-y-auto pr-1 space-y-4">
                    {coachAvailabilityByDate.map(({ date, dateLabel, slots }) => (
                      <div key={date} className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">{dateLabel}</p>
                        <div className="flex flex-wrap gap-2">
                          {slots.map((slot) => (
                            <div
                              key={slot.id}
                              className="border border-primary/20 bg-primary/5 rounded-lg px-3 py-2 text-left text-xs min-w-[200px] space-y-1"
                            >
                              <div>
                                <p className="font-semibold text-primary">{slot.timeRange}</p>
                                <p className="text-muted-foreground">{slot.coachName}</p>
                              </div>
                              <p className="text-primary/80 font-medium">
                                Rp {slot.price.toLocaleString('id-ID')}
                              </p>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="w-full text-[11px] py-1"
                                onClick={() => handleAddCoachFromAvailability(slot)}
                              >
                                Tambahkan ke booking
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {coaches
                  .filter(coach => isCoachAvailableForBookings(coach))
                  .map((coach) => {
                    // Get all available times for this coach across all booked dates
                    const availableSlots = Object.entries(bookingsByDate).reduce((acc, [date, dateInfo]) => {
                      const availableForDate = dateInfo.timeSlots.filter(timeSlot => 
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
                    }, [] as Array<{date: string; shortDate: string; timeSlots: string[]}>);

                    // Get coach details from first slot
                    const firstSlot = coach.slots[0];
                    if (!firstSlot) return null;

                    return (
                  <Card key={coach.id} className="overflow-hidden">
                    <div className="relative h-48">
                      <Image
                        src={firstSlot.coach.image || '/assets/img/placeholder-coach.jpg'}
                        alt={firstSlot.coach.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/assets/img/placeholder-coach.jpg';
                        }}
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                        <IconStar className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">5.0</span>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{firstSlot.coach.name}</h3>
                          <p className="text-sm text-muted-foreground">{firstSlot.coach.role || 'Professional Coach'}</p>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">
                            Certified Coach
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">
                            Rp {firstSlot.price.toLocaleString('id-ID')}/hr
                          </span>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <p className="text-sm font-medium">Available Times:</p>
                          
                          {/* Show only available times */}
                          {availableSlots.map(({ date, shortDate, timeSlots }) => (
                            <div key={date} className="space-y-2">
                              <div className="text-xs font-medium text-muted-foreground">
                                {shortDate}
                              </div>
                              <div className="grid grid-cols-3 gap-2 ml-2">
                                {timeSlots.map((timeSlot) => {
                                  const isSelected = selectedCoaches.some(c => 
                                    c.coachId === coach.id && c.timeSlot === timeSlot && c.date === date
                                  );

                                  // Find the matching slot to get the price
                                  const matchingSlot = coach.slots.find(slot => {
                                    const slotTime = dayjs(slot.startAt).format('HH:mm');
                                    const slotDate = dayjs(slot.startAt).format('YYYY-MM-DD');
                                    return slotTime === timeSlot && slotDate === date;
                                  });

                                  return (
                                    <Button
                                      key={`${date}-${timeSlot}`}
                                      variant={isSelected ? "default" : "outline"}
                                      size="sm"
                                      className={cn(
                                        "text-xs w-full",
                                        isSelected && "bg-primary text-primary-foreground shadow-md",
                                        !isSelected && "hover:bg-primary/10 hover:border-primary"
                                      )}
                                      onClick={() => handleCoachSelect(
                                        coach.id, 
                                        firstSlot.coach.name, 
                                        timeSlot, 
                                        date,
                                        matchingSlot?.price || firstSlot.price
                                      )}
                                    >
                                      {timeSlot}
                                      {isSelected && <IconCheck className="h-3 w-3 ml-1" />}
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
                  // Get all available times for this item across all booked dates
                  const availableSlots = Object.entries(bookingsByDate).reduce((acc, [date, dateInfo]) => {
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
                  }, [] as Array<{date: string; shortDate: string; slots: Array<{timeSlot: string; availability: {available: boolean; quantity: number}}>}>);

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

        {/* Right Sidebar - Detailed Summary */}
        <div className="hidden xl:block xl:w-[400px] xl:shrink-0">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              {selectedCustomer && (
                <>
                  <div className="rounded-lg bg-primary/5 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Customer</p>
                    <p className="font-semibold">{selectedCustomer.name}</p>
                    {selectedCustomer.phone && (
                      <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Court Bookings */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Court Bookings</h4>
                {Object.entries(bookingsByDate).map(([date, dateInfo]) => (
                  <div key={date} className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">
                      {dateInfo.shortDate}
                    </div>
                    {dateInfo.items.map((booking, index) => (
                      <div key={`${date}-${index}`} className="flex items-center justify-between p-2 bg-muted rounded text-xs ml-2">
                        <div>
                          <p className="font-medium">{booking.courtName}</p>
                          <p className="text-muted-foreground">{booking.timeSlot} - {booking.endTime}</p>
                        </div>
                        <span className="font-semibold text-primary">
                          Rp {booking.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Selected Coaches */}
              {selectedCoaches.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Selected Coaches</h4>
                  {selectedCoaches.map((coach, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded text-xs">
                      <div>
                        <p className="font-medium">{coach.coachName}</p>
                        <p className="text-muted-foreground">{dayjs(coach.date).format('DD MMM')} • {coach.timeSlot}</p>
                      </div>
                      <span className="font-semibold text-primary">
                        Rp {coach.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Equipment */}
              {selectedInventories.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Selected Equipment</h4>
                  {selectedInventories.map((inventory, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded text-xs">
                      <div>
                        <p className="font-medium">{inventory.inventoryName}</p>
                        <p className="text-muted-foreground">
                          {dayjs(inventory.date).format('DD MMM')} • {inventory.timeSlot} • Qty: {inventory.quantity}
                        </p>
                      </div>
                      <span className="font-semibold text-primary">
                        Rp {inventory.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Courts</span>
                  <span>Rp {courtTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Coaches</span>
                  <span>Rp {coachTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Equipment</span>
                  <span>Rp {inventoryTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">
                    Rp {getTotalAmount().toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <Button 
                  className="w-full" 
                  size="default"
                  onClick={handleConfirmBooking}
                  disabled={isConfirming}
                >
                  {isConfirming ? 'Processing...' : 'Confirm Booking'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="sm"
                  onClick={() => router.push('/admin/booking-lapangan')}
                >
                  <IconChevronLeft className="h-4 w-4 mr-2" />
                  Back to Court Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}