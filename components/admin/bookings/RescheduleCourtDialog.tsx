'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from '@/lib/dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { id as indonesia } from 'date-fns/locale';
import { IconCalendar, IconCheck } from '@tabler/icons-react';
import { toast } from 'sonner';
import { rescheduleBookedCourtApi } from '@/api/admin/bookedCourt';
import { formatBookingDate } from '@/lib/booking-display';
import { canRescheduleAt, RESCHEDULE_NOTICE } from '@/lib/reschedule-policy';
import { cn } from '@/lib/utils';
import { adminCourtQueryOptions, adminCourtsWithSlotsQueryOptions } from '@/queries/admin/court';
import type { BookingDetail, Court, Slot } from '@/types/model';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type BookingDetailWithSlot = BookingDetail & { slot?: Slot; court?: Court };
type Props = {
  detail: BookingDetailWithSlot;
  canReschedule: boolean;
  membershipCovered?: boolean;
  onSuccess?: () => void;
};
const currency = (value: number) => `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
const time = (value: Date | string) => formatBookingDate(value, 'HH:mm');
const slotMoment = (value: Date | string) =>
  typeof value === 'string' && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
    ? dayjs.tz(value, 'Asia/Jakarta')
    : dayjs(value);

export function RescheduleCourtDialog({
  detail,
  canReschedule,
  membershipCovered = false,
  onSuccess
}: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const withinDeadline = canRescheduleAt(detail.slot?.startAt, now);
  const allowed = canReschedule && withinDeadline;
  const sourceCourtId =
    detail.court?.id ?? detail.slot?.court?.id ?? detail.slot?.courtId ?? detail.courtId;
  const embeddedSport = detail.court?.sport ?? detail.slot?.court?.sport;
  const originalCourtQuery = useQuery({
    ...adminCourtQueryOptions(sourceCourtId || ''),
    enabled: open && !!sourceCourtId && !embeddedSport
  });
  const rawSport = embeddedSport ?? originalCourtQuery.data?.sport;
  const courtSport = rawSport === 'PADEL' || rawSport === 'TENNIS' ? rawSport : undefined;
  const sportLabel = courtSport === 'TENNIS' ? 'tenis' : 'padel';
  const [calendarOpen, setCalendarOpen] = useState(false);
  const initialDateKey = detail.slot?.startAt
    ? formatBookingDate(detail.slot.startAt, 'YYYY-MM-DD')
    : dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD');
  const defaultDate = useMemo(() => new Date(`${initialDateKey}T00:00:00`), [initialDateKey]);
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(sourceCourtId ?? null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const selectedDateString = dayjs(selectedDate).format('YYYY-MM-DD');
  const currentSlotId = detail.slot?.id ?? detail.slotId;
  const availability = useQuery({
    ...adminCourtsWithSlotsQueryOptions(selectedDateString, undefined, courtSport, true),
    enabled: open && !!courtSport
  });
  const courts = useMemo(
    () => availability.data?.courts.filter((court) => court.sport === courtSport) ?? [],
    [availability.data, courtSport]
  );
  const slotsByCourt = useMemo(() => {
    const allowedIds = new Set(courts.map((court) => court.id));
    const map = new Map<string, Slot[]>();
    for (const slot of availability.data?.slots || []) {
      const courtId = slot.courtId ?? slot.court?.id;
      if (
        !courtId ||
        !allowedIds.has(courtId) ||
        formatBookingDate(slot.startAt, 'YYYY-MM-DD') !== selectedDateString
      )
        continue;
      if (!map.has(courtId)) map.set(courtId, []);
      map.get(courtId)!.push(slot);
    }
    for (const slots of map.values())
      slots.sort((a, b) => slotMoment(a.startAt).valueOf() - slotMoment(b.startAt).valueOf());
    return map;
  }, [availability.data, courts, selectedDateString]);
  const sameDuration = (slot: Slot) =>
    !!detail.slot &&
    slotMoment(slot.endAt).valueOf() - slotMoment(slot.startAt).valueOf() ===
      slotMoment(detail.slot.endAt).valueOf() - slotMoment(detail.slot.startAt).valueOf();
  const samePrice = (slot: Slot) =>
    membershipCovered ||
    ((slot.discountPrice ?? 0) > 0 ? slot.discountPrice : slot.price) ===
      ((detail.discountPrice ?? 0) > 0 ? detail.discountPrice : detail.price);
  const isSelectable = (slot: Slot) =>
    slot.id !== currentSlotId &&
    slot.isAvailable &&
    slotMoment(slot.startAt).isAfter(dayjs()) &&
    sameDuration(slot) &&
    samePrice(slot);
  const selectedCourtSlots = selectedCourtId ? slotsByCourt.get(selectedCourtId) || [] : [];
  const selectedSlot = selectedCourtSlots.find((slot) => slot.id === selectedSlotId);
  const selectedCourt = courts.find((court) => court.id === selectedCourtId);

  useEffect(() => {
    if (!availability.data) return;
    if (courts.some((court) => court.id === selectedCourtId)) return;
    setSelectedCourtId(
      courts.find((court) => court.id === sourceCourtId)?.id ?? courts[0]?.id ?? null
    );
    setSelectedSlotId(null);
  }, [availability.data, courts, selectedCourtId, sourceCourtId]);

  const resetState = useCallback(() => {
    setSelectedSlotId(null);
    setSelectedDate(defaultDate);
    setSelectedCourtId(sourceCourtId ?? null);
    setCalendarOpen(false);
  }, [defaultDate, sourceCourtId]);

  const mutation = useMutation({
    mutationFn: (slotId: string) => rescheduleBookedCourtApi(detail.id, slotId),
    onSuccess: () => {
      toast.success('Slot berhasil dijadwalkan ulang');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'courts'] });
      void queryClient.invalidateQueries({ queryKey: ['courts', 'slots'] });
      setOpen(false);
      resetState();
      onSuccess?.();
    },
    onError: (error: Error) => toast.error(error.message || 'Gagal menjadwalkan ulang slot')
  });
  const canSave =
    allowed &&
    canRescheduleAt(detail.slot?.startAt) &&
    !!courtSport &&
    selectedCourt?.sport === courtSport &&
    !!selectedSlot &&
    isSelectable(selectedSlot) &&
    !availability.isFetching;
  const trigger = (
    <Button
      size="sm"
      variant="outline"
      disabled={!allowed}
      className="rounded-lg text-xs shadow-none"
    >
      Reschedule
    </Button>
  );
  if (!allowed)
    return (
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent>
          {canReschedule
            ? RESCHEDULE_NOTICE
            : 'Reschedule hanya untuk booking terkonfirmasi dengan pembayaran lunas.'}
        </TooltipContent>
      </Tooltip>
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        resetState();
        setOpen(value);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 gap-2 border-b px-5 py-5 pr-12 sm:px-6">
          <DialogTitle className="text-foreground text-lg">Reschedule lapangan</DialogTitle>
          <p className="text-muted-foreground text-sm">{RESCHEDULE_NOTICE}</p>
          <DialogDescription>
            {courtSport
              ? `Pilih lapangan ${sportLabel} dan jadwal pengganti.`
              : 'Memastikan jenis lapangan pemesanan.'}{' '}
            Durasi harus sama; harga reguler harus sama. Slot membership mengikuti jam paket.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:px-6">
          <div className="bg-muted/40 space-y-2 rounded-lg border px-3 py-3">
            <p className="text-muted-foreground text-xs">Jadwal saat ini</p>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {detail.court?.name ||
                    detail.slot?.court?.name ||
                    originalCourtQuery.data?.name ||
                    'Lapangan'}
                </p>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {detail.slot
                    ? `${formatBookingDate(detail.slot.startAt, 'DD MMM YYYY')} · ${time(detail.slot.startAt)}–${time(detail.slot.endAt)} WIB`
                    : '-'}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{currency(detail.price)}</span>
            </div>
          </div>
          {!courtSport ? (
            <div
              className="text-muted-foreground space-y-2 rounded-lg border border-dashed p-5 text-center text-sm"
              role="status"
            >
              {originalCourtQuery.isFetching
                ? 'Memuat jenis lapangan...'
                : 'Jenis lapangan belum dapat ditentukan.'}
              {originalCourtQuery.isError && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => void originalCourtQuery.refetch()}
                >
                  Coba lagi
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Jadwal pengganti</h3>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 rounded-lg shadow-none"
                      disabled={mutation.isPending}
                    >
                      <IconCalendar className="size-4" />
                      {dayjs(selectedDate).format('DD MMM YYYY')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto rounded-xl p-0">
                    <Calendar
                      mode="single"
                      locale={indonesia}
                      selected={selectedDate}
                      defaultMonth={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setSelectedSlotId(null);
                          setCalendarOpen(false);
                        }
                      }}
                      disabled={(date) =>
                        dayjs(date).format('YYYY-MM-DD') <
                        dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {availability.isFetching ? (
                <p className="text-muted-foreground py-8 text-center text-sm" role="status">
                  Memuat ketersediaan...
                </p>
              ) : availability.isError ? (
                <div role="alert" className="space-y-3 py-6 text-center">
                  <p className="text-muted-foreground text-sm">Ketersediaan belum dapat dimuat.</p>
                  <Button variant="outline" size="sm" onClick={() => void availability.refetch()}>
                    Coba lagi
                  </Button>
                </div>
              ) : courts.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  Tidak ada lapangan {sportLabel} tersedia.
                </p>
              ) : (
                <>
                  <section className="space-y-2" aria-label="Pilih lapangan">
                    <p className="text-muted-foreground text-xs">Lapangan {sportLabel}</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {courts.map((court) => {
                        const availableCount = (slotsByCourt.get(court.id) || []).filter(
                          isSelectable
                        ).length;
                        const selected = selectedCourtId === court.id;
                        return (
                          <button
                            key={court.id}
                            type="button"
                            aria-pressed={selected}
                            disabled={mutation.isPending || (!availableCount && !selected)}
                            onClick={() => {
                              setSelectedCourtId(court.id);
                              setSelectedSlotId(null);
                            }}
                            className={cn(
                              'focus-visible:ring-ring flex min-w-0 items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left outline-none focus-visible:ring-2 disabled:opacity-50',
                              selected ? 'border-primary bg-primary/5' : 'hover:border-primary/40'
                            )}
                          >
                            <span className="min-w-0 space-y-1">
                              <span className="block text-sm font-medium break-words">
                                {court.name}
                              </span>
                              <span className="text-muted-foreground block text-xs">
                                {availableCount} jam tersedia
                              </span>
                            </span>
                            {selected && <IconCheck className="text-primary size-4 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <section className="space-y-3" aria-label="Pilih jam">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold">
                        Pilih jam{' '}
                        <span className="text-muted-foreground text-xs font-normal">(WIB)</span>
                      </h3>
                      {selectedSlotId && (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedSlotId(null)}>
                          Reset
                        </Button>
                      )}
                    </div>
                    {!selectedCourtSlots.length ? (
                      <p className="text-muted-foreground rounded-lg border border-dashed p-5 text-center text-sm">
                        Belum ada slot untuk lapangan pada tanggal ini.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {selectedCourtSlots.map((slot) => {
                          const selectable = isSelectable(slot);
                          const selected = selectedSlotId === slot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              aria-pressed={selected}
                              disabled={!selectable || mutation.isPending}
                              onClick={() => setSelectedSlotId(selected ? null : slot.id)}
                              className={cn(
                                'focus-visible:ring-ring space-y-1 rounded-lg border px-3 py-2.5 text-left outline-none focus-visible:ring-2 disabled:cursor-not-allowed',
                                selected
                                  ? 'border-primary bg-primary/5'
                                  : 'enabled:hover:border-primary/40',
                                !selectable && 'bg-muted/50 text-muted-foreground border-dashed'
                              )}
                            >
                              <span className="block text-sm font-medium tabular-nums">
                                {time(slot.startAt)}–{time(slot.endAt)}
                              </span>
                              <span className="text-muted-foreground block text-xs">
                                {currency(slot.price || 0)}
                              </span>
                              {!selectable && (
                                <span className="text-muted-foreground block text-xs">
                                  {slot.id === currentSlotId
                                    ? 'Jadwal saat ini'
                                    : slot.availabilityStatus === 'BOOKED'
                                      ? 'Sudah dipesan'
                                      : slot.availabilityStatus === 'ON_HOLD'
                                        ? 'Sedang ditahan'
                                        : !slot.isAvailable
                                          ? 'Tidak tersedia'
                                          : !sameDuration(slot)
                                            ? 'Durasi berbeda'
                                            : !samePrice(slot)
                                              ? 'Harga berbeda'
                                              : 'Sudah lewat'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </>
              )}
            </>
          )}
        </div>
        <footer className="bg-muted/20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-5 py-4 sm:px-6">
          <p className="text-muted-foreground min-w-0 text-xs">
            {selectedSlot && selectedCourt ? (
              <>
                {selectedCourt.name}
                <span className="mt-1 block tabular-nums">
                  {dayjs(selectedDate).format('DD MMM')} · {time(selectedSlot.startAt)}–
                  {time(selectedSlot.endAt)} WIB
                </span>
              </>
            ) : (
              'Pilih satu jadwal pengganti'
            )}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-lg shadow-none"
              onClick={() => {
                setOpen(false);
                resetState();
              }}
              disabled={mutation.isPending}
            >
              Batal
            </Button>
            <Button
              className="rounded-lg"
              disabled={!canSave || mutation.isPending}
              loading={mutation.isPending}
              onClick={() => {
                if (canSave && selectedSlot && canRescheduleAt(detail.slot?.startAt))
                  mutation.mutate(selectedSlot.id);
              }}
            >
              Simpan jadwal
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
