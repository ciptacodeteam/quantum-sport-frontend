'use client';

import MainHeader from '@/components/headers/MainHeader';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Button } from '@/components/ui/button';
import { DatePickerModal, DatePickerModalTrigger } from '@/components/ui/date-picker-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn, getPlaceholderImageUrl } from '@/lib/utils';
import { coachAvailabilityQueryOptions } from '@/queries/coach';
import { courtsSlotsQueryOptions } from '@/queries/court';
import type { BookingItem } from '@/stores/useBookingStore';
import { useBookingStore } from '@/stores/useBookingStore';
import type { Court, Slot } from '@/types/model';
import { IconCalendarFilled, IconInfoCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const timeSlots = [
  // '00:00',
  // '01:00',
  // '02:00',
  // '03:00',
  // '04:00',
  // '05:00',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00'
];

type SelectedCell = {
  slotId: string;
  courtId: string;
  courtName: string;
  time: string;
  price: number;
  dateKey: string;
};

const normalizeDateKey = (value: string) => {
  const iso = dayjs(value, 'YYYY-MM-DD', true);
  if (iso.isValid()) {
    return iso.format('YYYY-MM-DD');
  }

  const display = dayjs(value, 'DD MMM', true);
  if (display.isValid()) {
    return display.year(dayjs().year()).format('YYYY-MM-DD');
  }

  const parsed = dayjs(value);
  if (parsed.isValid()) {
    return parsed.format('YYYY-MM-DD');
  }

  return dayjs().format('YYYY-MM-DD');
};

export default function BookingPage() {
  const {
    bookingItems,
    setBookingItems,
    setSelectedDate: setBookingDate,
    courtTotal,
    setCartOpen
  } = useBookingStore();

  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [dateList, setDateList] = useState<
    { label: string; date: string; fullDate: string; active?: boolean }[]
  >([]);
  // Store selections per date to preserve them when switching dates
  const [selectionsByDate, setSelectionsByDate] = useState<Record<string, SelectedCell[]>>({});
  const previousBookingItemsCountRef = useRef(bookingItems.length);
  const hasHydratedFromStoreRef = useRef(false);
  const skipStoreSyncRef = useRef(true);
  const selectedCells = useMemo(
    () => selectionsByDate[selectedDate] ?? [],
    [selectionsByDate, selectedDate]
  );
  const [selectedCourt, setSelectedCourt] = useState<null | {
    id: string;
    name: string;
    image?: string | null;
  }>(null);

  const activeDate = useMemo(
    () => dateList.find((item) => item.fullDate === selectedDate),
    [dateList, selectedDate]
  );
  const selectedFullDate = activeDate?.fullDate ?? selectedDate;

  const slotQueryParams = useMemo(
    () => ({
      startAt: dayjs(selectedFullDate).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
      endAt: dayjs(selectedFullDate).endOf('day').format('YYYY-MM-DD HH:mm:ss')
    }),
    [selectedFullDate]
  );

  const { data: slotsData, isLoading: isSlotsLoading } = useQuery(
    courtsSlotsQueryOptions(slotQueryParams)
  );

  const slots = useMemo(() => slotsData ?? [], [slotsData]);

  const courts = useMemo(() => {
    const map = new Map<string, { id: string; name: string; image?: string | null }>();
    slots.forEach((slot) => {
      const courtId = slot.courtId || slot.court?.id;
      if (!courtId) return;
      if (!map.has(courtId)) {
        map.set(courtId, {
          id: courtId,
          name: slot.court?.name || `Court ${map.size + 1}`,
          image:
            (slot.court as Court | undefined)?.image ||
            getPlaceholderImageUrl({ width: 160, height: 90, text: 'No Image' })
        });
      }
    });

    if (map.size === 0) {
      return [
        {
          id: 'default-court',
          name: 'Court',
          image: getPlaceholderImageUrl({ width: 160, height: 90, text: 'No Image' })
        }
      ];
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [slots]);

  const slotMap = useMemo(() => {
    const map = new Map<string, Slot & { court?: Court }>();
    slots.forEach((slot) => {
      const courtId = slot.courtId || slot.court?.id;
      if (!courtId || !slot.startAt) return;
      const time = dayjs(slot.startAt).format('HH:mm');
      map.set(`${slot.courtId}-${time}`, slot);
    });
    return map;
  }, [slots]);

  // Hydrate local selections from persisted booking items on initial load
  useEffect(() => {
    if (hasHydratedFromStoreRef.current) return;

    const hydrateFromState = () => {
      const state = useBookingStore.getState();
      const items = state.bookingItems;

      if (!items || items.length === 0) {
        hasHydratedFromStoreRef.current = true;
        skipStoreSyncRef.current = false;
        previousBookingItemsCountRef.current = 0;
        return;
      }

      const hydratedSelections: Record<string, SelectedCell[]> = {};
      items.forEach((item) => {
        const dateKey = normalizeDateKey(item.date);
        if (!hydratedSelections[dateKey]) {
          hydratedSelections[dateKey] = [];
        }
        hydratedSelections[dateKey].push({
          slotId: `${item.courtId}-${item.timeSlot}`,
          courtId: item.courtId,
          courtName: item.courtName,
          time: item.timeSlot,
          price: item.price,
          dateKey
        });
      });

      setSelectionsByDate(hydratedSelections);

      // Set the selected date to the first booking's date
      const availableDates = Object.keys(hydratedSelections).sort();
      if (availableDates.length > 0) {
        setSelectedDate(availableDates[0]);
      }

      previousBookingItemsCountRef.current = items.length;
      hasHydratedFromStoreRef.current = true;

      // Allow sync after a brief delay to ensure state is settled
      setTimeout(() => {
        skipStoreSyncRef.current = false;
      }, 0);
    };

    const unsubscribe = useBookingStore.persist?.onFinishHydration?.(() => {
      hydrateFromState();
    });

    // Also check if already hydrated (in case we mounted after hydration)
    if (useBookingStore.persist?.hasHydrated?.()) {
      hydrateFromState();
    }

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    // Skip this filter during initial hydration
    if (!hasHydratedFromStoreRef.current) {
      return;
    }

    // Skip if slotMap is empty (data not loaded yet)
    if (slotMap.size === 0) {
      return;
    }

    setSelectionsByDate((prev) => {
      const currentSelections = prev[selectedDate];
      if (!currentSelections) return prev;

      const filtered = currentSelections.filter((cell) => {
        const slot = slotMap.get(`${cell.courtId}-${cell.time}`);
        return !!slot && slot.isAvailable;
      });

      if (filtered.length === currentSelections.length) {
        return prev;
      }

      const next = { ...prev };
      if (filtered.length > 0) {
        next[selectedDate] = filtered;
      } else {
        delete next[selectedDate];
      }
      return next;
    });
  }, [slotMap, selectedDate]);

  // Sync deletions from CartSheet back to local selections
  useEffect(() => {
    // Skip during initial hydration
    if (!hasHydratedFromStoreRef.current) {
      return;
    }

    const previousCount = previousBookingItemsCountRef.current;
    const currentCount = bookingItems.length;

    if (currentCount < previousCount) {
      const existingKeys = new Set(
        bookingItems.map(
          (item) => `${item.courtId}-${item.timeSlot}-${normalizeDateKey(item.date)}`
        )
      );

      setSelectionsByDate((prev) => {
        let hasChanges = false;
        const next: Record<string, SelectedCell[]> = {};

        Object.entries(prev).forEach(([date, cells]) => {
          const filtered = cells.filter((cell) =>
            existingKeys.has(`${cell.courtId}-${cell.time}-${date}`)
          );

          if (filtered.length > 0) {
            next[date] = filtered;
          }

          if (filtered.length !== cells.length) {
            hasChanges = true;
          }
        });

        return hasChanges ? next : prev;
      });
    }

    previousBookingItemsCountRef.current = currentCount;
  }, [bookingItems]);

  // Update booking items from all dates (not just current date)
  useEffect(() => {
    if (skipStoreSyncRef.current) {
      return;
    }

    const allSelections: BookingItem[] = [];

    Object.entries(selectionsByDate).forEach(([date, cells]) => {
      cells.forEach((cell) => {
        allSelections.push({
          slotId: cell.slotId,
          courtId: cell.courtId,
          courtName: cell.courtName,
          timeSlot: cell.time,
          price: cell.price,
          date,
          endTime: dayjs(cell.time, 'HH:mm').add(1, 'hour').format('HH:mm')
        });
      });
    });

    // Only update if the content has changed
    const currentKeys = new Set(
      bookingItems.map((item) => `${item.courtId}-${item.timeSlot}-${normalizeDateKey(item.date)}`)
    );
    const newKeys = new Set(
      allSelections.map((item) => `${item.courtId}-${item.timeSlot}-${normalizeDateKey(item.date)}`)
    );

    const hasChanges =
      currentKeys.size !== newKeys.size || [...currentKeys].some((key) => !newKeys.has(key));

    if (hasChanges) {
      setBookingItems(allSelections);
    }

    setBookingDate(dayjs(selectedFullDate).toDate());
  }, [selectionsByDate, selectedFullDate, setBookingItems, setBookingDate, bookingItems]);

  useEffect(() => {
    const today = dayjs();
    const endDate = today.add(3, 'month');
    const updatedDates: {
      label: string;
      date: string;
      fullDate: string;
      active?: boolean;
    }[] = [];

    let currentDate = today;
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      updatedDates.push({
        label: currentDate.format('ddd'),
        date: currentDate.format('DD MMM'),
        fullDate: currentDate.format('YYYY-MM-DD'),
        active: currentDate.isSame(today, 'day')
      });
      currentDate = currentDate.add(1, 'day');
    }

    setDateList(updatedDates);
  }, []);

  const handleSelectDate = (date: Date | null) => {
    if (!date) return;
    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    setSelectedDate(formattedDate);

    const el = document.getElementById(`date-${formattedDate}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  const handleBooking = () => {
    if (bookingItems.length === 0) {
      toast.error('Pilih minimal satu slot');
      return;
    }

    setCartOpen(true);
  };

  const addCoachToStore = useBookingStore((s) => s.addCoach);
  const selectedCoaches = useBookingStore((s) => s.selectedCoaches);

  // Add-ons modal state
  const [addonsOpen, setAddonsOpen] = useState(false);
  const [coachStep, setCoachStep] = useState<'select-coach' | 'select-slot'>('select-coach');
  const [chosenCoach, setChosenCoach] = useState<null | {
    id: string;
    name: string;
    image?: string | null;
  }>(null);
  const [selectedCoachSlotIds, setSelectedCoachSlotIds] = useState<string[]>([]);
  const [coachSearch, setCoachSearch] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Compute time window from selected booking items
  const bookingTimeRange = (() => {
    if (bookingItems.length === 0) {
      return { startAt: undefined as string | undefined, endAt: undefined as string | undefined };
    }

    const parseBookingTime = (date: string, time: string) => {
      const candidates = [`${date} ${time}`, `${date}T${time}`, date];
      for (const candidate of candidates) {
        const parsed = dayjs(candidate);
        if (parsed.isValid()) return parsed;
      }
      return null;
    };

    let earliest: number | null = null;
    let latest: number | null = null;
    let startIso: string | undefined;
    let endIso: string | undefined;

    bookingItems.forEach((item) => {
      const start = parseBookingTime(item.date, item.timeSlot);
      const end = parseBookingTime(item.date, item.endTime ?? item.timeSlot);
      if (start) {
        const v = start.valueOf();
        if (earliest === null || v < earliest) {
          earliest = v;
          startIso = start.toISOString();
        }
      }
      if (end) {
        const v = end.valueOf();
        if (latest === null || v > latest) {
          latest = v;
          endIso = end.toISOString();
        }
      }
    });

    return { startAt: startIso, endAt: endIso };
  })();

  const { data: coachAvailability = [], isLoading: isCoachLoading } = useQuery(
    coachAvailabilityQueryOptions(bookingTimeRange.startAt, bookingTimeRange.endAt)
  );

  const uniqueCoaches = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; image?: string | null; minPrice: number }
    >();
    coachAvailability.forEach((slot: any) => {
      const id = slot.coach?.id;
      if (!id) return;
      const name = slot.coach?.name ?? 'Coach';
      const image = slot.coach?.image ?? null;
      const price = typeof slot.price === 'number' ? slot.price : 0;
      if (!map.has(id)) {
        map.set(id, { id, name, image, minPrice: price });
      } else {
        const cur = map.get(id)!;
        cur.minPrice = Math.min(cur.minPrice, price);
      }
    });
    let coaches = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    if (coachSearch.trim()) {
      const searchLower = coachSearch.trim().toLowerCase();
      coaches = coaches.filter((c) => c.name.toLowerCase().includes(searchLower));
    }
    return coaches;
  }, [coachAvailability, coachSearch]);

  const matchingSlotsForChosenCoach = useMemo(() => {
    if (!chosenCoach) return [] as any[];
    // Build a Set of keys for selected court slots: date + start-end
    const courtKeys = new Set(
      bookingItems.map((bi) => `${bi.date}|${bi.timeSlot}|${bi.endTime ?? bi.timeSlot}`)
    );
    return (coachAvailability as any[]).filter((item) => {
      if (item.coach?.id !== chosenCoach.id) return false;
      const start = item.startAt ? dayjs(item.startAt) : null;
      const end = item.endAt ? dayjs(item.endAt) : null;
      if (!start || !end) return false;
      const key = `${start.format('YYYY-MM-DD')}|${start.format('HH:mm')}|${end.format('HH:mm')}`;
      return courtKeys.has(key);
    });
  }, [chosenCoach, bookingItems, coachAvailability]);

  const openAddons = () => {
    if (bookingItems.length === 0) {
      toast.error('Tambahkan minimal satu slot lapangan dulu.');
      return;
    }
    setCoachStep('select-coach');
    setChosenCoach(null);
    setSelectedCoachSlotIds([]);
    setAddonsOpen(true);
  };

  const toggleCoachSlot = (slotId: string) => {
    setSelectedCoachSlotIds((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    );
  };

  const confirmAddCoach = () => {
    if (!chosenCoach) return;
    const selectedSlots = (coachAvailability as any[]).filter((s) =>
      selectedCoachSlotIds.includes(s.slotId)
    );
    if (selectedSlots.length === 0) {
      toast.error('Pilih minimal satu jadwal coach.');
      return;
    }
    selectedSlots.forEach((item) => {
      const start = item.startAt ? dayjs(item.startAt) : null;
      const end = item.endAt ? dayjs(item.endAt) : null;
      const timeSlot = start && end ? `${start.format('HH:mm')} - ${end.format('HH:mm')}` : '';
      addCoachToStore({
        coachId: chosenCoach.id,
        coachName: chosenCoach.name,
        timeSlot,
        price: typeof item.price === 'number' ? item.price : 0,
        date: start
          ? start.format('YYYY-MM-DD')
          : (bookingItems[0]?.date ?? dayjs().format('YYYY-MM-DD')),
        slotId: item.slotId,
        coachTypeId: item.coachTypeId ?? null,
        startAt: item.startAt,
        endAt: item.endAt
      });
    });
    toast.success('Coach ditambahkan ke keranjang.');
    setAddonsOpen(false);
  };

  // ...existing code...
  return (
    <>
      <MainHeader backHref="/" title="Booking Court" withLogo={false} withCartBadge />

      <main className="mt-24 flex h-[calc(100dvh-180px)] w-full flex-col md:mt-24 lg:h-[calc(100dvh-100px)]">
        <div className="sticky top-24 z-30 border-b bg-white pb-2 md:top-14">
          <div className="flex items-center gap-2">
            <div className="flex items-center px-2 pl-4">
              <DatePickerModal onChange={handleSelectDate} label="Select Booking Date">
                <DatePickerModalTrigger>
                  <Button variant="light" size={'icon-lg'} className="p-2">
                    <IconCalendarFilled className="text-primary size-6" />
                  </Button>
                </DatePickerModalTrigger>
              </DatePickerModal>
            </div>

            <Separator orientation="vertical" className="h-10" />

            <div className="scrollbar-hide flex flex-nowrap gap-2 overflow-x-auto px-2">
              {dateList.map((d) => (
                <button
                  id={`date-${d.fullDate}`}
                  key={d.fullDate}
                  className={cn(
                    'flex h-14 min-w-14 flex-col items-center justify-center rounded px-2 py-1 font-semibold transition-all md:h-16 md:min-w-16 md:px-3 md:hover:scale-[1.03]',
                    selectedDate === d.fullDate
                      ? 'bg-primary text-white'
                      : 'hover:bg-muted text-black'
                  )}
                  onClick={() => setSelectedDate(d.fullDate)}
                >
                  <span className="text-xs font-normal">{d.label}</span>
                  <div className="mt-0.5 flex">
                    <span className="me-0.5 text-sm font-semibold">
                      {dayjs(d.fullDate).format('DD')}
                    </span>
                    <span className="text-sm font-semibold">{dayjs(d.fullDate).format('MMM')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="scrollbar-hide flex-1 overflow-auto pb-10 lg:pb-0">
          {isSlotsLoading && (
            <div className="text-muted-foreground p-4 text-center text-sm">Memuat slot...</div>
          )}
          <div className="h-full overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 border border-gray-200 text-center">
              <thead className="sticky top-0 z-20 bg-gray-50/90 shadow-sm backdrop-blur md:text-sm md:tracking-tight">
                <tr>
                  <th className="sticky left-0 z-30 w-20 border-r border-b bg-gray-50 px-2 py-2 text-left font-semibold"></th>
                  {courts.map((court) => (
                    <th
                      key={court.id}
                      className="border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold"
                    >
                      <Button
                        variant={'ghost'}
                        className="flex items-center gap-1 text-gray-700"
                        onClick={() => setSelectedCourt(court)}
                      >
                        {court.name}
                        <IconInfoCircle className="inline-block size-4" />
                      </Button>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {timeSlots.map((time) => (
                  <tr key={time}>
                    <td className="sticky left-0 z-10 w-20 border border-gray-200 bg-white px-4 py-2 text-left text-sm font-medium">
                      {time}
                    </td>
                    {courts.map((court) => {
                      const slot = slotMap.get(`${court.id}-${time}`);
                      const hasSlot = !!slot;
                      const isAvailable = !!slot?.isAvailable;
                      const selected = selectedCells.some(
                        (cell) => cell.courtId === court.id && cell.time === time
                      );
                      return (
                        <td key={court.name} className="border border-gray-200 p-1">
                          <button
                            disabled={!hasSlot || !isAvailable}
                            className={cn(
                              `flex h-14 w-full flex-col items-start justify-between rounded px-2 py-1 text-base font-semibold transition-all`,
                              !hasSlot
                                ? 'text-muted-foreground cursor-not-allowed bg-gray-100'
                                : !isAvailable
                                  ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                                  : selected
                                    ? 'border-primary bg-primary text-white shadow-lg'
                                    : 'bg-white hover:bg-green-100'
                            )}
                            onClick={() => {
                              if (!slot || !isAvailable) return;
                              setSelectionsByDate((prev) => {
                                const dateKey = selectedDate;
                                const currentSelections = prev[dateKey] ?? [];
                                const exists = currentSelections.some(
                                  (cell) => cell.courtId === court.id && cell.time === time
                                );

                                let updatedSelections: SelectedCell[];
                                if (exists) {
                                  updatedSelections = currentSelections.filter(
                                    (cell) => !(cell.courtId === court.id && cell.time === time)
                                  );
                                } else {
                                  updatedSelections = [
                                    ...currentSelections,
                                    {
                                      slotId: slot.id,
                                      courtId: court.id,
                                      courtName: court.name,
                                      time,
                                      price: slot.price ?? 0,
                                      dateKey
                                    }
                                  ];
                                }

                                const next = { ...prev };
                                if (updatedSelections.length > 0) {
                                  next[dateKey] = updatedSelections;
                                } else {
                                  delete next[dateKey];
                                }

                                return next;
                              });
                            }}
                          >
                            {hasSlot ? (
                              <>
                                <span className="text-sm">{`Rp${(slot.price ?? 0).toLocaleString('id-ID')}`}</span>
                                {!isAvailable && <span className="text-xs">Booked</span>}
                              </>
                            ) : (
                              <span className="text-xs">Booked</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pointer-events-none h-2"></div>
          </div>
        </div>
      </main>

      {/* Court detail dialog */}
      <Dialog open={!!selectedCourt} onOpenChange={() => setSelectedCourt(null)}>
        <DialogContent className="w-11/12">
          {selectedCourt && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCourt.name}</DialogTitle>
              </DialogHeader>
              <div className="mt-1">
                <Image
                  src={
                    selectedCourt.image ||
                    getPlaceholderImageUrl({ width: 600, height: 400, text: 'No Image' })
                  }
                  alt={selectedCourt.name}
                  width={600}
                  height={400}
                  className="w-full rounded-sm object-cover"
                  unoptimized
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add-ons (Coach) modal */}
      <Dialog open={addonsOpen} onOpenChange={(o) => setAddonsOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {coachStep === 'select-coach' ? 'Pilih Coach' : `Pilih Jadwal (${chosenCoach?.name})`}
            </DialogTitle>
          </DialogHeader>

          {coachStep === 'select-coach' ? (
            <div className="space-y-3">
              <Input
                type="text"
                className="mb-2 w-full rounded border px-3 py-2"
                placeholder="Cari coach..."
                value={coachSearch}
                onChange={(e) => setCoachSearch(e.target.value)}
              />
              {isCoachLoading && <p className="text-muted-foreground text-sm">Memuat coach...</p>}
              {!isCoachLoading && uniqueCoaches.length === 0 && (
                <p className="text-muted-foreground text-sm">Coach tidak tersedia.</p>
              )}
              {!isCoachLoading &&
                uniqueCoaches.map((c) => (
                  <button
                    key={c.id}
                    className={cn(
                      'hover:bg-accent flex w-full items-center gap-3 rounded-md border p-3 text-left transition',
                      chosenCoach?.id === c.id && 'border-primary bg-primary/5'
                    )}
                    onClick={() => {
                      setChosenCoach(c);
                      setCoachStep('select-slot');
                      setSelectedCoachSlotIds([]);
                    }}
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                      <Image
                        src={c.image || '/assets/img/avatar.webp'}
                        alt={c.name}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-muted-foreground text-xs">
                        Mulai Rp{c.minPrice.toLocaleString('id-ID')}/sesi
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          ) : (
            <div className="space-y-3">
              {matchingSlotsForChosenCoach.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  Tidak ada jadwal coach yang cocok dengan slot lapangan terpilih.
                </p>
              )}
              {matchingSlotsForChosenCoach.map((item: any) => {
                const start = dayjs(item.startAt);
                const end = dayjs(item.endAt);
                const time = `${start.format('DD MMM YYYY, HH:mm')} - ${end.format('HH:mm')}`;
                const checked = selectedCoachSlotIds.includes(item.slotId);
                const alreadyAdded = selectedCoaches.some((sc) => sc.slotId === item.slotId);
                return (
                  <label
                    key={item.slotId}
                    className={cn(
                      'hover:bg-accent flex items-center justify-between gap-3 rounded-md border p-3 transition',
                      checked && 'border-primary bg-primary/5'
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{time}</p>
                      <p className="text-muted-foreground text-xs">
                        Rp{Number(item.price || 0).toLocaleString('id-ID')} / sesi
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {alreadyAdded && (
                        <span className="text-primary text-xs">Sudah ditambahkan</span>
                      )}
                      <input
                        type="checkbox"
                        className="h-5 w-5"
                        checked={checked}
                        disabled={alreadyAdded}
                        onChange={() => toggleCoachSlot(item.slotId)}
                      />
                    </div>
                  </label>
                );
              })}
              <div className="flex justify-between pt-1">
                <Button variant="outline" onClick={() => setCoachStep('select-coach')}>
                  Kembali
                </Button>
                <Button
                  onClick={() => setConfirmModalOpen(true)}
                  disabled={selectedCoachSlotIds.length === 0}
                >
                  Tambahkan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Coach Scheduler Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Jadwal Coach</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p>Anda akan menambahkan jadwal coach berikut:</p>
            {matchingSlotsForChosenCoach
              .filter((item: any) => selectedCoachSlotIds.includes(item.slotId))
              .map((item: any) => {
                const start = dayjs(item.startAt);
                const end = dayjs(item.endAt);
                const time = `${start.format('DD MMM YYYY, HH:mm')} - ${end.format('HH:mm')}`;
                return (
                  <div key={item.slotId} className="rounded border p-2">
                    <div className="font-medium">{time}</div>
                    <div className="text-muted-foreground text-xs">
                      Rp{Number(item.price || 0).toLocaleString('id-ID')} / sesi
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="flex justify-between pt-3">
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                confirmAddCoach();
                setConfirmModalOpen(false);
              }}
            >
              Konfirmasi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigationWrapper className="pb-4">
        <header className="flex-between my-2 items-end">
          <div>
            <span className="text-muted-foreground text-xs">Subtotal</span>
            <h2 className="text-lg font-semibold">Rp{courtTotal.toLocaleString('id-ID')}</h2>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">
              {bookingItems.length} Slot Terpilih
            </span>
          </div>
        </header>
        <main className="flex gap-2">
          <Button
            variant="outline"
            className="w-1/2"
            size={'xl'}
            onClick={openAddons}
            disabled={bookingItems.length === 0}
          >
            Tambah Addons
          </Button>
          <Button
            className="w-1/2"
            size={'xl'}
            onClick={handleBooking}
            disabled={bookingItems.length === 0}
          >
            Pilih Jadwal
          </Button>
        </main>
      </BottomNavigationWrapper>
    </>
  );
}
