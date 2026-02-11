'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  adminCustomerSearchQueryOptions,
  type CustomerSearchResult
} from '@/queries/admin/customer';
import { useMembershipDiscount } from '@/hooks/useMembershipDiscount';
import { cn } from '@/lib/utils';
import type { BookingItem, SelectedCoach, SelectedInventory } from '@/stores/useBookingStore';
import { IconX } from '@tabler/icons-react';

/**
 * Props for the BookingSummary component
 */
export interface BookingSummaryProps {
  /** Array of booking items (court bookings) */
  bookingItems: BookingItem[];

  /** Customer selection - ID of selected customer */
  selectedCustomerId: string | null;
  /** Customer name (for display when customer is selected but data not loaded yet) */
  selectedCustomerName?: string | null;
  /** Customer phone (for display when customer is selected but data not loaded yet) */
  selectedCustomerPhone?: string | null;
  /** Walk-in customer name */
  walkInName?: string | null;
  /** Walk-in customer phone */
  walkInPhone?: string | null;
  /** Callback when a customer is selected from search */
  onCustomerSelect: (customerId: string, customer: CustomerSearchResult) => void;
  /** Callback to clear selected customer */
  onCustomerClear: () => void;
  /** Callback to set walk-in customer details */
  onWalkInSet: (name: string, phone: string) => void;
  /** Callback to clear walk-in customer */
  onWalkInClear: () => void;

  /** Selected coaches (optional - for add-ons page) */
  selectedCoaches?: SelectedCoach[];
  /** Selected inventory items (optional - for add-ons page) */
  selectedInventories?: SelectedInventory[];
  /** Callback to remove a coach (optional - for add-ons page) */
  onCoachRemove?: (coachId: string, timeSlot: string, slotId?: string) => void;
  /** Callback to remove an inventory item (optional - for add-ons page) */
  onInventoryRemove?: (inventoryId: string, timeSlot?: string) => void;

  /** Total price for court bookings */
  courtTotal: number;
  /** Total price for coaches (optional - for add-ons page) */
  coachTotal?: number;
  /** Total price for inventory (optional - for add-ons page) */
  inventoryTotal?: number;
  /** Membership discount amount (deprecated - use membershipDiscountDetails instead) */
  membershipDiscount?: number;
  /** Grand total amount */
  totalAmount: number;

  /** Membership discount details (optional - will be calculated if not provided) */
  membershipDiscountDetails?: {
    canUseMembership: boolean;
    slotsToDeduct: number;
    discountAmount: number;
    originalTotal?: number;
    discountedTotal?: number;
    activeMembership: {
      id: string;
      startDate: string;
      endDate: string;
      remainingSessions: number;
      remainingDuration: number;
      isExpired: boolean;
      isSuspended: boolean;
      membership: {
        id: string;
        name: string;
        price: number;
      };
    } | null;
  } | null;

  /** Primary action button configuration */
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  /** Secondary action buttons configuration */
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'link' | 'secondary';
    icon?: React.ReactNode;
  }>;

  /** Display options */
  /** Show customer selection UI (default: true) */
  showCustomerSelection?: boolean;
  /** Show membership information (default: true) */
  showMembershipInfo?: boolean;
  /** Show add-ons section (coaches, inventory) (default: true) */
  showAddOns?: boolean;
  /** Show court bookings list (default: true) */
  showCourtBookings?: boolean;
  /** Callback to remove a court booking (optional - for booking-lapangan page) */
  onBookingRemove?: (courtId: string, timeSlot: string, date: string) => void;

  /** Additional CSS classes */
  className?: string;
  /** Make the summary sticky on desktop (default: true) */
  sticky?: boolean;
  /** Width classes (default: 'w-full xl:w-[400px] xl:shrink-0') */
  width?: string;
}

