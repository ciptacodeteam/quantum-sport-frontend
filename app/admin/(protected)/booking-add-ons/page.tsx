'use client';

import { useState, useEffect } from 'react';
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

// Mock data for coaches - Realistic availability with some unavailable slots
const mockCoaches: Coach[] = [
  {
    id: '1',
    name: 'Carlos Rodriguez',
    image: '/assets/img/coach-1.jpg',
    experience: '8 years',
    specialization: ['Technique', 'Strategy', 'Fitness'],
    pricePerHour: 200000,
    rating: 4.9,
    availability: [
      {
        date: '2025-11-05',
        timeSlots: ['06:00', '07:00', '08:00', '10:00', '11:00', '14:00', '15:00', '18:00', '19:00']
      },
      {
        date: '2025-11-06',
        timeSlots: ['06:00', '07:00', '09:00', '10:00', '13:00', '14:00', '17:00', '18:00', '20:00', '21:00']
      },
      {
        date: '2025-11-07',
        timeSlots: ['07:00', '08:00', '10:00', '11:00', '13:00', '14:00', '16:00', '17:00', '19:00', '20:00']
      }
    ]
  },
  {
    id: '2',
    name: 'Maria Santos',
    image: '/assets/img/coach-2.jpg',
    experience: '5 years',
    specialization: ['Beginners', 'Technique'],
    pricePerHour: 150000,
    rating: 4.7,
    availability: [
      {
        date: '2025-11-05',
        timeSlots: ['06:00', '07:00', '09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00']
      },
      {
        date: '2025-11-06',
        timeSlots: ['08:00', '09:00', '11:00', '12:00', '15:00', '16:00', '19:00', '20:00', '21:00']
      },
      {
        date: '2025-11-07',
        timeSlots: ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '22:00']
      }
    ]
  }
];

// Mock data for inventory
const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Professional Padel Racket',
    image: '/assets/img/racket-1.jpg',
    description: 'High-quality carbon fiber padel racket for advanced players',
    pricePerHour: 25000,
    category: 'racket',
    quantity: 10,
    availability: [
      {
        date: '2025-11-05',
        timeSlots: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
        availableQuantity: 6
      },
      {
        date: '2025-11-06',
        timeSlots: ['06:00', '08:00', '09:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '19:00', '20:00', '22:00'],
        availableQuantity: 8
      },
      {
        date: '2025-11-07',
        timeSlots: ['07:00', '08:00', '10:00', '11:00', '13:00', '14:00', '16:00', '17:00', '18:00', '20:00', '21:00', '22:00'],
        availableQuantity: 12
      }
    ]
  },
  {
    id: '2',
    name: 'Court Shoes',
    image: '/assets/img/shoes-1.jpg',
    description: 'Non-slip court shoes for optimal grip and comfort',
    pricePerHour: 15000,
    category: 'shoes',
    quantity: 15,
    availability: [
      {
        date: '2025-11-05',
        timeSlots: ['07:00', '09:00', '10:00', '12:00', '13:00', '14:00', '16:00', '17:00', '19:00', '21:00'],
        availableQuantity: 8
      },
      {
        date: '2025-11-06',
        timeSlots: ['06:00', '08:00', '09:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '19:00', '20:00', '22:00'],
        availableQuantity: 8
      },
      {
        date: '2025-11-07',
        timeSlots: ['07:00', '08:00', '10:00', '11:00', '13:00', '14:00', '16:00', '17:00', '18:00', '20:00', '21:00', '22:00'],
        availableQuantity: 12
      }
    ]
  }
];

