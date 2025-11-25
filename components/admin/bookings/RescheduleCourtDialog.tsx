'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { rescheduleBookedCourtApi } from '@/api/admin/bookedCourt';
import { adminCourtsWithSlotsQueryOptions } from '@/queries/admin/court';
import type { BookingDetail, Court, Slot } from '@/types/model';
import { formatSlotTime } from '@/lib/time-utils';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type BookingDetailWithSlot = BookingDetail & {
  slot?: Slot;
  court?: Court;
};

type RescheduleCourtDialogProps = {
  detail: BookingDetailWithSlot;
  canReschedule: boolean;
  onSuccess?: () => void;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);

export function RescheduleCourtDialog({ detail, canReschedule, onSuccess }: RescheduleCourtDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(
    detail.slot?.court?.id ?? detail.slot?.courtId ?? (detail as any)?.courtId ?? null
  );

  const defaultDate = detail.slot?.startAt ? new Date(detail.slot.startAt) : new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);

  const selectedDateString = dayjs(selectedDate).format('YYYY-MM-DD');
  const currentSlotId = detail.slot?.id ?? (detail as any)?.slotId;

  const { data, isFetching } = useQuery({
    ...adminCourtsWithSlotsQueryOptions(selectedDateString),
    enabled: open && !!selectedDateString
  });

  const toDateKey = useCallback((value: string | Date) => dayjs(value).format('YYYY-MM-DD'), []);

  const slotsForSelectedDate = useMemo(() => {
    if (!data) return [];
    return data.slots.filter((slot) => toDateKey(slot.startAt) === selectedDateString);
  }, [data, selectedDateString, toDateKey]);

  const slotsByCourt = useMemo(() => {
    const map = new Map<string, Slot[]>();
    slotsForSelectedDate.forEach((slot) => {
      const courtId = slot.courtId ?? slot.court?.id;
      if (!courtId) return;
      if (!map.has(courtId)) {
        map.set(courtId, []);
      }
      map.get(courtId)!.push(slot);
    });
    map.forEach((slots) =>
      slots.sort((a, b) => dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf())
    );
    return map;
  }, [slotsForSelectedDate]);

  const selectedCourtSlots = useMemo(() => {
    if (!selectedCourtId) return [];
    return slotsByCourt.get(selectedCourtId) ?? [];
  }, [selectedCourtId, slotsByCourt]);

  useEffect(() => {
    if (selectedCourtId && slotsByCourt.has(selectedCourtId)) return;
    const fallback =
      detail.slot?.court?.id ??
      detail.slot?.courtId ??
      (detail as any)?.courtId ??
      data?.courts.find((court) => slotsByCourt.has(court.id))?.id ??
      null;
    setSelectedCourtId(fallback ?? null);
  }, [
    selectedCourtId,
    slotsByCourt,
    detail.slot?.court?.id,
    detail.slot?.courtId,
    (detail as any)?.courtId,
    data?.courts
  ]);

  const resetState = useCallback(() => {
    setSelectedSlotId(null);
    if (detail.slot?.startAt) {
      setSelectedDate(new Date(detail.slot.startAt));
    }
    setSelectedCourtId(
      detail.slot?.court?.id ?? detail.slot?.courtId ?? (detail as any)?.courtId ?? null
    );
  }, [detail.slot?.startAt, detail.slot?.court?.id, detail.slot?.courtId, detail]);

  useEffect(() => {
    setSelectedSlotId(null);
  }, [selectedDateString, selectedCourtId]);

  const mutation = useMutation({
    mutationFn: (slotId: string) =>
      rescheduleBookedCourtApi(detail.id, slotId),
    onSuccess: () => {
      toast.success('Slot berhasil dijadwalkan ulang');
      // Invalidate bookings queries to refresh the table
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings', 'ongoing-schedule'] });
      setOpen(false);
      resetState();
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error?.message || 'Gagal menjadwalkan ulang slot');
    }
  });

  const handleConfirm = () => {
    if (!selectedSlotId) return;
    mutation.mutate(selectedSlotId);
  };

  const dialogTrigger = (
    <Button size="sm" variant="outline" disabled={!canReschedule}>
      Reschedule
    </Button>
  );

  if (!canReschedule) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{dialogTrigger}</TooltipTrigger>
        <TooltipContent>Reschedule hanya tersedia maksimal H-3 sebelum jadwal</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetState();
        }
      }}
    >
      <DialogTrigger asChild>{dialogTrigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg">Reschedule Slot Lapangan</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="space-y-4">
            {/* Current Booking Info - Compact */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Jadwal Saat Ini</p>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{detail.court?.name || detail.courtId || '-'}</p>
                  <p className="text-xs text-muted-foreground">
                    {detail.slot?.startAt ? dayjs(detail.slot.startAt).format('DD MMM YYYY') : '-'} •{' '}
                    {detail.slot
                      ? `${formatSlotTime(detail.slot.startAt)} - ${formatSlotTime(detail.slot.endAt)}`
                      : '-'}
                  </p>
                </div>
                <p className="text-sm font-semibold text-primary whitespace-nowrap">{formatCurrency(detail.price)}</p>
              </div>
            </div>

            {/* Date Selection - Compact */}
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Pilih Tanggal</p>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => dayjs(date).isBefore(dayjs(), 'day')}
                className="rounded-md"
              />
            </div>
            {/* Availability Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    Ketersediaan • {dayjs(selectedDate).format('DD MMM YYYY')}
                  </p>
                </div>
                {selectedSlotId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSlotId(null)}
                    className="h-7 text-xs"
                  >
                    Reset
                  </Button>
                )}
              </div>

              {isFetching ? (
                <div className="rounded-md border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
                  Memuat ketersediaan...
                </div>
              ) : slotsForSelectedDate.length === 0 ? (
                <div className="rounded-md border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
                  Tidak ada slot tersedia pada tanggal ini.
                </div>
              ) : (
                <>
                  {/* Court Selection - Compact */}
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Pilih Lapangan</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {data?.courts.map((court) => {
                        const courtSlots = slotsByCourt.get(court.id) || [];
                        const upcomingSlots = courtSlots.filter(
                          (slot) => dayjs(slot.startAt).isAfter(dayjs()) && slot.id !== currentSlotId
                        );
                        const availableCount = upcomingSlots.filter((slot) => slot.isAvailable).length;
                        const isDisabled = upcomingSlots.length === 0;

                        return (
                          <button
                            key={court.id}
                            type="button"
                            onClick={() => !isDisabled && setSelectedCourtId(court.id)}
                            className={cn(
                              'rounded-md border px-3 py-2 text-left transition whitespace-nowrap shrink-0',
                              selectedCourtId === court.id
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'hover:border-primary/40',
                              isDisabled && 'cursor-not-allowed opacity-50'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold">{court.name}</p>
                              <Badge variant="outline" className="text-[10px]">
                                {availableCount}/{courtSlots.length}
                              </Badge>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slot Selection - Compact with scroll */}
                  {selectedCourtId && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Pilih Slot</p>
                        <span className="text-xs text-muted-foreground">
                          {selectedCourtSlots.length} slot
                        </span>
                      </div>
                      {selectedCourtSlots.length === 0 ? (
                        <div className="rounded-md border bg-muted/20 p-3 text-center text-xs text-muted-foreground">
                          Tidak ada slot untuk lapangan ini.
                        </div>
                      ) : (
                        <div className="max-h-[200px] overflow-y-auto rounded-md border p-2">
                          <div className="grid grid-cols-3 gap-1.5">
                            {selectedCourtSlots.map((slot) => {
                              const isPast = dayjs(slot.startAt).isBefore(dayjs());
                              const isSelectable =
                                slot.id !== currentSlotId && slot.isAvailable && !isPast;
                              const isSelected = selectedSlotId === slot.id;

                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => isSelectable && setSelectedSlotId(slot.id)}
                                  disabled={!isSelectable}
                                  className={cn(
                                    'flex flex-col rounded-md border p-2 text-left transition text-xs',
                                    isSelected && 'border-primary bg-primary/5 shadow-sm',
                                    !isSelectable && 'cursor-not-allowed opacity-50 bg-muted/40'
                                  )}
                                >
                                  <span className="font-semibold text-[11px]">
                                    {formatSlotTime(slot.startAt)}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground mt-0.5">
                                    {formatCurrency(slot.price || 0)}
                                  </span>
                                  {!slot.isAvailable && (
                                    <span className="text-[9px] text-amber-600 mt-0.5">Booked</span>
                                  )}
                                  {isPast && (
                                    <span className="text-[9px] text-amber-600 mt-0.5">Past</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Fixed Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending} size="sm">
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSlotId || mutation.isPending}
            loading={mutation.isPending}
            size="sm"
          >
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