/**
 * BookingSummary - A reusable component for displaying booking summary with customer selection,
 * membership info, court bookings, add-ons, and totals.
 *
 * @example
 * ```tsx
 * <BookingSummary
 *   bookingItems={bookings}
 *   selectedCustomerId={customerId}
 *   onCustomerSelect={(id, customer) => setCustomerId(id)}
 *   onCustomerClear={() => setCustomerId(null)}
 *   onWalkInSet={(name, phone) => setWalkIn({ name, phone })}
 *   onWalkInClear={() => setWalkIn({ name: null, phone: null })}
 *   courtTotal={total}
 *   totalAmount={grandTotal}
 *   primaryAction={{
 *     label: 'Proceed to Add-Ons',
 *     onClick: handleProceed
 *   }}
 * />
 * ```
 */

const formatCurrency = (value: number) => {
  return `Rp ${value.toLocaleString('id-ID')}`;
};

// Calculate bundled discount for court + coach at the same time slot
const calculateBundleDiscount = (courts: BookingItem[], coaches: SelectedCoach[]): number => {
  if (courts.length === 0 || coaches.length === 0) return 0;

  // Build a set of keys (date|timeSlot) that have at least one coach
  const coachKeys = new Set<string>();
  coaches.forEach((coach) => {
    if (!coach.date || !coach.timeSlot) return;
    coachKeys.add(`${coach.date}|${coach.timeSlot}`);
  });

  let totalDiscount = 0;

  courts.forEach((booking) => {
    const key = `${booking.date}|${booking.timeSlot}`;

    // Only apply discount when there is at least one coach on the same date & timeslot
    if (!coachKeys.has(key)) return;

    // Extract hour from "HH:mm - HH:mm" format
    const startPart = booking.timeSlot.split('-')[0]?.trim() ?? '';
    const hourStr = startPart.split(':')[0] ?? '';
    const hour = Number.parseInt(hourStr, 10);

    if (Number.isNaN(hour)) return;

    // Happy hour: 06–14, Peak hour: 15–23
    let slotDiscount = 0;
    if (hour >= 6 && hour <= 14) {
      slotDiscount = 100_000;
    } else if (hour >= 15 && hour <= 23) {
      slotDiscount = 70_000;
    }

    if (slotDiscount <= 0) return;

    // Never discount more than the court price itself
    totalDiscount += Math.min(slotDiscount, booking.price);
  });

  return totalDiscount;
};

