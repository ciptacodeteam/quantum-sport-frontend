'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { DatePickerModal, DatePickerModalTrigger } from '@/components/ui/date-picker-modal';
import { Separator } from '@/components/ui/separator';
import { getCourtSlotLabel } from '@/lib/court-slot-status';
import { formatSlotTime } from '@/lib/time-utils';
import { isTimeAllowedForMembershipType, type MembershipType } from '@/lib/membership-hours';
import { cn } from '@/lib/utils';
import CourtDetailsDialog from '@/components/booking/CourtDetailsDialog';
import { courtsSlotsQueryOptions } from '@/queries/court';
import { myMembershipQueryOptions } from '@/queries/membership';
import type { BookingItem } from '@/stores/useBookingStore';
import useAuthStore from '@/stores/useAuthStore';
import { useBookingStore } from '@/stores/useBookingStore';
import type { Court, Slot } from '@/types/model';
import { IconCalendarFilled, IconInfoCircle } from '@tabler/icons-react';
import { useHasMounted } from '@/hooks/useHasMounted';
import dayjs, { nowJakarta } from '@/lib/dayjs';
import { useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArrowUpRight } from 'lucide-react';

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
  normalPrice?: number;
  discountPrice?: number;
  dateKey: string;
  startAt?: string;
  endAt?: string;
};

const normalizeDateKey = (value: string) => {
  const iso = dayjs(value, 'YYYY-MM-DD', true);
  if (iso.isValid()) {
    return iso.format('YYYY-MM-DD');
  }

  const display = dayjs(value, 'DD MMM', true);
  if (display.isValid()) {
    return display.year(nowJakarta().year()).format('YYYY-MM-DD');
  }

  const parsed = dayjs(value);
  if (parsed.isValid()) {
    return parsed.format('YYYY-MM-DD');
  }

  return nowJakarta().format('YYYY-MM-DD');
};

