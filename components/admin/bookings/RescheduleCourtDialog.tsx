'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { rescheduleBookedCourtApi } from '@/api/admin/bookedCourt';
import { formatSlotTime } from '@/lib/time-utils';
import { cn } from '@/lib/utils';
import { adminCourtsWithSlotsQueryOptions } from '@/queries/admin/court';
import type { BookingDetail, Court, Slot } from '@/types/model';

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

export function RescheduleCourtDialog({
  detail,
  canReschedule,
  onSuccess
}: RescheduleCourtDialogProps) {
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
    mutationFn: (slotId: string) => rescheduleBookedCourtApi(detail.id, slotId),
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
      <DialogContent className="flex max-h-[90vh] !max-w-2xl flex-col">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg">Reschedule Slot Lapangan</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="space-y-4">
            {/* Current Booking Info - Compact */}
            <div className="bg-muted/30 rounded-lg border p-3">
              <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
                Jadwal Saat Ini
              </p>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {detail.court?.name || detail.courtId || '-'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {detail.slot?.startAt ? dayjs(detail.slot.startAt).format('DD MMM YYYY') : '-'}{' '}
                    •{' '}
                    {detail.slot
                      ? `${formatSlotTime(detail.slot.startAt)} - ${formatSlotTime(detail.slot.endAt)}`
                      : '-'}
                  </p>
                </div>
                <p className="text-primary text-sm font-semibold whitespace-nowrap">
                  {formatCurrency(detail.price)}
                </p>
              </div>
            </div>

            <div className="grid items-start gap-6 sm:grid-cols-2">
              {/* Date Selection - Compact */}
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
                  Pilih Tanggal
                </p>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => dayjs(date).isBefore(dayjs(), 'day')}
                  className="mx-auto w-full max-w-md rounded-md"
                />
              </div>
              <div>
                {isFetching ? (
                  <div className="bg-muted/30 text-muted-foreground rounded-md border p-3 text-center text-xs">
                    Memuat ketersediaan...
                  </div>
                ) : slotsForSelectedDate.length === 0 ? (
                  <div className="bg-muted/30 text-muted-foreground rounded-md border p-3 text-center text-xs">
                    Tidak ada slot tersedia pada tanggal ini.
                  </div>
                ) : (
                  <>
                    {/* Court Selection - Compact */}
                    <div>
                      <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
                        Pilih Lapangan
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {data?.courts.map((court) => {
                          const courtSlots = slotsByCourt.get(court.id) || [];
                          const upcomingSlots = courtSlots.filter(
                            (slot) =>
                              dayjs(slot.startAt).isAfter(dayjs()) && slot.id !== currentSlotId
                          );
                          const availableCount = upcomingSlots.filter(
                            (slot) => slot.isAvailable
                          ).length;
                          const isDisabled = upcomingSlots.length === 0;

                          return (
                            <button
                              key={court.id}
                              type="button"
                              onClick={() => !isDisabled && setSelectedCourtId(court.id)}
                              className={cn(
                                'shrink-0 rounded-md border px-3 py-2 text-left whitespace-nowrap transition',
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
                  </>
                )}
              </div>
            </div>
            {/* Availability Section */}
            <div className="space-y-3">
              <div className="mb-4 flex items-center justify-between">
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
                <div className="bg-muted/30 text-muted-foreground rounded-md border p-3 text-center text-xs">
                  Memuat ketersediaan...
                </div>
              ) : slotsForSelectedDate.length === 0 ? (
                <div className="bg-muted/30 text-muted-foreground rounded-md border p-3 text-center text-xs">
                  Tidak ada slot tersedia pada tanggal ini.
                </div>
              ) : (
                <>
                  {/* Slot Selection - Compact with scroll */}
                  {selectedCourtId && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-muted-foreground text-xs font-semibold uppercase">
                          Pilih Slot
                        </p>
                        <span className="text-muted-foreground text-xs">
                          {selectedCourtSlots.length} slot
                        </span>
                      </div>
                      {selectedCourtSlots.length === 0 ? (
                        <div className="bg-muted/20 text-muted-foreground rounded-md border p-3 text-center text-xs">
                          Tidak ada slot untuk lapangan ini.
                        </div>
                      ) : (
                        <div className="max-h-[500px] overflow-y-auto rounded-md border p-2">
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
                                    'flex flex-col rounded-md border p-2 text-left text-xs transition',
                                    isSelected && 'border-primary bg-primary/5 shadow-sm',
                                    !isSelectable && 'bg-muted/40 cursor-not-allowed opacity-50'
                                  )}
                                >
                                  <span className="text-sm font-semibold">
                                    {formatSlotTime(slot.startAt)}
                                  </span>
                                  <span className="text-muted-foreground mt-0.5 text-xs">
                                    {formatCurrency(slot.price || 0)}
                                  </span>
                                  {!slot.isAvailable && (
                                    <span className="mt-0.5 text-[9px] text-amber-600">Booked</span>
                                  )}
                                  {isPast && (
                                    <span className="mt-0.5 text-[9px] text-amber-600">Past</span>
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
        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={mutation.isPending}
            size="sm"
          >
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
