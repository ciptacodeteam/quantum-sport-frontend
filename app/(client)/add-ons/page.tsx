'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { inventoryAvailabilityQueryOptions } from '@/queries/inventory';
import { useBookingStore, type BookingItem } from '@/stores/useBookingStore';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function AddOnsPage() {
  const router = useRouter();
  const bookingItems = useBookingStore((state) => state.bookingItems) as BookingItem[];
  // const selectedCoaches = useBookingStore((state) => state.selectedCoaches);
  // const addCoachToStore = useBookingStore((state) => state.addCoach);
  // const removeCoachFromStore = useBookingStore((state) => state.removeCoach);
  const selectedInventories = useBookingStore((state) => state.selectedInventories);
  const addInventoryToStore = useBookingStore((state) => state.addInventory);
  const removeInventoryFromStore = useBookingStore((state) => state.removeInventory);
  const [activeTab, setActiveTab] = useState<'coach' | 'raket'>('raket');
  const {
    data: inventoryAvailability,
    isPending: isInventoryPending,
    isError: isInventoryError
  } = useQuery(inventoryAvailabilityQueryOptions);

  const bookingTimeRange = useMemo(() => {
    if (bookingItems.length === 0) {
      return { startAt: undefined as string | undefined, endAt: undefined as string | undefined };
    }

    const parseBookingTime = (date: string, time: string) => {
      const candidates = [`${date} ${time}`, `${date}T${time}`, date];

      for (const candidate of candidates) {
        const parsed = dayjs(candidate);
        if (parsed.isValid()) {
          return parsed;
        }
      }

      return null;
    };

    let earliestTimestamp: number | null = null;
    let earliestIso: string | undefined;
    let latestTimestamp: number | null = null;
    let latestIso: string | undefined;

    bookingItems.forEach((item) => {
      const start = parseBookingTime(item.date, item.timeSlot);
      const end = parseBookingTime(item.date, item.endTime ?? item.timeSlot);

      if (start) {
        const value = start.valueOf();
        if (earliestTimestamp === null || value < earliestTimestamp) {
          earliestTimestamp = value;
          earliestIso = start.toISOString();
        }
      }

      if (end) {
        const value = end.valueOf();
        if (latestTimestamp === null || value > latestTimestamp) {
          latestTimestamp = value;
          latestIso = end.toISOString();
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

  // const {
  //   data: coachAvailability,
  //   isPending: isCoachPending,
  //   isError: isCoachError
  // } = useQuery(coachAvailabilityQueryOptions(bookingTimeRange.startAt, bookingTimeRange.endAt));

  const hasBookingSelection = bookingItems.length > 0;
  // const coachList = coachAvailability ?? [];

  // 🏸 Data Raket
  const [racketQty, setRacketQty] = useState(0);
  const racketInventory = inventoryAvailability?.[0];
  const availableRacket = racketInventory?.availableQuantity ?? 0;
  const racketPrice = racketInventory?.price ?? 0;
  const racketName = racketInventory?.name ?? 'Sewa Raket';
  const inventorySelection = useMemo(() => {
    if (!racketInventory) {
      return undefined;
    }

    return selectedInventories.find(
      (item) =>
        item.inventoryId === racketInventory.id && (item.timeSlot ?? 'default') === 'default'
    );
  }, [racketInventory, selectedInventories]);

  useEffect(() => {
    const qty = inventorySelection?.quantity ?? 0;
    setRacketQty((prev) => (prev === qty ? prev : qty));
  }, [inventorySelection?.quantity]);

  const primaryBookingDate = useMemo(() => {
    if (bookingTimeRange.startAt) {
      return dayjs(bookingTimeRange.startAt).format('YYYY-MM-DD');
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

  const handleInventoryQtyChange = (nextQty: number) => {
    if (!hasBookingSelection) {
      toast.error('Tambahkan booking lapangan terlebih dahulu sebelum memilih peralatan.');
      return;
    }

    const safeQty = Math.max(0, Math.min(nextQty, availableRacket));
    setRacketQty(safeQty);

    if (!racketInventory || racketPrice <= 0) {
      return;
    }

    if (safeQty > 0) {
      addInventoryToStore({
        inventoryId: racketInventory.id,
        inventoryName: racketInventory.name,
        timeSlot: 'default',
        price: safeQty * racketPrice,
        quantity: safeQty,
        date: primaryBookingDate
      });
      toast.success(`${racketInventory.name} ditambahkan (${safeQty} raket).`);
    } else {
      removeInventoryFromStore(racketInventory.id, 'default');
      toast.success(`${racketInventory.name} dihapus dari add-ons.`);
    }
  };

  return (
    <>
      <MainHeader onBack={() => router.back()} title="Produk Tambahan" withLogo={false} />

      <div className="mx-auto w-11/12 pt-28">
        {/* Tabs utama */}
        {/* <div className="mb-4 flex gap-2">
          {['Coach', 'Raket'].map((item) => (
            <Button
              key={item}
              variant={activeTab === item.toLowerCase().replace(' ', '') ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setActiveTab(item.toLowerCase().replace(' ', '') as any)}
            >
              {item}
            </Button>
          ))}
        </div> */}

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
        {activeTab === 'raket' && (
          <div className="mb-4 flex flex-col gap-3">
            <Card>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{racketName}</p>
                    <p className="text-muted-foreground text-xs">
                      {isInventoryPending && 'Memuat ketersediaan...'}
                      {isInventoryError && 'Gagal memuat ketersediaan'}
                      {!isInventoryPending &&
                        !isInventoryError &&
                        !racketInventory &&
                        'Inventori tidak tersedia'}
                      {!isInventoryPending &&
                        !isInventoryError &&
                        racketInventory &&
                        `Tersedia ${availableRacket} equipment`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleInventoryQtyChange(racketQty - 1)}
                      disabled={racketQty <= 0}
                    >
                      <Minus size={16} />
                    </Button>
                    <span className="w-6 text-center font-semibold">{racketQty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleInventoryQtyChange(racketQty + 1)}
                      disabled={
                        racketQty >= availableRacket ||
                        availableRacket === 0 ||
                        isInventoryPending ||
                        isInventoryError
                      }
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                <div className="bg-muted mt-4 flex rounded-sm px-4 py-2">
                  <p className="text-foreground">
                    <span className="text-primary font-semibold">
                      Rp{racketPrice.toLocaleString('id-ID')}{' '}
                    </span>
                    <span className="text-muted-foreground text-sm">/equipment</span>
                  </p>
                </div>

                {racketQty > 0 && (
                  <p className="text-primary mt-2 text-sm font-medium">
                    Total: Rp
                    {(racketQty * racketPrice).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Seleksi coach & inventori langsung melalui kartu */}
    </>
  );
}
