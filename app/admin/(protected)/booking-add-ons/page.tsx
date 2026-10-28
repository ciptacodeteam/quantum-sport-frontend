'use client';

import type { AdminCheckoutPayload } from '@/api/admin/checkout';
import { countConcurrentSessions, getEquipmentDayRange } from '@/lib/addon-equipment';
import BookingSummary from '@/components/admin/booking/BookingSummary';
import AppSectionHeader from '@/components/ui/app-section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DatePickerInput from '@/components/ui/date-picker-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useMembershipDiscount } from '@/hooks/useMembershipDiscount';
import { formatSlotTime } from '@/lib/time-utils';
import { cn, resolveMediaUrl } from '@/lib/utils';
import { adminCheckoutMutationOptions } from '@/mutations/admin/checkout';
import { type CustomerSearchResult } from '@/queries/admin/customer';
import { adminInventoryAvailabilityQueryOptions } from '@/queries/admin/inventory';
import { useBookingStore } from '@/stores/useBookingStore';
import {
  IconCalendar,
  IconChevronLeft,
  IconMapPin,
  IconMinus,
  IconPlus,
  IconPackage
} from '@tabler/icons-react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Image from 'next/image';
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
    selectedInventories,
    addInventory,
    removeInventory,
    removeBookingItem,
    // updateInventoryQuantity,
    setMembershipDiscount,
    courtTotal,
    inventoryTotal
  } = useBookingStore();

  const queryClient = useQueryClient();

  // const [inventoryQuantities, setInventoryQuantities] = useState<Record<string, number>>({});
  // Selected date and time for add-ons when no court bookings exist
  const [selectedAddOnDate, setSelectedAddOnDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [selectedEquipmentSport, setSelectedEquipmentSport] = useState<'PADEL' | 'TENNIS'>('PADEL');
  const [useMembership, setUseMembership] = useState(true);
  const courtSport = useMemo<'PADEL' | 'TENNIS'>(
    () => bookingItems.find((item) => item.sport)?.sport ?? 'PADEL',
    [bookingItems]
  );
  useEffect(() => {
    if (bookingItems.length > 0) {
      setSelectedEquipmentSport(courtSport);
    }
  }, [bookingItems.length, courtSport]);

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

  const totalAmount = membershipDiscount.discountedTotal + inventoryTotal;

  const dateRange = useMemo(() => {
    if (bookingItems.length > 0) {
      const dates = bookingItems.map((item) => item.date);
      const sortedDates = dates.sort();
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];

      return {
        startAt: getEquipmentDayRange(startDate).startAt,
        endAt: getEquipmentDayRange(endDate).endAt
      };
    }

    // If no bookings, use selected add-on date
    return {
      startAt: getEquipmentDayRange(selectedAddOnDate).startAt,
      endAt: getEquipmentDayRange(selectedAddOnDate).endAt
    };
  }, [bookingItems, selectedAddOnDate]);

  const inventoryDateRange = useMemo(() => {
    const bookingsWithSlotRange = bookingItems.filter((item) => item.startAt && item.endAt);

    if (bookingsWithSlotRange.length === 0) return dateRange;

    const sortedStarts = bookingsWithSlotRange.map((item) => item.startAt as string).sort();
    const sortedEnds = bookingsWithSlotRange.map((item) => item.endAt as string).sort();

    return {
      startAt: sortedStarts[0],
      endAt: sortedEnds[sortedEnds.length - 1]
    };
  }, [bookingItems, dateRange]);

  // Helpers to avoid timezone shifts; use local time parts from ISO strings (same as court slots)
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
  const getBookingRangeMs = (booking: (typeof bookingItems)[number]) => {
    const startAt = booking.startAt ?? `${booking.date}T${getBookingStartTime(booking)}:00`;
    const endAt = booking.endAt ?? `${booking.date}T${getBookingEndTime(booking)}:00`;
    const start = dayjs(startAt).valueOf();
    const rawEnd = dayjs(endAt).valueOf();

    return {
      start,
      end: rawEnd <= start ? rawEnd + 24 * 60 * 60 * 1000 : rawEnd
    };
  };
  // Fetch inventory availability
  const { data: inventoryAvailabilityData } = useQuery(
    adminInventoryAvailabilityQueryOptions(
      inventoryDateRange?.startAt,
      inventoryDateRange?.endAt,
      selectedEquipmentSport
    )
  );
  const inventoryAvailabilityByBooking = useQueries({
    queries: bookingItems.map((booking) => {
      const startAt = booking.startAt ?? `${booking.date}T${getBookingStartTime(booking)}:00`;
      const endAt = booking.endAt ?? `${booking.date}T${getBookingEndTime(booking)}:00`;

      return adminInventoryAvailabilityQueryOptions(startAt, endAt, selectedEquipmentSport);
    })
  });

  const inventoryItems = useMemo(() => {
    if (!inventoryAvailabilityData) return [];

    return inventoryAvailabilityData.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      image: item.image || null,
      price: item.price,
      availableQuantity: item.availableQuantity,
      totalQuantity: item.totalQuantity
    }));
  }, [inventoryAvailabilityData]);

  const inventoryItemsByBooking = useMemo(
    () =>
      bookingItems.map((booking, index) => ({
        booking,
        items: (
          (inventoryAvailabilityByBooking[index]?.data ?? inventoryItems) as typeof inventoryItems
        ).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          image: item.image || null,
          price: item.price,
          availableQuantity: item.availableQuantity,
          totalQuantity: item.totalQuantity
        })),
        isPending: inventoryAvailabilityByBooking[index]?.isPending ?? false,
        isError: inventoryAvailabilityByBooking[index]?.isError ?? false
      })),
    [bookingItems, inventoryAvailabilityByBooking, inventoryItems]
  );

  const equipmentCatalog = Array.from(
    new Map(
      (bookingItems.length > 0
        ? inventoryItemsByBooking.flatMap((group) => group.items)
        : inventoryItems
      ).map((item) => [item.id, item])
    ).values()
  );

  const equipmentSelection = (item: (typeof inventoryItems)[number]) => {
    const sessions = inventoryItemsByBooking.filter((group) =>
      group.items.some((entry) => entry.id === item.id)
    );
    const concurrency = countConcurrentSessions(
      sessions.map(({ booking }) => getBookingRangeMs(booking))
    );
    const stock =
      sessions.length > 0
        ? Math.min(
            ...sessions.map(
              (group) => group.items.find((entry) => entry.id === item.id)?.availableQuantity ?? 0
            )
          )
        : (item.availableQuantity ?? 0);
    const quantities = sessions.map(
      ({ booking }) =>
        selectedInventories.find(
          (entry) => entry.inventoryId === item.id && entry.timeSlot === booking.slotId
        )?.quantity ?? 0
    );
    const quantity =
      quantities.length > 0
        ? Math.min(...quantities)
        : (selectedInventories.find(
            (entry) => entry.inventoryId === item.id && entry.date === selectedAddOnDate
          )?.quantity ?? 0);
    return {
      sessions,
      max: Math.floor(stock / concurrency),
      quantity,
      mixed: new Set(quantities).size > 1
    };
  };

  const updateEquipment = (item: (typeof inventoryItems)[number], requested: number) => {
    const { sessions, max } = equipmentSelection(item);
    const quantity = Math.max(0, Math.min(Math.floor(requested), max));
    if (bookingItems.length === 0) {
      selectedInventories
        .filter((entry) => entry.inventoryId === item.id && !entry.courtSlotId)
        .forEach((entry) => removeInventory(entry.inventoryId, entry.timeSlot));
      handleInventoryQuantityChange(
        item.id,
        item.name,
        'default',
        selectedAddOnDate,
        quantity,
        item.price
      );
      return;
    }
    selectedInventories
      .filter((entry) => entry.inventoryId === item.id)
      .forEach((entry) => removeInventory(entry.inventoryId, entry.timeSlot));
    if (quantity === 0) return;
    sessions.forEach(({ booking }) =>
      addInventory({
        inventoryId: item.id,
        inventoryName: item.name,
        timeSlot: booking.slotId,
        quantity,
        price: item.price * quantity,
        date: booking.date,
        courtId: booking.courtId,
        courtName: booking.courtName,
        courtSlotId: booking.slotId,
        startAt: booking.startAt,
        endAt: booking.endAt,
        courtSport: booking.sport ?? selectedEquipmentSport
      })
    );
  };

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
  const handleInventoryQuantityChange = (
    inventoryId: string,
    inventoryName: string,
    timeSlot: string,
    date: string,
    quantity: number,
    pricePerItem: number
  ) => {
    const range = getEquipmentDayRange(date);
    if (!range.startAt || !range.endAt) {
      toast.error('Pilih tanggal equipment terlebih dahulu.');
      return;
    }
    if (quantity > 0) {
      addInventory({
        inventoryId,
        inventoryName,
        timeSlot,
        date,
        quantity,
        price: pricePerItem * quantity,
        startAt: range.startAt,
        endAt: range.endAt,
        courtSport: selectedEquipmentSport
      });
    } else {
      removeInventory(inventoryId, timeSlot);
    }
  };

  // Retired add-ons must not remain hidden in a persisted cart.
  useEffect(() => {
    const state = useBookingStore.getState();
    if (state.selectedCoaches.length || state.selectedBallboys.length || state.coachDescription) {
      useBookingStore.setState({
        selectedCoaches: [],
        selectedBallboys: [],
        coachTotal: 0,
        ballboyTotal: 0,
        coachDescription: null
      });
    }
  }, []);

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
    if (bookingItems.length === 0 && selectedInventories.length === 0) {
      toast.error('Minimal satu item harus dipilih.');
      return;
    }

    const courtSlots = bookingItems.map((b) => b.slotId).filter(Boolean);
    const inventories = selectedInventories
      .filter((i) => i.quantity > 0)
      .map((i) => ({
        inventoryId: i.inventoryId,
        quantity: i.quantity,
        ...(i.courtSlotId ? { courtSlotId: i.courtSlotId } : {}),
        ...(!i.courtSlotId && i.startAt && i.endAt
          ? {
              startAt: i.startAt,
              endAt: i.endAt,
              courtSport: i.courtSport
            }
          : {})
      }));

    // Validate at least one of the items exists
    if (courtSlots.length === 0 && inventories.length === 0) {
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
      inventories: inventories.length > 0 ? inventories : undefined,
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
    <div className="flex w-full min-w-0 flex-col gap-6">
      <AppSectionHeader
        title="Booking Add-Ons"
        description="Choose equipment and quantities for your booking"
        className="mb-0 pb-0"
      />

      <div className="grid min-w-0 grid-cols-1 items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Main Content */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* Court Bookings Summary or Date/Time Selection */}
          {bookingItems.length > 0 ? (
            <Card className="min-w-0 gap-4 py-5">
              <CardHeader className="gap-2 px-5">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base leading-snug">
                  <IconCalendar className="text-primary h-5 w-5" />
                  Your Court Bookings
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5">
                <div className="flex flex-col gap-5">
                  {Object.entries(bookingsByDate).map(([date, dateInfo]) => (
                    <div key={date} className="flex flex-col gap-3">
                      <p className="text-muted-foreground text-xs font-medium">
                        {dateInfo.dayName}, {dateInfo.formattedDate}
                      </p>
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-3">
                        {Array.from(new Set(dateInfo.items.map((booking) => booking.courtId))).map(
                          (courtId) => {
                            const sessions = dateInfo.items
                              .filter((booking) => booking.courtId === courtId)
                              .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
                            return (
                              <section
                                key={courtId}
                                aria-label={sessions[0].courtName}
                                className="min-w-0 overflow-hidden rounded-lg border"
                              >
                                <div className="bg-muted/40 flex items-center gap-2.5 border-b px-4 py-3">
                                  <IconMapPin
                                    className="text-muted-foreground size-4 shrink-0"
                                    aria-hidden="true"
                                  />
                                  <h3 className="text-sm leading-snug font-medium break-words">
                                    {sessions[0].courtName}
                                  </h3>
                                </div>
                                <dl className="divide-y px-4">
                                  {sessions.map((booking) => (
                                    <div
                                      key={booking.slotId}
                                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
                                    >
                                      <dt className="text-muted-foreground text-xs tabular-nums">
                                        {booking.timeSlot}
                                      </dt>
                                      <dd className="text-sm font-medium tabular-nums">
                                        Rp {booking.price.toLocaleString('id-ID')}
                                      </dd>
                                    </div>
                                  ))}
                                </dl>
                              </section>
                            );
                          }
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="min-w-0 gap-4 py-5">
              <CardHeader className="px-5">
                <CardTitle className="text-base">Equipment booking</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-4 px-5">
                <div className="space-y-2 [&_button]:h-11">
                  <p className="text-muted-foreground text-xs font-medium">Date</p>
                  <DatePickerInput
                    value={dayjs(selectedAddOnDate).toDate()}
                    minDate={dayjs().startOf('day').toDate()}
                    onValueChange={(date) => {
                      if (date) {
                        const nextDate = dayjs(date).format('YYYY-MM-DD');
                        if (nextDate !== selectedAddOnDate) {
                          selectedInventories
                            .filter((item) => !item.courtSlotId)
                            .forEach((item) => removeInventory(item.inventoryId, item.timeSlot));
                          setSelectedAddOnDate(nextDate);
                        }
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="equipment-sport"
                    className="text-muted-foreground block text-xs font-medium"
                  >
                    Sport
                  </label>
                  <Select
                    value={selectedEquipmentSport}
                    onValueChange={(sport) =>
                      setSelectedEquipmentSport(sport as 'PADEL' | 'TENNIS')
                    }
                  >
                    <SelectTrigger id="equipment-sport" className="w-full data-[size=default]:h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PADEL">Padel</SelectItem>
                      <SelectItem value="TENNIS">Tennis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory Tab */}
          <section aria-label="Equipment" className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                <h2 className="text-base font-semibold">Equipment</h2>
              </div>
              <Badge variant="secondary">
                {selectedEquipmentSport === 'TENNIS' ? 'Tennis' : 'Padel'}
              </Badge>
            </div>
            {equipmentCatalog.length === 0 && (
              <div className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
                No equipment available for this booking.
              </div>
            )}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4">
              {equipmentCatalog.map((item) => {
                const { sessions, max, quantity, mixed } = equipmentSelection(item);
                const pending = sessions.some((session) => session.isPending);
                const failed = sessions.some((session) => session.isError);
                const image = resolveMediaUrl(item.image);
                return (
                  <Card
                    key={item.id}
                    className={cn(
                      'min-w-0 gap-0 overflow-hidden py-0 shadow-none transition-colors',
                      quantity > 0 && 'border-primary/50 bg-primary/[0.02]'
                    )}
                  >
                    <CardContent className="flex h-full flex-col gap-4 p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-xl">
                          {image ? (
                            <Image
                              src={image}
                              alt=""
                              fill
                              sizes="64px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <IconPackage
                              className="text-muted-foreground absolute inset-4 size-8"
                              stroke={1.5}
                            />
                          )}
                        </div>
                        <div className="min-w-0 space-y-2 py-0.5">
                          <h3 className="text-sm leading-snug font-semibold break-words">
                            {item.name}
                          </h3>
                          <p className="flex flex-wrap items-baseline gap-x-1 text-xl leading-tight font-semibold tracking-tight tabular-nums">
                            <span>Rp {item.price.toLocaleString('id-ID')}</span>
                            <span className="text-muted-foreground text-xs font-normal tracking-normal">
                              {bookingItems.length > 0 ? '/ sesi' : '/ item'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <span
                            aria-hidden="true"
                            className={cn(
                              'size-1.5 shrink-0 rounded-full',
                              pending || failed || max <= 0
                                ? 'bg-muted-foreground/50'
                                : max <= 3
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            )}
                          />
                          {pending
                            ? 'Memuat stok...'
                            : failed
                              ? 'Stok belum tersedia'
                              : max > 0
                                ? `${max} tersedia`
                                : 'Stok habis'}
                        </p>
                        <div
                          className="bg-background flex items-center overflow-hidden rounded-lg border"
                          role="group"
                          aria-label={`Jumlah ${item.name}`}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            className="size-9 rounded-none p-0"
                            aria-label={`Kurangi ${item.name}`}
                            disabled={quantity <= 0 || pending || failed}
                            onClick={() => updateEquipment(item, quantity - 1)}
                          >
                            <IconMinus className="size-4" />
                          </Button>
                          <Input
                            type="number"
                            aria-label={`Jumlah ${item.name}`}
                            min={0}
                            max={max}
                            value={quantity}
                            disabled={pending || failed || max <= 0}
                            onChange={(event) =>
                              updateEquipment(item, Number(event.target.value) || 0)
                            }
                            className="h-9 w-12 [appearance:textfield] rounded-none border-x border-y-0 bg-transparent px-1 text-center font-medium tabular-nums shadow-none focus-visible:relative focus-visible:z-10 focus-visible:ring-inset [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            className="size-9 rounded-none p-0"
                            aria-label={`Tambah ${item.name}`}
                            disabled={quantity >= max || pending || failed}
                            onClick={() => updateEquipment(item, quantity + 1)}
                          >
                            <IconPlus className="size-4" />
                          </Button>
                        </div>
                      </div>
                      {mixed && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-muted-foreground text-xs">
                            Previous session quantities differ. Change quantity to apply to all.
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateEquipment(item, 0)}
                          >
                            Reset quantity
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
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
          selectedInventories={selectedInventories}
          onInventoryRemove={removeInventory}
          onBookingRemove={removeBookingItem}
          showCourtBookings={bookingItems.length > 0}
          courtTotal={courtTotal}
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
          width="w-full min-w-0"
        />
      </div>
    </div>
  );
}
