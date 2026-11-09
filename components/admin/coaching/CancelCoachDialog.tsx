'use client';
import { CircleX } from 'lucide-react';
import { useId, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coachingApi } from '@/api/admin/coaching';
import { useHasRole } from '@/hooks/useRoleAccess';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { useBookingClock } from '@/hooks/useBookingClock';
import { isCourtWallSlotBookable } from '@/lib/booking-time-policy';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatScheduleSlotTime } from '@/lib/admin-schedule-time';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function CancelCoachDialog({
  bookingCoachId,
  currentName,
  startAt,
  status,
  kind = 'COACH',
  iconOnly = false
}: {
  bookingCoachId: string;
  currentName: string;
  startAt: string;
  status?: string;
  iconOnly?: boolean;
  kind?: 'COACH' | 'BALLBOY';
}) {
  const isSuperAdmin = useHasRole(
    kind === 'BALLBOY' ? ['SUPER_ADMIN', 'ADMIN', 'CASHIER'] : ['SUPER_ADMIN', 'CASHIER']
  );
  const label = kind === 'COACH' ? 'Coach' : 'Ballboy';
  const { branchId } = useAdminCourtSports();
  const now = useBookingClock();
  const canCancel = isSuperAdmin && status === 'CONFIRMED' && isCourtWallSlotBookable(startAt, now);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const id = useId();
  const client = useQueryClient();
  const preview = useQuery({
    queryKey: ['admin', 'coaching', branchId, 'cancellation', kind, bookingCoachId],
    queryFn: () =>
      kind === 'COACH'
        ? coachingApi.cancellation(bookingCoachId)
        : coachingApi.ballboyCancellation(bookingCoachId),
    enabled: open && canCancel,
    staleTime: 0
  });
  const cancel = useMutation({
    mutationFn: () =>
      (kind === 'COACH' ? coachingApi.cancelCoach : coachingApi.cancelBallboy)(bookingCoachId, {
        expectedSlotId: preview.data!.current.slotId,
        reason: reason.trim()
      }),
    onSuccess: (result) => {
      setOpen(false);
      setReason('');
      for (const queryKey of [
        ['admin', 'coaching'],
        ['admin', 'analytics'],
        ['admin', 'schedule'],
        ['admin', 'bookings'],
        ['admin', 'booked-coaches'],
        ['admin', 'booked-ballboys'],
        ['admin', 'courts'],
        ['admin', 'invoices'],
        ['invoice']
      ])
        void client.invalidateQueries({ queryKey });
      toast.success(
        result.refundRequired
          ? `${label} dibatalkan. Tinjau refund Rp ${result.price.toLocaleString('id-ID')} secara manual.`
          : `${label} berhasil dibatalkan.`
      );
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, `${label} belum dapat dibatalkan.`));
      void preview.refetch();
    }
  });
  if (!canCancel) return null;
  return (
    <>
      <Button
        variant={iconOnly ? 'outline' : 'destructive'}
        className={
          iconOnly ? 'text-destructive hover:bg-destructive/10 hover:text-destructive' : undefined
        }
        size={iconOnly ? 'icon-sm' : 'sm'}
        title={`Batalkan ${label} ${currentName}`}
        aria-label={`Batalkan ${label} ${currentName}`}
        onClick={() => {
          setReason('');
          setOpen(true);
        }}
      >
        {iconOnly ? <CircleX aria-hidden="true" /> : `Batalkan ${label}`}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!cancel.isPending) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Batalkan {label}</DialogTitle>
            <DialogDescription>
              {label} akan dibatalkan dan slotnya dilepas. Booking lapangan dan layanan lain tetap
              aktif.
            </DialogDescription>
          </DialogHeader>
          {preview.isPending ? (
            <p className="text-muted-foreground py-3 text-sm">
              Memuat detail {label.toLowerCase()}...
            </p>
          ) : preview.isError ? (
            <div role="alert" className="space-y-3">
              <p>{getApiErrorMessage(preview.error, 'Detail pembatalan belum dapat dimuat.')}</p>
              <Button variant="outline" onClick={() => void preview.refetch()}>
                Coba lagi
              </Button>
            </div>
          ) : (
            preview.data && (
              <div className="space-y-4">
                <div className="bg-muted/40 space-y-1 rounded-lg border p-4 text-sm">
                  <p className="font-semibold">{preview.data.current.name}</p>
                  <p>
                    {formatScheduleSlotTime(preview.data.current.startAt, 'DD MMM YYYY')} ·{' '}
                    {formatScheduleSlotTime(preview.data.current.startAt)}–
                    {formatScheduleSlotTime(preview.data.current.endAt)} WIB
                  </p>
                  <p className="tabular-nums">
                    Rp {preview.data.current.price.toLocaleString('id-ID')}
                  </p>
                  {preview.data.invoiceNumber && (
                    <p className="text-muted-foreground text-xs">
                      Invoice {preview.data.invoiceNumber}
                    </p>
                  )}
                </div>
                <p className="rounded-lg border p-3 text-sm">
                  {preview.data.refundRequired
                    ? `Pembayaran sudah lunas. Tinjau refund biaya ${label.toLowerCase()} Rp ${preview.data.current.price.toLocaleString('id-ID')} secara manual. Pembatalan ini tidak mengembalikan dana otomatis dan tidak mengubah nominal invoice.`
                    : 'Riwayat invoice tetap disimpan. Pembatalan ini tidak mengirim pengembalian dana otomatis.'}
                </p>
                <div className="space-y-2">
                  <Label htmlFor={`${id}-reason`}>Alasan pembatalan</Label>
                  <Textarea
                    id={`${id}-reason`}
                    required
                    maxLength={500}
                    value={reason}
                    disabled={cancel.isPending}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={`Contoh: pelanggan membatalkan sesi ${label.toLowerCase()}`}
                  />
                </div>
              </div>
            )
          )}
          <DialogFooter>
            <Button variant="outline" disabled={cancel.isPending} onClick={() => setOpen(false)}>
              Kembali
            </Button>
            <Button
              variant="destructive"
              disabled={
                !preview.data ||
                preview.isError ||
                preview.isFetching ||
                cancel.isPending ||
                !reason.trim() ||
                !canCancel
              }
              onClick={() => cancel.mutate()}
            >
              {cancel.isPending ? 'Membatalkan...' : `Konfirmasi Batalkan ${label}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
