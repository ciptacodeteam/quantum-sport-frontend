'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminCourtChangeOptionsApi, changeAdminCourtApi } from '@/api/admin/bookedCourt';
import { useHasRole } from '@/hooks/useRoleAccess';
import { useBookingClock } from '@/hooks/useBookingClock';
import { formatScheduleSlotTime } from '@/lib/admin-schedule-time';
import { isCourtWallSlotBookable } from '@/lib/booking-time-policy';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import type { Booking, BookingDetail } from '@/types/model';

export default function MoveCourtSection({
  detail,
  booking
}: {
  detail: BookingDetail;
  booking: Booking;
}) {
  const canWrite = useHasRole(['ADMIN', 'CASHIER']);
  const now = useBookingClock();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [error, setError] = useState('');
  const eligible =
    booking.status === 'CONFIRMED' &&
    (booking.purpose ?? 'REGULAR') === 'REGULAR' &&
    booking.invoice?.status === 'PAID' &&
    !!detail.slot &&
    isCourtWallSlotBookable(detail.slot.startAt, now);
  const options = useQuery({
    queryKey: ['admin', 'court-changes', detail.id, detail.slotId],
    queryFn: ({ signal }) => getAdminCourtChangeOptionsApi(detail.id, signal),
    enabled: canWrite && eligible && open,
    staleTime: 0,
    retry: false,
    refetchInterval: open && eligible ? 10000 : false
  });
  const target = options.data?.find((option) => option.slotId === targetId);
  const refresh = () =>
    Promise.all(
      [
        ['admin', 'schedule'],
        ['admin', 'bookings'],
        ['admin', 'courts'],
        ['admin', 'booked-courts'],
        ['admin', 'coaching'],
        ['admin', 'booked-coaches'],
        ['admin', 'booked-ballboys'],
        ['courts'],
        ['invoice'],
        ['invoices']
      ].map((queryKey) => client.invalidateQueries({ queryKey }))
    );
  const move = useMutation({
    mutationFn: () => changeAdminCourtApi(detail.id, detail.slotId, targetId),
    onSuccess: async () => {
      toast.success(
        `Booking dipindahkan ke ${target?.courtName ?? 'court tujuan'}. Tanggal dan jam tetap.`
      );
      setOpen(false);
      setTargetId('');
      await refresh();
    },
    onError: async (failure) => {
      setError(getApiErrorMessage(failure, 'Court belum dapat dipindahkan.'));
      setTargetId('');
      await Promise.all([refresh(), options.refetch()]);
    }
  });
  if (!canWrite) return null;
  return (
    <section aria-label="Pindah court" className="space-y-3 rounded-xl border p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Pindah court</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            {detail.court?.name ?? detail.slot?.court?.name ?? 'Court saat ini'} ·{' '}
            {formatScheduleSlotTime(detail.slot?.startAt, 'DD MMM YYYY HH:mm')}–
            {formatScheduleSlotTime(detail.slot?.endAt)} WIB. Tanggal, jam, dan biaya tetap.
          </p>
        </div>
        {!open && (
          <Button
            variant="outline"
            disabled={!eligible}
            onClick={() => {
              setOpen(true);
              setError('');
            }}
          >
            <ArrowRightLeft className="size-4" />
            Pindah court
          </Button>
        )}
      </div>
      {!eligible && (
        <p className="text-muted-foreground text-xs">
          Pindah court tersedia untuk booking reguler yang terkonfirmasi dan lunas, sebelum 30 menit setelah jam mulai.
        </p>
      )}
      {open && eligible && (
        <>
          {options.isPending ? (
            <div role="status" className="flex items-center justify-center gap-2 py-4 text-sm">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              Mencari court kosong...
            </div>
          ) : options.isError ? (
            <div role="alert" className="space-y-2 text-sm text-red-700">
              <p>{getApiErrorMessage(options.error, 'Court kosong belum dapat dimuat.')}</p>
              <Button variant="outline" onClick={() => void options.refetch()}>
                Coba lagi
              </Button>
            </div>
          ) : !options.data?.length ? (
            <p role="status" className="text-muted-foreground text-sm">
              Tidak ada court kosong dengan tanggal, jam, olahraga, dan tarif yang sama di cabang
              ini.
            </p>
          ) : (
            <fieldset disabled={move.isPending} className="grid gap-2 sm:grid-cols-2">
              <legend className="mb-2 text-sm font-medium">Pilih court tujuan</legend>
              {options.data.map((option) => (
                <label
                  key={option.slotId}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm"
                >
                  <input
                    type="radio"
                    name={`move-court-${detail.id}`}
                    checked={targetId === option.slotId}
                    onChange={() => {
                      setTargetId(option.slotId);
                      setError('');
                    }}
                  />
                  {option.courtName}
                </label>
              ))}
            </fieldset>
          )}
          {target && (
            <p className="text-sm">
              Konfirmasi pindah ke <strong>{target.courtName}</strong> pada jam yang sama?
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              disabled={move.isPending}
              onClick={() => {
                setOpen(false);
                setTargetId('');
              }}
            >
              Batal
            </Button>
            <Button
              disabled={!target || options.isFetching || options.isError || move.isPending}
              onClick={() => move.mutate()}
            >
              {move.isPending ? 'Memindahkan...' : 'Konfirmasi pindah court'}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
