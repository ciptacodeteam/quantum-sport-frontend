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
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Minus, Plus } from 'lucide-react';
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
      courtSport,
      ...(bookingTimeRange.startAt ? { startAt: bookingTimeRange.startAt } : {}),
      ...(bookingTimeRange.endAt ? { endAt: bookingTimeRange.endAt } : {})
    })
  );

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

  const handleInventoryQtyChange = (inventoryId: string, nextQty: number) => {
    if (!hasBookingSelection) {
      toast.error('Tambahkan booking lapangan terlebih dahulu sebelum memilih peralatan.');
      return;
    }

    const selectedInventory = inventoryList.find((item) => item.id === inventoryId);
    if (!selectedInventory) {
      toast.error('Data inventori tidak valid.');
      return;
    }

    const availableQuantity = selectedInventory.availableQuantity ?? 0;
    const safeQty = Math.max(0, Math.min(nextQty, availableQuantity));

    const unitPrice = selectedInventory.price ?? 0;

    if (safeQty > 0) {
      addInventoryToStore({
        inventoryId: selectedInventory.id,
        inventoryName: selectedInventory.name,
        timeSlot: 'default',
        price: safeQty * unitPrice,
        quantity: safeQty,
        date: primaryBookingDate
      });
      toast.success(`${selectedInventory.name} ditambahkan (${safeQty} item).`);
    } else {
      removeInventoryFromStore(selectedInventory.id, 'default');
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
      bookingItems
        .map((booking) => ({
          booking,
          slots: getMatchingBallboySlots(booking)
        }))
        .filter(({ slots }) => slots.length > 0),
    [ballboyAvailability, bookingItems]
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
    <div className="bg-background min-h-screen pb-32">
      <MainHeader onBack={() => router.back()} title="Produk Tambahan" withLogo={false} />

      <main className="mx-auto w-11/12 pt-24 pb-8">
        <div className="bg-background/95 sticky top-20 z-30 mb-4 flex gap-2 border-b py-3 backdrop-blur">
          {courtSport === 'TENNIS' && (
            <Button
              variant={activeTab === 'ballboy' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setActiveTab('ballboy')}
            >
              Ballboy
              {selectedBallboys.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedBallboys.length}
                </Badge>
              )}
            </Button>
          )}
          <Button
            variant={activeTab === 'inventory' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setActiveTab('inventory')}
          >
            Peralatan
            {selectedInventories.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedInventories.length}
              </Badge>
            )}
          </Button>
        </div>

        {activeTab === 'ballboy' && courtSport === 'TENNIS' && (
          <div className="flex flex-col gap-3 pb-24">
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
              ballboySlotsByBooking.length === 0 && (
                <Card>
                  <div className="px-4 py-3">
                    <p className="text-muted-foreground text-sm">
                      Ballboy tidak tersedia untuk jadwal booking yang dipilih.
                    </p>
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
                  <Card key={booking.slotId}>
                    <div className="space-y-3 px-4 py-3">
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
                              className="h-auto justify-between gap-3 px-3 py-2"
                              disabled={isUsedElsewhere}
                              onClick={() => handleBallboyToggle(item, booking)}
                            >
                              <span className="flex min-w-0 items-center gap-3 text-left">
                                <Avatar className="h-10 w-10 shrink-0 border bg-white/80">
                                  <AvatarImage src={ballboyImage ?? undefined} alt={ballboyName} />
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
                      'hover:border-primary cursor-pointer transition',
                      isSelected && 'border-primary bg-primary/5'
                    )}
                  >
                    <div className="space-y-3 px-4 py-3">
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
                            className="bg-primary/10 text-primary flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" />
                            Dipilih
                          </Badge>
                        ) : (
                          <ChevronRight className="text-primary" />
                        )}
                      </div>

                      <div className="bg-muted flex items-center justify-between rounded-sm px-4 py-2">
                        <p className="text-foreground">
                          <span className="text-primary font-semibold">
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

        {/* === RAKET === */}
        {activeTab === 'inventory' && (
          <div className="flex flex-col gap-3 pb-24">
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
                  <p className="text-destructive text-sm">Gagal memuat ketersediaan inventori.</p>
                </div>
              </Card>
            )}

            {!isInventoryPending && !isInventoryError && inventoryList.length === 0 && (
              <Card>
                <div className="px-4 py-3">
                  <p className="text-muted-foreground text-sm">
                    {courtSport === 'TENNIS' && hasBookingSelection
                      ? 'Raket di jam tersebut tidak tersedia.'
                      : 'Inventori tidak tersedia.'}
                  </p>
                </div>
              </Card>
            )}

            {!isInventoryPending &&
              !isInventoryError &&
              inventoryList.map((inventory) => {
                const selectedQty =
                  selectedInventories.find(
                    (item) =>
                      item.inventoryId === inventory.id &&
                      (item.timeSlot ?? 'default') === 'default'
                  )?.quantity ?? 0;
                const availableQuantity = inventory.availableQuantity ?? 0;
                const unitPrice = inventory.price ?? 0;
                const inventoryImage = resolveMediaUrl(inventory.image);

                return (
                  <Card key={inventory.id}>
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="bg-muted relative h-14 w-14 shrink-0 overflow-hidden rounded-md border">
                            {inventoryImage ? (
                              <Image
                                src={inventoryImage}
                                alt={inventory.name}
                                fill
                                sizes="56px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm font-semibold">
                                {getInitials(inventory.name)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{inventory.name}</p>
                            <p className="text-muted-foreground text-xs">
                              Tersedia {availableQuantity} equipment
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleInventoryQtyChange(inventory.id, selectedQty - 1)}
                            disabled={selectedQty <= 0}
                          >
                            <Minus size={16} />
                          </Button>
                          <span className="w-6 text-center font-semibold">{selectedQty}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleInventoryQtyChange(inventory.id, selectedQty + 1)}
                            disabled={selectedQty >= availableQuantity || availableQuantity === 0}
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-muted mt-4 flex rounded-sm px-4 py-2">
                        <p className="text-foreground">
                          <span className="text-primary font-semibold">
                            Rp{unitPrice.toLocaleString('id-ID')}{' '}
                          </span>
                          <span className="text-muted-foreground text-sm">/item</span>
                        </p>
                      </div>

                      {selectedQty > 0 && (
                        <p className="text-primary mt-2 text-sm font-medium">
                          Total: Rp{(selectedQty * unitPrice).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
          </div>
        )}
      </main>

      {/* Seleksi coach & inventori langsung melalui kartu */}
    </div>
  );
}
