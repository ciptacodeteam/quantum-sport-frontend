'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatSlotTime, formatSlotTimeRange } from '@/lib/time-utils';
import { resolveMediaUrl } from '@/lib/utils';
import { ballboyAvailabilityQueryOptions } from '@/queries/ballboy';
import { inventoryAvailabilityQueryOptions } from '@/queries/inventory';
import { useBookingStore, type BookingItem } from '@/stores/useBookingStore';
import { useQueries, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ArrowUpRight, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const getISODate = (isoString?: string | null) => (isoString ? isoString.slice(0, 10) : '');

const getInitials = (name?: string | null) =>
  (name || 'Ballboy')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'B';

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

const getBookingStartTime = (booking: BookingItem) => {
  if (booking.startAt) {
    return formatSlotTime(booking.startAt);
  }

  const [startTime] = booking.timeSlot.split(' - ');
  return normalizeTime(startTime);
};

const getBookingEndTime = (booking: BookingItem) => {
  if (booking.endAt) {
    return formatSlotTime(booking.endAt);
  }

  const [, endTimeFromRange] = booking.timeSlot.split(' - ');
  return normalizeTime(booking.endTime || endTimeFromRange);
};

const toDateTimeParam = (date: string, time: string) => `${date}T${time}:00`;

const timeToMinutes = (time: string) => {
  const normalized = normalizeTime(time);
  const [hour, minute] = normalized.split(':').map(Number);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  return hour * 60 + minute;
};

const normalizeEndMinutes = (startMinutes: number, endMinutes: number) =>
  endMinutes <= startMinutes ? endMinutes + 24 * 60 : endMinutes;

const rangesOverlap = (
  first: { start: number; end: number },
  second: { start: number; end: number }
) => first.start < second.end && first.end > second.start;

export default function AddOnsPage() {
  const router = useRouter();
  const bookingItems = useBookingStore((state) => state.bookingItems) as BookingItem[];
  const courtSport = useMemo<'PADEL' | 'TENNIS'>(
    () => bookingItems.find((item) => item.sport)?.sport ?? 'PADEL',
    [bookingItems]
  );
  // const selectedCoaches = useBookingStore((state) => state.selectedCoaches);
  // const addCoachToStore = useBookingStore((state) => state.addCoach);
  // const removeCoachFromStore = useBookingStore((state) => state.removeCoach);
  const selectedBallboys = useBookingStore((state) => state.selectedBallboys);
  const selectedInventories = useBookingStore((state) => state.selectedInventories);
  const inventoryTotal = useBookingStore((state) => state.inventoryTotal);
  const ballboyTotal = useBookingStore((state) => state.ballboyTotal);
  const addOnsSubtotal = inventoryTotal + ballboyTotal;
  const addBallboyToStore = useBookingStore((state) => state.addBallboy);
  const removeBallboyFromStore = useBookingStore((state) => state.removeBallboy);
  const addInventoryToStore = useBookingStore((state) => state.addInventory);
  const removeInventoryFromStore = useBookingStore((state) => state.removeInventory);
  const [activeTab, setActiveTab] = useState<'ballboy' | 'inventory'>(
    courtSport === 'TENNIS' ? 'ballboy' : 'inventory'
  );

  useEffect(() => {
    if (courtSport === 'TENNIS') {
      setActiveTab('ballboy');
      return;
    }

    setActiveTab('inventory');
  }, [courtSport]);
  const bookingTimeRange = useMemo(() => {
    if (bookingItems.length === 0) {
      return { startAt: undefined as string | undefined, endAt: undefined as string | undefined };
    }

    let earliestValue: string | null = null;
    let earliestIso: string | undefined;
    let latestValue: string | null = null;
    let latestIso: string | undefined;

    bookingItems.forEach((item) => {
      if (item.startAt && item.endAt) {
        if (earliestValue === null || item.startAt < earliestValue) {
          earliestValue = item.startAt;
          earliestIso = item.startAt;
        }

        if (latestValue === null || item.endAt > latestValue) {
          latestValue = item.endAt;
          latestIso = item.endAt;
        }

        return;
      }

      const startTime = getBookingStartTime(item);
      const endTime = getBookingEndTime(item);

      if (startTime) {
        const value = toDateTimeParam(item.date, startTime);
        if (earliestValue === null || value < earliestValue) {
          earliestValue = value;
          earliestIso = value;
        }
      }

      if (endTime) {
        const value = toDateTimeParam(item.date, endTime);
        if (latestValue === null || value > latestValue) {
          latestValue = value;
          latestIso = value;
        }
      }
    });

    const startAt = earliestIso;
    const endAt = latestIso;

    return {
      startAt,
      endAt
    };
  }, [bookingItems]);

  const {
    data: inventoryAvailability,
    isPending: isInventoryPending,
    isError: isInventoryError
  } = useQuery(
    inventoryAvailabilityQueryOptions({
      ...(bookingItems.length > 0 ? { courtSport } : {}),
      ...(bookingTimeRange.startAt ? { startAt: bookingTimeRange.startAt } : {}),
      ...(bookingTimeRange.endAt ? { endAt: bookingTimeRange.endAt } : {})
    })
  );
  const inventoryAvailabilityByBooking = useQueries({
    queries: bookingItems.map((booking) => {
      const startAt =
        booking.startAt ?? toDateTimeParam(booking.date, getBookingStartTime(booking));
      const endAt = booking.endAt ?? toDateTimeParam(booking.date, getBookingEndTime(booking));

      return inventoryAvailabilityQueryOptions({
        courtSport,
        startAt,
        endAt
      });
    })
  });

  // const {
  //   data: coachAvailability,
  //   isPending: isCoachPending,
  //   isError: isCoachError
  // } = useQuery(coachAvailabilityQueryOptions(bookingTimeRange.startAt, bookingTimeRange.endAt));

  const hasBookingSelection = bookingItems.length > 0;
  // const coachList = coachAvailability ?? [];

  const inventoryList = inventoryAvailability ?? [];

  const {
    data: ballboyAvailability = [],
    isPending: isBallboyPending,
    isError: isBallboyError
  } = useQuery(
    ballboyAvailabilityQueryOptions(bookingTimeRange.startAt, bookingTimeRange.endAt, courtSport)
  );

  const primaryBookingDate = useMemo(() => {
    if (bookingTimeRange.startAt) {
      return (
        getISODate(bookingTimeRange.startAt) || dayjs(bookingTimeRange.startAt).format('YYYY-MM-DD')
      );
    }

    return bookingItems[0]?.date ?? dayjs().format('YYYY-MM-DD');
  }, [bookingItems, bookingTimeRange.startAt]);

  // const handleCoachToggle = (item: any) => {
  //   if (!hasBookingSelection) {
  //     toast.error('Tambahkan booking lapangan terlebih dahulu sebelum memilih coach.');
  //     return;
  //   }

  //   if (!item?.slotId || !item?.coach?.id) {
  //     toast.error('Data coach tidak valid.');
  //     return;
  //   }

  //   const isSelected = selectedCoaches.some((coach) => coach.slotId === item.slotId);

  //   if (isSelected) {
  //     removeCoachFromStore(item.coach.id, item.startAt ?? '', item.slotId);
  //     toast.success(`${item.coach.name ?? 'Coach'} dihapus dari add-ons.`);
  //     return;
  //   }

  //   const start = item.startAt ? dayjs(item.startAt) : null;
  //   const end = item.endAt ? dayjs(item.endAt) : null;
  //   const timeSlot =
  //     start && end ? `${start.format('HH:mm')} - ${end.format('HH:mm')}` : 'Pilih jadwal coach';

  //   addCoachToStore({
  //     coachId: item.coach.id,
  //     coachName: item.coach.name ?? 'Coach',
  //     timeSlot,
  //     price: item.price ?? 0,
  //     date: start ? start.format('YYYY-MM-DD') : primaryBookingDate,
  //     slotId: item.slotId,
  //     coachTypeId: item.coachTypeId ?? null,
  //     startAt: item.startAt,
  //     endAt: item.endAt
  //   });

  //   toast.success(`${item.coach.name ?? 'Coach'} ditambahkan ke add-ons.`);
  // };

  const getBookingRangeMs = (booking: BookingItem) => {
    const startAt = booking.startAt ?? toDateTimeParam(booking.date, getBookingStartTime(booking));
    const endAt = booking.endAt ?? toDateTimeParam(booking.date, getBookingEndTime(booking));
    const start = dayjs(startAt).valueOf();
    const rawEnd = dayjs(endAt).valueOf();

    return {
      start,
      end: rawEnd <= start ? rawEnd + 24 * 60 * 60 * 1000 : rawEnd
    };
  };

  const getInventorySelectionRangeMs = (inventory: (typeof selectedInventories)[number]) => {
    if (inventory.startAt && inventory.endAt) {
      const start = dayjs(inventory.startAt).valueOf();
      const rawEnd = dayjs(inventory.endAt).valueOf();

      return {
        start,
        end: rawEnd <= start ? rawEnd + 24 * 60 * 60 * 1000 : rawEnd
      };
    }

    const booking = bookingItems.find((item) => item.slotId === inventory.courtSlotId);
    return booking ? getBookingRangeMs(booking) : null;
  };

  const getOverlappingSelectedInventoryQty = (inventoryId: string, booking?: BookingItem) => {
    if (!booking) {
      return selectedInventories
        .filter(
          (item) => item.inventoryId === inventoryId && (item.timeSlot ?? 'default') !== 'default'
        )
        .reduce((total, item) => total + item.quantity, 0);
    }
    const bookingRange = getBookingRangeMs(booking);

    return selectedInventories
      .filter(
        (inventory) =>
          inventory.inventoryId === inventoryId && inventory.courtSlotId !== booking.slotId
      )
      .reduce((total, inventory) => {
        if (!inventory.courtSlotId) return total + inventory.quantity;
        const inventoryRange = getInventorySelectionRangeMs(inventory);

        if (!inventoryRange || !rangesOverlap(bookingRange, inventoryRange)) {
          return total;
        }

        return total + inventory.quantity;
      }, 0);
  };

  const handleInventoryQtyChange = (
    inventoryId: string,
    nextQty: number,
    booking?: BookingItem,
    availableQuantityOverride?: number
  ) => {
    const selectedInventory = inventoryList.find((item) => item.id === inventoryId);
    if (!selectedInventory) {
      toast.error('Data inventori tidak valid.');
      return;
    }

    const availableQuantity = availableQuantityOverride ?? selectedInventory.availableQuantity ?? 0;
    const overlappingSelectedQty = getOverlappingSelectedInventoryQty(inventoryId, booking);
    const currentMaxQty = Math.max(0, availableQuantity - overlappingSelectedQty);
    const safeQty = Math.max(0, Math.min(nextQty, currentMaxQty));

    const unitPrice = selectedInventory.price ?? 0;

    const timeSlot = booking?.slotId ?? 'default';

    if (safeQty > 0) {
      addInventoryToStore({
        inventoryId: selectedInventory.id,
        inventoryName: selectedInventory.name,
        timeSlot,
        price: safeQty * unitPrice,
        quantity: safeQty,
        date: booking?.date ?? primaryBookingDate,
        courtId: booking?.courtId,
        courtName: booking?.courtName,
        courtSlotId: booking?.slotId,
        startAt: booking?.startAt,
        endAt: booking?.endAt
      });
      toast.success(`${selectedInventory.name} ditambahkan (${safeQty} item).`);
    } else {
      removeInventoryFromStore(selectedInventory.id, timeSlot);
      toast.success(`${selectedInventory.name} dihapus dari add-ons.`);
    }
  };

  const ballboyCoversBooking = (
    item: (typeof ballboyAvailability)[number],
    booking: BookingItem
  ) => {
    const bookingDate = getISODate(booking.startAt) || booking.date;

    if (!item.startAt || !item.endAt || getISODate(item.startAt) !== bookingDate) {
      return false;
    }

    const ballboyStart = timeToMinutes(formatSlotTime(item.startAt));
    const rawBallboyEnd = timeToMinutes(formatSlotTime(item.endAt));
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

  const getMatchingBallboySlots = (booking: BookingItem) => {
    return ballboyAvailability.filter((item) => ballboyCoversBooking(item, booking));
  };

  const ballboySlotsByBooking = useMemo(
    () =>
      bookingItems.map((booking) => ({
        booking,
        slots: getMatchingBallboySlots(booking)
      })),
    [ballboyAvailability, bookingItems]
  );

  const inventoryItemsByBooking = useMemo(
    () =>
      !hasBookingSelection
        ? [{ booking: undefined, items: inventoryList, isPending: false, isError: false }]
        : bookingItems.map((booking, index) => ({
            booking,
            items: (inventoryAvailabilityByBooking[index]?.data ??
              inventoryList) as typeof inventoryList,
            isPending: inventoryAvailabilityByBooking[index]?.isPending ?? false,
            isError: inventoryAvailabilityByBooking[index]?.isError ?? false
          })),
    [bookingItems, hasBookingSelection, inventoryAvailabilityByBooking, inventoryList]
  );

  const handleBallboyToggle = (
    item: (typeof ballboyAvailability)[number],
    booking: BookingItem
  ) => {
    if (!hasBookingSelection) {
      toast.error('Tambahkan booking lapangan tennis terlebih dahulu sebelum memilih ballboy.');
      return;
    }

    if (courtSport !== 'TENNIS') {
      toast.error('Ballboy hanya tersedia untuk tennis.');
      return;
    }

    if (!item?.slotId || !item?.ballboy?.id) {
      toast.error('Data ballboy tidak valid.');
      return;
    }

    const selectedForCourt = selectedBallboys.find(
      (ballboy) => ballboy.courtSlotId === booking.slotId
    );
    if (selectedForCourt?.slotId === item.slotId) {
      removeBallboyFromStore(item.ballboy.id, selectedForCourt.timeSlot, item.slotId);
      toast.success(`${item.ballboy.name ?? 'Ballboy'} dihapus dari add-ons.`);
      return;
    }

    const selectedBySlot = selectedBallboys.find((ballboy) => ballboy.slotId === item.slotId);
    if (selectedBySlot && selectedBySlot.courtSlotId !== booking.slotId) {
      toast.error('Ballboy ini sudah dipilih untuk lapangan lain di jam yang sama.');
      return;
    }

    if (selectedForCourt) {
      removeBallboyFromStore(
        selectedForCourt.ballboyId,
        selectedForCourt.timeSlot,
        selectedForCourt.slotId
      );
    }

    const timeSlot =
      item.startAt && item.endAt ? formatSlotTimeRange(item.startAt, item.endAt) : booking.timeSlot;

    addBallboyToStore({
      ballboyId: item.ballboy.id,
      ballboyName: item.ballboy.name ?? 'Ballboy',
      timeSlot,
      price: item.price ?? 0,
      date: getISODate(item.startAt) || booking.date,
      slotId: item.slotId,
      courtId: booking.courtId,
      courtName: booking.courtName,
      courtSlotId: booking.slotId,
      startAt: item.startAt,
      endAt: item.endAt
    });

    toast.success(`${item.ballboy.name ?? 'Ballboy'} ditambahkan ke add-ons.`);
  };

  return (
    <div className="min-h-dvh">
      <MainHeader
        onBack={() => router.back()}
        title="Produk Tambahan"
        withLogo={false}
        withBorder
      />

      <main className="addons-page mx-auto w-full max-w-7xl px-5 pt-24 pb-[calc(6rem+env(safe-area-inset-bottom))] text-[#171717] sm:px-8 lg:pb-16 xl:pt-32">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-black/15 pb-5">
          <div>
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">Add Ons</h1>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-black/50">
              Beli peralatan tambahan langsung, atau lengkapi booking lapangan Anda.
            </p>
          </div>
        </header>
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
          <div className="min-w-0">
            {hasBookingSelection && courtSport === 'TENNIS' && (
              <div
                role="group"
                aria-label="Kategori add-ons"
                className={`mb-5 grid max-w-sm gap-3 ${courtSport === 'TENNIS' ? 'grid-cols-2' : 'grid-cols-1'}`}
              >
                {(courtSport === 'TENNIS'
                  ? (['inventory', 'ballboy'] as const)
                  : (['inventory'] as const)
                ).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    aria-pressed={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex min-h-12 items-center justify-center gap-2 border border-b-2 px-5 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ad422b] ${activeTab === tab ? 'border-black/10 border-b-[#ad422b] bg-[#f8f8f6] text-[#171717]' : 'border-black/10 border-b-black/15 text-black/45 hover:bg-[#f8f8f6]'}`}
                  >
                    {tab === 'inventory' ? 'Peralatan' : 'Ballboy'}
                    {(tab === 'inventory' ? selectedInventories.length : selectedBallboys.length) >
                      0 && (
                      <span className="border border-black/10 px-1.5 py-0.5 text-[10px] text-black/50">
                        {tab === 'inventory' ? selectedInventories.length : selectedBallboys.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'ballboy' && courtSport === 'TENNIS' && (
              <div className="flex flex-col gap-4">
                {!hasBookingSelection && (
                  <Card>
                    <div className="px-4 py-3">
                      <p className="text-muted-foreground text-sm">
                        Tambahkan booking lapangan tennis terlebih dahulu untuk memilih ballboy.
                      </p>
                    </div>
                  </Card>
                )}

                {hasBookingSelection && isBallboyPending && (
                  <Card>
                    <div className="px-4 py-3">
                      <p className="text-muted-foreground text-sm">Memuat daftar ballboy...</p>
                    </div>
                  </Card>
                )}

                {hasBookingSelection && isBallboyError && (
                  <Card>
                    <div className="px-4 py-3">
                      <p className="text-destructive text-sm">Gagal memuat ketersediaan ballboy.</p>
                    </div>
                  </Card>
                )}

                {hasBookingSelection &&
                  !isBallboyPending &&
                  !isBallboyError &&
                  ballboySlotsByBooking.map(({ booking, slots: matchingSlots }) => {
                    const selectedForCourt = selectedBallboys.find(
                      (ballboy) => ballboy.courtSlotId === booking.slotId
                    );

                    return (
                      <Card
                        key={booking.slotId}
                        className={matchingSlots.length === 0 ? 'bg-muted/40' : undefined}
                      >
                        <div className="space-y-4 p-4 sm:p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold">{booking.courtName}</p>
                              <p className="text-muted-foreground text-sm">
                                {dayjs(booking.date).format('DD MMM YYYY')} • {booking.timeSlot} -{' '}
                                {booking.endTime}
                              </p>
                            </div>
                            {selectedForCourt && <Badge>Dipilih</Badge>}
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            {matchingSlots.length === 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                className="h-auto min-h-20 justify-between gap-3 rounded-none bg-black/5 px-3 py-3 text-sm whitespace-normal text-black/35"
                                disabled
                              >
                                <span className="flex min-w-0 items-center gap-3 text-left">
                                  <Avatar className="h-10 w-10 shrink-0 border bg-white/80">
                                    <AvatarFallback className="text-xs font-semibold">
                                      B
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="min-w-0">
                                    <span className="block truncate">Ballboy tidak tersedia</span>
                                    <span className="text-xs opacity-75">Jadwal ini penuh</span>
                                  </span>
                                </span>
                              </Button>
                            )}

                            {matchingSlots.map((item) => {
                              const isSelected = selectedForCourt?.slotId === item.slotId;
                              const isUsedElsewhere = selectedBallboys.some(
                                (ballboy) =>
                                  ballboy.slotId === item.slotId &&
                                  ballboy.courtSlotId !== booking.slotId
                              );
                              const ballboyName = item.ballboy?.name ?? 'Ballboy';
                              const ballboyImage = resolveMediaUrl(item.ballboy?.image);

                              return (
                                <Button
                                  key={item.slotId}
                                  type="button"
                                  variant={isSelected ? 'default' : 'outline'}
                                  aria-pressed={isSelected}
                                  className="h-auto min-h-20 justify-between gap-3 rounded-none px-3 py-3 text-sm font-medium whitespace-normal shadow-none"
                                  disabled={isUsedElsewhere}
                                  onClick={() => handleBallboyToggle(item, booking)}
                                >
                                  <span className="flex min-w-0 items-center gap-3 text-left">
                                    <Avatar className="h-10 w-10 shrink-0 border bg-white/80">
                                      <AvatarImage
                                        src={ballboyImage ?? undefined}
                                        alt={ballboyName}
                                      />
                                      <AvatarFallback className="text-xs font-semibold">
                                        {getInitials(ballboyName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="min-w-0">
                                      <span className="block truncate">{ballboyName}</span>
                                      <span className="text-xs opacity-75">
                                        Rp{Number(item.price ?? 0).toLocaleString('id-ID')}
                                      </span>
                                    </span>
                                  </span>
                                  {isUsedElsewhere && (
                                    <span className="text-[11px] opacity-70">Terpakai</span>
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            )}

            {/* === COACH LIST === */}
            {/* {activeTab === 'coach' && (
          <div className="mb-4 flex flex-col gap-3">
            {!hasBookingSelection && (
              <Card>
                <div className="px-4 py-3">
                  <p className="text-muted-foreground text-sm">
                    Tambahkan pemesanan lapangan terlebih dahulu untuk melihat ketersediaan coach.
                  </p>
                </div>
              </Card>
            )}

            {hasBookingSelection && isCoachPending && (
              <Card>
                <div className="px-4 py-3">
                  <p className="text-muted-foreground text-sm">Memuat daftar coach...</p>
                </div>
              </Card>
            )}

            {hasBookingSelection && isCoachError && (
              <Card>
                <div className="px-4 py-3">
                  <p className="text-destructive text-sm">Gagal memuat ketersediaan coach.</p>
                </div>
              </Card>
            )}

            {hasBookingSelection && !isCoachPending && !isCoachError && coachList.length === 0 && (
              <Card>
                <div className="px-4 py-3">
                  <p className="text-muted-foreground text-sm">Coach tidak tersedia.</p>
                </div>
              </Card>
            )}

            {hasBookingSelection &&
              coachList.map((item) => {
                const coachPrice =
                  typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : 0;
                const coachName = item.coach?.name ?? 'Coach';
                const coachImage =
                  item.coach?.image && item.coach.image.trim() !== ''
                    ? item.coach.image
                    : '/assets/img/avatar.webp';
                const scheduleRange = item.startAt
                  ? `${dayjs(item.startAt).format('DD MMM YYYY HH:mm')} - ${dayjs(item.endAt).format('HH:mm')}`
                  : '';
                const isSelected = selectedCoaches.some((coach) => coach.slotId === item.slotId);

                return (
                  <Card
                    key={item.slotId}
                    onClick={() => handleCoachToggle(item)}
                    className={cn(
                      'hover:border-[#ad422b] cursor-pointer transition',
                      isSelected && 'border-[#ad422b] bg-[#ad422b]/5'
                    )}
                  >
                    <div className="space-y-4 p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="shrink-0 overflow-hidden rounded-full bg-gray-200">
                            <Image
                              src={coachImage}
                              alt={coachName}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <p className="font-semibold">{coachName}</p>
                            <p className="text-muted-foreground text-xs">
                              {scheduleRange || 'Pilih jadwal coach'}
                            </p>
                          </div>
                        </div>
                        {isSelected ? (
                          <Badge
                            variant="secondary"
                            className="bg-[#ad422b]/10 text-[#ad422b] flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" />
                            Dipilih
                          </Badge>
                        ) : (
                          <ChevronRight className="text-[#ad422b]" />
                        )}
                      </div>

                      <div className="bg-muted flex items-center justify-between rounded-none px-4 py-2">
                        <p className="text-foreground">
                          <span className="text-[#ad422b] font-semibold">
                            Rp{coachPrice.toLocaleString('id-ID')}{' '}
                          </span>
                          <span className="text-muted-foreground text-sm">/sesi</span>
                        </p>
                        <Button
                          size="sm"
                          variant={isSelected ? 'outline' : 'secondary'}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCoachToggle(item);
                          }}
                        >
                          {isSelected ? 'Batalkan' : 'Tambah'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        )} */}

            {/* === INVENTORY === */}
            {activeTab === 'inventory' && (
              <div className="flex flex-col gap-4">
                {isInventoryPending && (
                  <Card>
                    <div className="px-4 py-3">
                      <p className="text-muted-foreground text-sm">Memuat ketersediaan...</p>
                    </div>
                  </Card>
                )}

                {isInventoryError && (
                  <Card>
                    <div className="px-4 py-3">
                      <p className="text-destructive text-sm">
                        Gagal memuat ketersediaan inventori.
                      </p>
                    </div>
                  </Card>
                )}

                {!isInventoryPending && !isInventoryError && inventoryList.length === 0 && (
                  <Card>
                    <div className="px-4 py-3">
                      <p className="text-muted-foreground text-sm">
                        {courtSport === 'TENNIS' && hasBookingSelection
                          ? 'Peralatan di jam tersebut tidak tersedia.'
                          : 'Inventori tidak tersedia.'}
                      </p>
                    </div>
                  </Card>
                )}

                {!isInventoryPending &&
                  !isInventoryError &&
                  inventoryItemsByBooking.map(({ booking, items, isPending, isError }) => (
                    <div key={booking?.slotId ?? 'standalone'}>
                      <div className="space-y-4">
                        {booking && (
                          <div className="bg-muted/40 rounded-none px-3 py-2">
                            <p className="truncate text-sm font-semibold sm:text-base">
                              {booking.courtName}
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
                              {dayjs(booking.date).format('DD MMM YYYY')} • {booking.timeSlot} -{' '}
                              {booking.endTime}
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          {isPending && (
                            <p className="text-muted-foreground text-sm">Memuat stok sesi ini...</p>
                          )}
                          {isError && (
                            <p className="text-destructive text-sm">Gagal memuat stok sesi ini.</p>
                          )}
                          {items.map((inventory) => {
                            const selectedQty =
                              selectedInventories.find(
                                (item) =>
                                  item.inventoryId === inventory.id &&
                                  (item.timeSlot ?? 'default') === (booking?.slotId ?? 'default')
                              )?.quantity ?? 0;
                            const availableQuantity = inventory.availableQuantity ?? 0;
                            const overlappingSelectedQty = getOverlappingSelectedInventoryQty(
                              inventory.id,
                              booking
                            );
                            const maxSelectableQty = Math.max(
                              0,
                              availableQuantity - overlappingSelectedQty
                            );
                            const unitPrice = inventory.price ?? 0;
                            const inventoryImage = resolveMediaUrl(inventory.image);
                            const isUnavailable = availableQuantity <= 0;
                            const isLocallyUnavailable = maxSelectableQty <= 0 && selectedQty <= 0;
                            const isDisabled = isUnavailable || isLocallyUnavailable;

                            return (
                              <div
                                key={`${booking?.slotId ?? 'standalone'}-${inventory.id}`}
                                className={`flex min-w-0 flex-col border border-black/15 p-2.5 transition-colors sm:p-4 ${
                                  isDisabled
                                    ? 'text-muted-foreground border-gray-200 bg-gray-100'
                                    : selectedQty > 0
                                      ? 'border-[#ad422b]/40 bg-[#ad422b]/5'
                                      : 'bg-white'
                                }`}
                              >
                                <div className="flex h-full flex-col gap-3">
                                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                                    <div className="relative aspect-square w-full overflow-hidden bg-[#f3f3f1]">
                                      {inventoryImage ? (
                                        <Image
                                          src={inventoryImage}
                                          alt={inventory.name}
                                          fill
                                          sizes="(max-width: 1024px) 50vw, 25vw"
                                          className={`object-contain p-2 ${isDisabled ? 'grayscale' : ''}`}
                                          unoptimized
                                        />
                                      ) : (
                                        <div className="text-muted-foreground flex h-full w-full items-center justify-center text-2xl font-medium text-black/30 sm:text-3xl">
                                          {getInitials(inventory.name)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm leading-snug font-medium break-words sm:text-base">
                                        {inventory.name}
                                      </p>
                                      <div className="mt-2 flex flex-wrap items-baseline gap-x-1">
                                        <span className="text-sm font-semibold text-[#ad422b]">
                                          Rp{unitPrice.toLocaleString('id-ID')}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                          {booking ? '/sesi' : '/item'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-auto flex h-11 w-full shrink-0 items-center justify-between border border-black/15 bg-white">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="size-9 shrink-0 rounded-none border-0 bg-transparent text-[#171717] shadow-none hover:bg-black/5"
                                      aria-label={`Kurangi ${inventory.name} ${booking ? `untuk ${booking.courtName} pukul ${booking.timeSlot}` : ''}`}
                                      onClick={() =>
                                        handleInventoryQtyChange(
                                          inventory.id,
                                          selectedQty - 1,
                                          booking,
                                          availableQuantity
                                        )
                                      }
                                      disabled={selectedQty <= 0 || isDisabled}
                                    >
                                      <Minus size={16} />
                                    </Button>
                                    <span className="min-w-6 text-center text-sm font-medium tabular-nums">
                                      {selectedQty}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="size-9 shrink-0 rounded-none border-0 bg-transparent text-[#171717] shadow-none hover:bg-black/5"
                                      aria-label={`Tambah ${inventory.name} ${booking ? `untuk ${booking.courtName} pukul ${booking.timeSlot}` : ''}`}
                                      onClick={() =>
                                        handleInventoryQtyChange(
                                          inventory.id,
                                          selectedQty + 1,
                                          booking,
                                          availableQuantity
                                        )
                                      }
                                      disabled={selectedQty >= maxSelectableQty || isDisabled}
                                    >
                                      <Plus size={16} />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <aside
            aria-label="Ringkasan add-ons"
            className="hidden min-w-0 border border-black/15 bg-[#f8f8f6] p-6 lg:sticky lg:top-28 lg:block"
          >
            <h2 className="text-xl font-medium tracking-tight">Pilihan Anda</h2>
            <p className="mt-2 text-xs text-black/50">
              {hasBookingSelection
                ? `${bookingItems.length} slot lapangan dipilih`
                : 'Pembelian tanpa booking lapangan'}
            </p>
            <div className="my-5 border-y border-black/15 py-4">
              {selectedInventories.length === 0 && selectedBallboys.length === 0 ? (
                <p className="text-xs leading-relaxed text-black/45">
                  Belum ada add-ons yang dipilih.
                </p>
              ) : (
                <ul className="max-h-72 space-y-3 overflow-y-auto">
                  {selectedInventories.map((item, index) => (
                    <li key={`inventory-${index}`} className="flex justify-between gap-3 text-xs">
                      <span className="min-w-0 break-words">
                        {item.inventoryName} <span className="text-black/45">×{item.quantity}</span>
                      </span>
                      <span className="shrink-0">Rp{item.price.toLocaleString('id-ID')}</span>
                    </li>
                  ))}
                  {selectedBallboys.map((item, index) => (
                    <li key={`ballboy-${index}`} className="flex justify-between gap-3 text-xs">
                      <span className="min-w-0 break-words">{item.ballboyName}</span>
                      <span className="shrink-0">Rp{item.price.toLocaleString('id-ID')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mb-5 flex items-end justify-between gap-3">
              <span className="text-xs text-black/50">Subtotal add-ons</span>
              <p className="text-xl font-medium tracking-tight">
                Rp{addOnsSubtotal.toLocaleString('id-ID')}
              </p>
            </div>
            <Button
              className="h-12 w-full rounded-full bg-[#111111] text-xs text-white hover:bg-black/80"
              disabled={bookingItems.length === 0 && selectedInventories.length === 0}
              onClick={() => router.push('/checkout')}
            >
              Lanjut ke checkout{' '}
              <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </Button>
          </aside>
        </div>
      </main>
      <div
        role="region"
        aria-label="Ringkasan add-ons"
        className="fixed inset-x-0 bottom-0 z-40 h-[calc(5rem+env(safe-area-inset-bottom))] border-t border-black/15 bg-[#f8f8f6] px-5 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-black/50">Subtotal add-ons</p>
            <p className="mt-1 text-xl font-medium tracking-tight">
              Rp{addOnsSubtotal.toLocaleString('id-ID')}
            </p>
          </div>
          <Button
            className="h-12 shrink-0 rounded-full bg-[#111111] px-5 text-xs text-white hover:bg-black/80"
            disabled={bookingItems.length === 0 && selectedInventories.length === 0}
            onClick={() => router.push('/checkout')}
          >
            Lanjutkan <ArrowUpRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Seleksi coach & inventori langsung melalui kartu */}
    </div>
  );
}