export default function BookingSummary({
  bookingItems,
  selectedCustomerId,
  selectedCustomerName,
  selectedCustomerPhone,
  walkInName,
  walkInPhone,
  onCustomerSelect,
  onCustomerClear,
  onWalkInSet,
  onWalkInClear,
  selectedCoaches = [],
  selectedInventories = [],
  onCoachRemove,
  onInventoryRemove,
  courtTotal,
  coachTotal = 0,
  inventoryTotal = 0,
  membershipDiscount: _membershipDiscountAmount = 0,
  totalAmount,
  membershipDiscountDetails,
  primaryAction,
  secondaryActions = [],
  showCustomerSelection = true,
  showMembershipInfo = true,
  showAddOns = true,
  showCourtBookings = true,
  onBookingRemove,
  className,
  sticky = true,
  width = 'w-full xl:w-[400px] xl:shrink-0'
}: BookingSummaryProps) {
  // Customer selection states
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInNameLocal, setWalkInNameLocal] = useState(walkInName || '');
  const [walkInPhoneLocal, setWalkInPhoneLocal] = useState(walkInPhone || '');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(customerSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Update local walk-in state when props change
  useEffect(() => {
    setWalkInNameLocal(walkInName || '');
    setWalkInPhoneLocal(walkInPhone || '');
  }, [walkInName, walkInPhone]);

  // Reset selectedCustomer when selectedCustomerId becomes null (e.g., after booking is cleared)
  useEffect(() => {
    if (!selectedCustomerId) {
      setSelectedCustomer(null);
      setCustomerSearch('');
      setDebouncedSearch('');
    }
  }, [selectedCustomerId]);

  // Use search endpoint for customers
  const { data: searchResults, isLoading: isSearching } = useQuery(
    adminCustomerSearchQueryOptions({
      q: debouncedSearch,
      limit: '20'
    })
  );

  // Group bookings by date
  const bookingsByDate = bookingItems.reduce(
    (groups, item) => {
      const date = item.date;
      if (!groups[date]) {
        groups[date] = {
          date,
          dayName: dayjs(date).format('dddd'),
          formattedDate: dayjs(date).format('DD MMM YYYY'),
          shortDate: dayjs(date).format('ddd, DD MMM'),
          items: []
        };
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
        items: BookingItem[];
      }
    >
  );

  // Calculate membership discount (always call hook, but use provided data if available)
  const calculatedMembershipDiscount = useMembershipDiscount(
    selectedCustomerId || null,
    bookingItems,
    selectedCustomer ? { activeMembership: selectedCustomer.activeMembership } : null
  );

  // Use provided membership discount details if available, otherwise use calculated
  const membershipDiscount = membershipDiscountDetails || calculatedMembershipDiscount;

  const getPricing = (booking: BookingItem) => {
    const normalPrice = booking.normalPrice ?? booking.price;
    const discountPrice = booking.discountPrice ?? 0;
    const effectivePrice = discountPrice > 0 ? discountPrice : booking.price;
    const displayPrice = membershipDiscount.canUseMembership ? normalPrice : effectivePrice;
    return { normalPrice, discountPrice, effectivePrice, displayPrice };
  };

  // Bundled discount is only relevant when add-ons (coaches) are shown
  const bundleDiscount =
    showAddOns && selectedCoaches.length > 0
      ? calculateBundleDiscount(bookingItems, selectedCoaches)
      : 0;

  const courtSubtotal = membershipDiscount.originalTotal ?? courtTotal;
  const finalTotal = Math.max(0, totalAmount - bundleDiscount);

  const handleCustomerSelect = (customer: CustomerSearchResult) => {
    setSelectedCustomer(customer);
    onCustomerSelect(customer.id, customer);
    setIsCustomerOpen(false);
    setCustomerSearch('');
    setDebouncedSearch('');
  };

  const handleWalkInSave = () => {
    if (!walkInNameLocal.trim() || !walkInPhoneLocal.trim()) {
      toast.error('Nama dan nomor telepon wajib diisi.');
      return;
    }
    onWalkInSet(walkInNameLocal.trim(), walkInPhoneLocal.trim());
    toast.success('Walk-in customer disimpan');
    setIsWalkInOpen(false);
  };

  return (
    <div className={cn(width, className)}>
      <Card className={cn(sticky && 'xl:sticky xl:top-6')}>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Selection */}
          {showCustomerSelection && (
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
                        {selectedCustomer || (selectedCustomerName && selectedCustomerPhone)
                          ? `${selectedCustomer?.name || selectedCustomerName}${selectedCustomer?.phone || selectedCustomerPhone ? ` (${selectedCustomer?.phone || selectedCustomerPhone})` : ''}`
                          : 'Pilih pelanggan...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Cari pelanggan (min 2 karakter)..."
                          value={customerSearch}
                          onValueChange={setCustomerSearch}
                        />
                        <CommandList>
                          {isSearching ? (
                            <div className="text-muted-foreground py-6 text-center text-sm">
                              Mencari...
                            </div>
                          ) : debouncedSearch.length < 2 ? (
                            <div className="text-muted-foreground py-6 text-center text-sm">
                              Ketik minimal 2 karakter untuk mencari
                            </div>
                          ) : !searchResults || searchResults.length === 0 ? (
                            <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                          ) : (
                            <CommandGroup>
                              {searchResults.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={`${customer.name} ${customer.phone || ''}`}
                                  onSelect={() => handleCustomerSelect(customer)}
                                >
                                  <span className="truncate">
                                    {customer.name} {customer.phone && `(${customer.phone})`}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
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
                          value={walkInNameLocal}
                          onChange={(e) => setWalkInNameLocal(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="walkInPhone">Nomor Telepon</Label>
                        <Input
                          id="walkInPhone"
                          placeholder="08xxxxxxxxxx"
                          value={walkInPhoneLocal}
                          onChange={(e) => setWalkInPhoneLocal(e.target.value)}
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
                          disabled={!walkInNameLocal.trim() || !walkInPhoneLocal.trim()}
                          onClick={handleWalkInSave}
                        >
                          Simpan
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Show current walk-in selection if available */}
              {(walkInName || walkInPhone) && !selectedCustomerId && (
                <div className="bg-muted mt-2 rounded-md border px-3 py-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Walk-in:</span> <span>{walkInName || '-'}</span>
                      {walkInPhone && (
                        <span className="text-muted-foreground ml-1">({walkInPhone})</span>
                      )}
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={onWalkInClear}>
                      Hapus
                    </Button>
                  </div>
                </div>
              )}

              {/* Show customer details if available */}
              {selectedCustomerId && (selectedCustomer || selectedCustomerName) && (
                <div className="bg-muted mt-2 rounded-md border px-3 py-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-1">
                        <span className="text-muted-foreground font-medium">Pelanggan:</span>
                      </div>
                      <div>
                        <span className="font-semibold">
                          {selectedCustomer?.name || selectedCustomerName || '-'}
                        </span>
                        {(selectedCustomer?.phone || selectedCustomerPhone) && (
                          <span className="text-muted-foreground ml-1">
                            ({selectedCustomer?.phone || selectedCustomerPhone})
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(null);
                        onCustomerClear();
                      }}
                      className="ml-2 h-6 px-2 text-xs"
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Show membership information if available */}
          {showMembershipInfo && selectedCustomerId && membershipDiscount.activeMembership && (
            <div className="bg-primary/5 border-primary/20 mt-2 rounded-lg border p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-primary text-xs font-medium">Membership Aktif</span>
                <Badge
                  variant={
                    membershipDiscount.activeMembership.isExpired ||
                    membershipDiscount.activeMembership.isSuspended
                      ? 'destructive'
                      : 'default'
                  }
                  className="text-[10px]"
                >
                  {membershipDiscount.activeMembership.isExpired
                    ? 'Expired'
                    : membershipDiscount.activeMembership.isSuspended
                      ? 'Suspended'
                      : 'Active'}
                </Badge>
              </div>
              <div className="space-y-1 text-[11px]">
                <div>
                  <span className="text-muted-foreground">Paket:</span>{' '}
                  <span className="font-medium">
                    {membershipDiscount.activeMembership.membership.name}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sisa Sesi:</span>{' '}
                  <span className="font-medium">
                    {membershipDiscount.activeMembership.remainingSessions} sesi
                  </span>
                </div>
                {membershipDiscount.canUseMembership && bookingItems.length > 0 && (
                  <div className="text-primary mt-1 font-medium">
                    {membershipDiscount.slotsToDeduct} slot akan gratis menggunakan membership
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Court Bookings */}
          {showCourtBookings && (
            <div className="space-y-2">
              <h4 className="text-muted-foreground text-sm font-medium">Court Bookings</h4>
              {bookingItems.length === 0 ? (
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-xs">Belum ada lapangan yang dipilih</p>
                </div>
              ) : (
                Object.entries(bookingsByDate).map(([date, dateInfo]) => (
                  <div key={date} className="space-y-1">
                    <div className="text-muted-foreground text-xs font-medium">
                      {dateInfo.shortDate}
                    </div>
                    {dateInfo.items.map((booking, index) => {
                      // Check if this booking is free due to membership
                      const sortedBookings = [...bookingItems].sort((a, b) => {
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

                      const { normalPrice, discountPrice, displayPrice } = getPricing(booking);

                      return (
                        <div
                          key={`${date}-${index}`}
                          className={cn(
                            'ml-2 flex items-center justify-between gap-2 rounded p-2 text-xs',
                            isFree ? 'border-l-4 border-l-green-500 bg-green-50' : 'bg-muted'
                          )}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="truncate font-medium">{booking.courtName}</p>
                              {isFree && (
                                <Badge
                                  variant="outline"
                                  className="border-green-500 bg-green-50 text-[10px] text-green-700"
                                >
                                  Gratis
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground">{booking.timeSlot}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className={cn(
                                'font-semibold',
                                isFree ? 'text-green-600 line-through' : 'text-primary'
                              )}
                            >
                              {isFree ? (
                                <>
                                  <span className="text-muted-foreground">
                                    {formatCurrency(normalPrice)}
                                  </span>{' '}
                                  <span className="ml-1">Gratis</span>
                                </>
                              ) : discountPrice > 0 && discountPrice < normalPrice ? (
                                <span className="flex flex-col items-end">
                                  <span className="text-muted-foreground text-[10px] line-through">
                                    {formatCurrency(normalPrice)}
                                  </span>
                                  <span>{formatCurrency(displayPrice)}</span>
                                </span>
                              ) : (
                                formatCurrency(displayPrice)
                              )}
                            </span>
                            {onBookingRemove && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                                onClick={() =>
                                  onBookingRemove(booking.courtId, booking.timeSlot, booking.date)
                                }
                              >
                                <IconX className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Selected Coaches */}
          {showAddOns && onCoachRemove && (
            <div className="space-y-2">
              <h4 className="text-muted-foreground text-sm font-medium">Selected Coaches</h4>
              {selectedCoaches.length === 0 ? (
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-xs">Belum ada coach yang dipilih</p>
                </div>
              ) : (
                selectedCoaches.map((coach, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 rounded bg-blue-50 p-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{coach.coachName}</p>
                      <p className="text-muted-foreground">
                        {dayjs(coach.date).format('DD MMM')} • {coach.timeSlot}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-primary font-semibold">
                        {formatCurrency(coach.price)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                        onClick={() => onCoachRemove(coach.coachId, coach.timeSlot, coach.slotId)}
                      >
                        <IconX className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Selected Equipment */}
          {showAddOns && onInventoryRemove && (
            <div className="space-y-2">
              <h4 className="text-muted-foreground text-sm font-medium">Selected Equipment</h4>
              {selectedInventories.length === 0 ? (
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-xs">Belum ada equipment yang dipilih</p>
                </div>
              ) : (
                selectedInventories.map((inventory, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 rounded bg-green-50 p-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{inventory.inventoryName}</p>
                      <p className="text-muted-foreground">
                        {dayjs(inventory.date).format('DD MMM')} • {inventory.timeSlot} • Qty:{' '}
                        {inventory.quantity}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-primary font-semibold">
                        {formatCurrency(inventory.price)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                        onClick={() => onInventoryRemove(inventory.inventoryId, inventory.timeSlot)}
                      >
                        <IconX className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            {showCourtBookings && (
              <div className="flex items-center justify-between text-sm">
                <span>Courts</span>
                <span>{formatCurrency(courtSubtotal)}</span>
              </div>
            )}
            {membershipDiscount.canUseMembership && membershipDiscount.slotsToDeduct > 0 && (
              <div className="flex items-center justify-between text-xs text-green-600">
                <span>
                  Membership Discount ({membershipDiscount.slotsToDeduct} slot
                  {membershipDiscount.slotsToDeduct > 1 ? 's' : ''})
                </span>
                <span className="font-medium">
                  - {formatCurrency(membershipDiscount.discountAmount)}
                </span>
              </div>
            )}
            {showAddOns && (
              <>
                {coachTotal > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Coaches</span>
                    <span>{formatCurrency(coachTotal)}</span>
                  </div>
                )}
                {inventoryTotal > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Equipment</span>
                    <span>{formatCurrency(inventoryTotal)}</span>
                  </div>
                )}
              </>
            )}
            {bundleDiscount > 0 && (
              <div className="flex items-center justify-between text-xs text-blue-600">
                <span>Bundled Court + Coach Discount</span>
                <span className="font-medium">- {formatCurrency(bundleDiscount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          {(primaryAction || secondaryActions.length > 0) && (
            <div className="space-y-2 pt-4">
              {primaryAction && (
                <Button
                  className="w-full"
                  size="default"
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled || primaryAction.loading}
                >
                  {primaryAction.loading ? 'Processing...' : primaryAction.label}
                </Button>
              )}
              {secondaryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  className="w-full"
                  size="sm"
                  onClick={action.onClick}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