export default function BookingAddOns() {
  const router = useRouter();
  const {
    bookingItems,
    selectedDate,
    selectedCoaches,
    selectedInventories,
    addCoach,
    removeCoach,
    addInventory,
    removeInventory,
    updateInventoryQuantity,
    getTotalAmount,
    getTotalWithTax,
    getTax,
    courtTotal,
    coachTotal,
    inventoryTotal
  } = useBookingStore();

  const [activeTab, setActiveTab] = useState<'coaches' | 'inventory'>('coaches');
  const [inventoryQuantities, setInventoryQuantities] = useState<Record<string, number>>({});

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

  // Dynamic availability generation
  const generateRealisticAvailability = (baseAvailability: any[], selectedDate: Date) => {
    const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
    const dayOfWeek = dayjs(selectedDate).day();
    const baseEntry = baseAvailability.find(a => a.date === dateStr);
    
    if (!baseEntry) {
      // Generate dynamic availability based on day of week
      const allTimeSlots = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', 
                           '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', 
                           '20:00', '21:00', '22:00', '23:00', '00:00'];
      
      // Weekend has different patterns
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const availabilityRate = isWeekend ? 0.7 : 0.8;
      
      const availableSlots = allTimeSlots.filter(() => Math.random() < availabilityRate);
      
      return {
        date: dateStr,
        timeSlots: availableSlots,
        availableQuantity: Math.floor(Math.random() * 10) + 5
      };
    }
    
    return baseEntry;
  };

  // Helper functions for coach availability - now works with multiple dates
  const isCoachAvailable = (coach: Coach, timeSlot: string, date: string): boolean => {
    const dateObj = new Date(date);
    const availability = generateRealisticAvailability(coach.availability, dateObj);
    return availability ? availability.timeSlots.includes(timeSlot) : false;
  };

  // Check if inventory is available for specific time slot and date
  const isInventoryAvailable = (inventory: InventoryItem, timeSlot: string, date: string): { available: boolean; quantity: number } => {
    const dateObj = new Date(date);
    const availability = generateRealisticAvailability(inventory.availability, dateObj);
    if (!availability || !availability.timeSlots.includes(timeSlot)) {
      return { available: false, quantity: 0 };
    }
    return { available: true, quantity: availability.availableQuantity || 0 };
  };

  // Helper function to check if coach is available for any of the booked dates/slots
  const isCoachAvailableForBookings = (coach: Coach) => {
    return bookedDates.some(date => 
      bookingsByDate[date].timeSlots.some(timeSlot => 
        isCoachAvailable(coach, timeSlot, date)
      )
    );
  };

  // Handle coach selection
  const handleCoachSelect = (coach: Coach, timeSlot: string, date: string) => {
    const isSelected = selectedCoaches.some(c => c.coachId === coach.id && c.timeSlot === timeSlot && c.date === date);
    
    if (isSelected) {
      removeCoach(coach.id, timeSlot);
      toast.success(`Removed ${coach.name} from ${timeSlot} on ${dayjs(date).format('DD MMM')}`);
    } else {
      addCoach({
        coachId: coach.id,
        coachName: coach.name,
        timeSlot,
        price: coach.pricePerHour,
        date: date
      });
      toast.success(`Added ${coach.name} for ${timeSlot} on ${dayjs(date).format('DD MMM')}`);
    }
  };

  // Handle inventory quantity change
  const handleInventoryQuantityChange = (inventory: InventoryItem, timeSlot: string, date: string, quantity: number) => {
    const key = `${inventory.id}-${timeSlot}-${date}`;
    setInventoryQuantities(prev => ({ ...prev, [key]: quantity }));

    if (quantity > 0) {
      addInventory({
        inventoryId: inventory.id,
        inventoryName: inventory.name,
        timeSlot,
        price: inventory.pricePerHour * quantity,
        quantity,
        date: date
      });
    } else {
      removeInventory(inventory.id, timeSlot);
    }
  };

  // Get current quantity for inventory item
  const getCurrentQuantity = (inventoryId: string, timeSlot: string, date: string): number => {
    const selected = selectedInventories.find(i => i.inventoryId === inventoryId && i.timeSlot === timeSlot && i.date === date);
    return selected ? selected.quantity : 0;
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
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
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
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total:</span>
                <span className="font-bold text-primary">
                  Rp {getTotalWithTax().toLocaleString('id-ID')}
                </span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockCoaches
                  .filter(coach => isCoachAvailableForBookings(coach))
                  .map((coach) => {
                    // Get all available times for this coach across all booked dates
                    const availableSlots = Object.entries(bookingsByDate).reduce((acc, [date, dateInfo]) => {
                      const availableForDate = dateInfo.timeSlots.filter(timeSlot => 
                        isCoachAvailable(coach, timeSlot, date)
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

                    return (
                  <Card key={coach.id} className="overflow-hidden">
                    <div className="relative h-48">
                      <Image
                        src={coach.image}
                        alt={coach.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/assets/img/placeholder-coach.jpg';
                        }}
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                        <IconStar className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">{coach.rating}</span>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{coach.name}</h3>
                          <p className="text-sm text-muted-foreground">{coach.experience} experience</p>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {coach.specialization.map((spec, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">
                            Rp {coach.pricePerHour.toLocaleString('id-ID')}/hr
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
                                      onClick={() => handleCoachSelect(coach, timeSlot, date)}
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
                {mockInventory
                  .filter(item => {
                    // Check if item is available for at least one booked time slot
                    return Object.entries(bookingsByDate).some(([date, dateInfo]) => 
                      dateInfo.timeSlots.some(timeSlot => 
                        isInventoryAvailable(item, timeSlot, date).available
                      )
                    );
                  })
                  .map((item) => {
                    // Get all available times for this item across all booked dates
                    const availableSlots = Object.entries(bookingsByDate).reduce((acc, [date, dateInfo]) => {
                      const availableForDate = dateInfo.timeSlots.filter(timeSlot => 
                        isInventoryAvailable(item, timeSlot, date).available
                      ).map(timeSlot => ({
                        timeSlot,
                        availability: isInventoryAvailable(item, timeSlot, date)
                      }));
                      
                      if (availableForDate.length > 0) {
                        acc.push({
                          date,
                          shortDate: dateInfo.shortDate,
                          slots: availableForDate
                        });
                      }
                      return acc;
                    }, [] as Array<{date: string; shortDate: string; slots: Array<{timeSlot: string; availability: {available: boolean; quantity: number}}>}>);

                    return (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="relative h-32">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/assets/img/placeholder-equipment.jpg';
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="capitalize bg-white/90 text-slate-700 backdrop-blur-sm">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">
                            Rp {item.pricePerHour.toLocaleString('id-ID')}/hr
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
                                                item,
                                                timeSlot,
                                                date,
                                                Math.max(0, currentQuantity - 1)
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
                                                item,
                                                timeSlot,
                                                date,
                                                Math.min(availability.quantity, Math.max(0, parseInt(e.target.value) || 0))
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
                                                item,
                                                timeSlot,
                                                date,
                                                Math.min(availability.quantity, currentQuantity + 1)
                                              )
                                            }
                                          >
                                            <IconPlus className="h-3 w-3" />
                                          </Button>
                                          
                                          {currentQuantity > 0 && (
                                            <span className="text-xs text-primary font-medium ml-2">
                                              Rp {(item.pricePerHour * currentQuantity).toLocaleString('id-ID')}
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
                <div className="flex justify-between items-center text-sm">
                  <span>Tax (10%)</span>
                  <span>Rp {getTax().toLocaleString('id-ID')}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">
                    Rp {getTotalWithTax().toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <Button 
                  className="w-full" 
                  size="default"
                  onClick={() => {
                    toast.success('Booking confirmed! Redirecting to payment...');
                    // Here you would typically redirect to payment page
                  }}
                >
                  Confirm Booking
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