export default function BookingPage() {
  const pathname = usePathname();
  const courtSport = pathname.includes('/tennis') ? 'TENNIS' : 'PADEL';
  const bookingTitle = courtSport === 'TENNIS' ? 'Tennis Court' : 'Padel Court';
  const isAuthenticated = useAuthStore((state) => state.isAuth);
  const {
    bookingItems,
    setBookingItems,
    setSelectedDate: setBookingDate,
    courtTotal,
    setCartOpen
  } = useBookingStore();

  const hasMounted = useHasMounted();
  const [currentTime, setCurrentTime] = useState(() => nowJakarta());
  const [selectedDate, setSelectedDate] = useState(() => nowJakarta().format('YYYY-MM-DD'));
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
      endAt: dayjs(selectedFullDate).endOf('day').format('YYYY-MM-DD HH:mm:ss'),
      courtSport,
      includeUnavailable: 'true'
    }),
    [selectedFullDate, courtSport]
  );

  const {
    data: slotsData,
    isLoading: isSlotsLoading,
    isError: isSlotsError,
    refetch: refetchSlots
  } = useQuery({
    ...courtsSlotsQueryOptions(slotQueryParams),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true
  });
  const { data: userMembershipData } = useQuery({
    ...myMembershipQueryOptions,
    enabled: isAuthenticated
  });

  const slots = useMemo(() => slotsData ?? [], [slotsData]);
  const activeMembershipType = useMemo<MembershipType | null>(() => {
    const activeMembership = userMembershipData?.activeMembership;
    if (!activeMembership || activeMembership.membership.sport !== courtSport) return null;
    return activeMembership.membership.type ?? 'ALL_HOUR';
  }, [courtSport, userMembershipData]);

  // Filter time slots to exclude past hours for today (client-only to match SSR)
  const availableTimeSlots = useMemo(() => {
    if (!hasMounted) return timeSlots;

    const isToday = dayjs(selectedFullDate).isSame(currentTime, 'day');
    const membershipFilteredSlots = activeMembershipType
      ? timeSlots.filter((time) => isTimeAllowedForMembershipType(activeMembershipType, time))
      : timeSlots;

    if (!isToday) return membershipFilteredSlots;

    const currentHour = currentTime.hour();
    return membershipFilteredSlots.filter((time) => {
      const slotHour = parseInt(time.split(':')[0], 10);
      return slotHour > currentHour;
    });
  }, [selectedFullDate, hasMounted, activeMembershipType, currentTime]);

  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(nowJakarta());
    const intervalId = window.setInterval(updateCurrentTime, 60_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') updateCurrentTime();
    };

    window.addEventListener('focus', updateCurrentTime);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', updateCurrentTime);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Remove selections that expired while this page/tab was left open.
  useEffect(() => {
    if (!hasMounted) return;

    setSelectionsByDate((previous) => {
      let changed = false;
      const next: Record<string, SelectedCell[]> = {};

      Object.entries(previous).forEach(([dateKey, selections]) => {
        const validSelections = selections.filter((selection) => {
          const slotStart = dayjs.tz(`${selection.dateKey}T${selection.time}:00`, 'Asia/Jakarta');
          const isValid = slotStart.isAfter(currentTime);
          if (!isValid) changed = true;
          return isValid;
        });

        if (validSelections.length > 0) next[dateKey] = validSelections;
      });

      return changed ? next : previous;
    });
  }, [currentTime, hasMounted, selectionsByDate]);

  const courts = useMemo(() => {
    const map = new Map<string, { id: string; name: string; image?: string | null }>();
    slots.forEach((slot) => {
      const courtId = slot.courtId || slot.court?.id;
      if (!courtId) return;
      if (!map.has(courtId)) {
        map.set(courtId, {
          id: courtId,
          name: slot.court?.name || `Court ${map.size + 1}`,
          image: (slot.court as Court | undefined)?.image ?? null
        });
      }
    });

    if (map.size === 0) {
      return [
        {
          id: 'default-court',
          name: 'Court',
          image: null
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
      const time = formatSlotTime(slot.startAt);
      map.set(`${courtId}-${time}`, slot);
    });
    return map;
  }, [slots]);

  // Hydrate local selections from persisted booking items on initial load
  useEffect(() => {
    if (hasHydratedFromStoreRef.current) return;
    // Wait for slotMap to be available so we can get the real slot IDs
    if (slotMap.size === 0) return;

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

        // Use the actual slot ID from slotMap if available, otherwise use item.slotId if it exists and is valid
        // Check if item.slotId looks like a constructed one (contains time format like "06:00")
        const isConstructedSlotId = item.slotId && /-\d{2}:\d{2}$/.test(item.slotId);
        let actualSlotId = item.slotId;

        // If slotId is constructed or missing, look it up from slotMap
        if (isConstructedSlotId || !actualSlotId) {
          const slot = slotMap.get(`${item.courtId}-${item.timeSlot}`);
          if (slot?.id) {
            actualSlotId = slot.id;
          } else if (!actualSlotId) {
            // Fallback: use constructed ID only if we can't find the slot
            actualSlotId = `${item.courtId}-${item.timeSlot}`;
          }
        }

        hydratedSelections[dateKey].push({
          slotId: actualSlotId,
          courtId: item.courtId,
          courtName: item.courtName,
          time: item.timeSlot,
          price: item.price,
          normalPrice: item.normalPrice,
          discountPrice: item.discountPrice,
          dateKey,
          startAt: item.startAt,
          endAt: item.endAt
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
  }, [slotMap]);

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
        return (
          !!slot &&
          slot.isAvailable &&
          isTimeAllowedForMembershipType(activeMembershipType, cell.time)
        );
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
  }, [slotMap, selectedDate, activeMembershipType]);

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
          normalPrice: cell.normalPrice,
          discountPrice: cell.discountPrice,
          sport: courtSport,
          date,
          endTime: cell.endAt
            ? formatSlotTime(cell.endAt)
            : dayjs(cell.time, 'HH:mm').add(1, 'hour').format('HH:mm'),
          startAt: cell.startAt,
          endAt: cell.endAt
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
    const today = nowJakarta();
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

  return (
    <>
      <MainHeader backHref="/" title={bookingTitle} withLogo={false} withCartBadge withBorder />

      <main className="booking-page mx-auto mt-[76px] h-[calc(100dvh-76px)] w-full max-w-7xl overflow-hidden pb-[calc(5rem+env(safe-area-inset-bottom))] text-[#171717] lg:mt-0 lg:h-auto lg:overflow-visible lg:px-8 lg:pt-28 lg:pb-16 xl:pt-32">
        <div className="grid h-full min-h-0 min-w-0 items-start gap-4 lg:h-auto lg:grid-cols-[minmax(0,1fr)_300px]">
          <section
            aria-label="Jadwal lapangan"
            className="flex h-full min-h-0 min-w-0 flex-col lg:h-auto"
          >
            <div className="min-w-0 shrink-0 border-y border-black/15 bg-[#f8f8f6] p-3 lg:border">
              <div className="flex items-center gap-2">
                <div className="flex shrink-0 items-center">
                  <DatePickerModal
                    value={dayjs(selectedDate).toDate()}
                    onChange={handleSelectDate}
                    label="Pilih tanggal bermain"
                  >
                    <DatePickerModalTrigger>
                      <Button
                        variant="ghost"
                        size="icon-lg"
                        aria-label="Pilih tanggal pemesanan"
                        className="rounded-none border border-black/15 bg-white p-2 text-black hover:bg-black/5"
                      >
                        <IconCalendarFilled className="size-5" />
                      </Button>
                    </DatePickerModalTrigger>
                  </DatePickerModal>
                </div>

                <Separator
                  orientation="vertical"
                  className="mx-2 bg-black/25 data-[orientation=vertical]:h-10"
                />

                <div className="flex min-w-0 flex-1 flex-nowrap gap-2 overflow-x-auto px-2 pb-1">
                  {dateList.map((d) => (
                    <button
                      id={`date-${d.fullDate}`}
                      key={d.fullDate}
                      aria-pressed={selectedDate === d.fullDate}
                      className={cn(
                        'flex h-16 min-w-16 shrink-0 flex-col items-center justify-center border px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
                        selectedDate === d.fullDate
                          ? 'border-[#111111] bg-[#111111] text-white'
                          : 'border-transparent text-black/60 hover:border-black/15 hover:bg-white'
                      )}
                      onClick={() => setSelectedDate(d.fullDate)}
                    >
                      <span className="text-xs font-normal">{d.label}</span>
                      <div className="mt-0.5 flex">
                        <span className="me-0.5 text-sm font-semibold">
                          {dayjs(d.fullDate).format('DD')}
                        </span>
                        <span className="text-sm font-semibold">
                          {dayjs(d.fullDate).format('MMM')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="flex shrink-0 flex-wrap gap-5 px-5 py-4 text-[11px] text-black/55 lg:px-0"
              aria-label="Keterangan jadwal"
            >
              <span className="flex items-center gap-2">
                <span className="size-2.5 border border-black/25 bg-white" />
                Tersedia
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2.5 bg-[#111111]" />
                Dipilih
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2.5 bg-[#e5e5e2]" />
                On Hold / Booked / Unavailable
              </span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col lg:block">
              {isSlotsError && (
                <div
                  role="alert"
                  className="mb-4 border border-[#ad422b]/25 bg-[#ad422b]/5 p-4 text-sm"
                >
                  <p>Jadwal belum dapat dimuat.</p>
                  <button
                    type="button"
                    onClick={() => refetchSlots()}
                    className="mt-2 font-medium underline underline-offset-4"
                  >
                    Coba lagi
                  </button>
                </div>
              )}
              {isSlotsLoading && (
                <div className="text-muted-foreground p-4 text-center text-sm">Memuat slot...</div>
              )}
              <div
                className="min-h-0 flex-1 overflow-auto border-y border-black/15 lg:max-h-[640px] lg:flex-none lg:border"
                aria-busy={isSlotsLoading}
              >
                <table className="w-full min-w-full border-separate border-spacing-0 text-center">
                  <thead className="sticky top-0 z-20 bg-[#f8f8f6] text-xs">
                    <tr>
                      <th
                        scope="col"
                        className="sticky left-0 z-30 w-20 border-r border-b border-black/10 bg-[#f8f8f6] px-4 py-4 text-left text-[10px] font-medium tracking-wider text-black/45 uppercase"
                      >
                        Waktu
                      </th>
                      {courts.map((court) => (
                        <th
                          key={court.id}
                          scope="col"
                          className="min-w-[150px] border-r border-b border-black/10 bg-[#f8f8f6] px-3 py-3 text-xs font-medium"
                        >
                          <Button
                            variant={'ghost'}
                            className="mx-auto flex items-center gap-2 rounded-none text-black/70 hover:bg-black/5"
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
                    {availableTimeSlots.map((time) => (
                      <tr key={time}>
                        <td className="sticky left-0 z-10 w-20 border-r border-b border-black/10 bg-[#f8f8f6] px-4 py-2 text-left text-xs font-medium tabular-nums">
                          {time}
                        </td>
                        {courts.map((court) => {
                          const slot = slotMap.get(`${court.id}-${time}`);
                          const hasSlot = !!slot;
                          const isAvailable = !!slot?.isAvailable;
                          const selected = selectedCells.some(
                            (cell) => cell.courtId === court.id && cell.time === time
                          );
                          const normalPrice = slot?.price ?? 0;
                          const discountPrice = slot?.discountPrice ?? 0;
                          const effectivePrice = discountPrice > 0 ? discountPrice : normalPrice;
                          return (
                            <td key={court.id} className="border-r border-b border-black/10 p-1.5">
                              <button
                                disabled={!hasSlot || !isAvailable}
                                aria-pressed={selected}
                                aria-label={`${court.name}, ${time}, ${selected ? 'dipilih' : getCourtSlotLabel(slot)}`}
                                className={cn(
                                  'flex h-16 w-full flex-col items-start justify-center gap-1 border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
                                  !hasSlot
                                    ? 'cursor-not-allowed border-transparent bg-[#f3f3f0] text-black/30'
                                    : !isAvailable
                                      ? 'cursor-not-allowed border-transparent bg-[#eaeae6] text-black/35'
                                      : selected
                                        ? 'border-[#111111] bg-[#111111] text-white'
                                        : 'border-black/15 bg-white text-[#171717] hover:border-[#ad422b] hover:bg-[#ad422b]/5'
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
                                          price: effectivePrice,
                                          normalPrice,
                                          discountPrice,
                                          dateKey,
                                          startAt:
                                            typeof slot.startAt === 'string'
                                              ? slot.startAt
                                              : slot.startAt.toISOString(),
                                          endAt:
                                            typeof slot.endAt === 'string'
                                              ? slot.endAt
                                              : slot.endAt.toISOString()
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
                                {hasSlot && isAvailable ? (
                                  <>
                                    {discountPrice > 0 && discountPrice < normalPrice ? (
                                      <span className="flex flex-col items-start text-xs">
                                        <span className="text-[10px] text-gray-400 line-through">
                                          Rp{normalPrice.toLocaleString('id-ID')}
                                        </span>
                                        <span
                                          className={cn(
                                            'text-sm font-semibold',
                                            selected ? 'text-white' : 'text-[#ad422b]'
                                          )}
                                        >
                                          Rp{effectivePrice.toLocaleString('id-ID')}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-sm">
                                        {`Rp${effectivePrice.toLocaleString('id-ID')}`}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[11px]">{getCourtSlotLabel(slot)}</span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!isSlotsLoading && availableTimeSlots.length === 0 && (
                  <p className="p-8 text-center text-sm text-black/50">
                    Tidak ada jam bermain untuk tanggal ini. Silakan pilih tanggal lain.
                  </p>
                )}
              </div>
            </div>
          </section>
          <aside
            className="hidden border border-black/15 bg-[#f8f8f6] p-6 lg:sticky lg:top-28 lg:block"
            aria-label="Ringkasan pemesanan"
          >
            <p className="mb-2 text-[10px] tracking-[0.15em] text-[#ad422b] uppercase">
              02 / Pemesanan Anda
            </p>
            <h2 className="text-2xl font-medium tracking-tight">Ready to play?</h2>
            <p className="mt-3 text-xs leading-relaxed text-black/50">
              Pilih satu atau beberapa slot pada jadwal untuk mulai memesan lapangan.
            </p>
            <div className="my-6 border-y border-black/15 py-4">
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="text-black/50">Slot terpilih</span>
                <span suppressHydrationWarning>{hasMounted ? bookingItems.length : 0} slot</span>
              </div>
              {hasMounted && bookingItems.length > 0 ? (
                <ul className="max-h-64 space-y-3 overflow-y-auto">
                  {bookingItems.map((item) => (
                    <li
                      key={`${item.courtId}-${item.date}-${item.timeSlot}`}
                      className="border-t border-black/10 pt-3 text-xs"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">{item.courtName}</span>
                        <span>Rp{item.price.toLocaleString('id-ID')}</span>
                      </div>
                      <p className="mt-1 text-black/50">
                        {dayjs(normalizeDateKey(item.date)).format('DD MMM YYYY')} · {item.timeSlot}
                        –{item.endTime}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-xs text-black/40">Belum ada jadwal yang dipilih.</p>
              )}
            </div>
            <div className="mb-6 flex items-end justify-between gap-3">
              <span className="text-xs text-black/50">Subtotal</span>
              <p className="text-2xl font-medium tracking-tight" suppressHydrationWarning>
                Rp{(hasMounted ? courtTotal : 0).toLocaleString('id-ID')}
              </p>
            </div>
            <Button
              className="h-12 w-full rounded-full bg-[#111111] text-sm text-white hover:bg-black/80 disabled:bg-black/15 disabled:text-black/40 disabled:opacity-100"
              onClick={handleBooking}
              disabled={!hasMounted || bookingItems.length === 0}
            >
              Lanjutkan pemesanan{' '}
              <ArrowUpRight className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            </Button>
            <p className="mt-4 text-center text-[11px] text-black/40">
              Periksa pilihan Anda sebelum melanjutkan.
            </p>
          </aside>
        </div>
      </main>

      <div
        className="fixed inset-x-0 bottom-0 z-40 h-[calc(5rem+env(safe-area-inset-bottom))] border-t border-black/15 bg-[#f8f8f6] pb-[env(safe-area-inset-bottom)] lg:hidden"
        role="region"
        aria-label="Ringkasan pemesanan"
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="min-w-0">
            <p className="text-[11px] text-black/50" suppressHydrationWarning>
              Subtotal · {hasMounted ? bookingItems.length : 0} slot
            </p>
            <p
              className="mt-1 text-xl font-medium tracking-tight text-[#171717]"
              suppressHydrationWarning
            >
              Rp{(hasMounted ? courtTotal : 0).toLocaleString('id-ID')}
            </p>
          </div>
          <Button
            className="h-12 shrink-0 rounded-full bg-[#111111] px-6 text-sm text-white hover:bg-black/80 disabled:bg-black/15 disabled:text-black/40 disabled:opacity-100"
            onClick={handleBooking}
            disabled={!hasMounted || bookingItems.length === 0}
          >
            Lanjutkan <ArrowUpRight className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          </Button>
        </div>
      </div>

      <CourtDetailsDialog court={selectedCourt} onClose={() => setSelectedCourt(null)} />
    </>
  );
}
