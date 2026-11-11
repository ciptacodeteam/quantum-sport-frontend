'use client';

import { useId, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleX } from 'lucide-react';
import { toast } from 'sonner';
import { cancelBookingApi } from '@/api/admin/booking';
import { useHasRole } from '@/hooks/useRoleAccess';
import { getApiErrorMessage } from '@/lib/api-error';
import { BookingStatus } from '@/lib/constants';
import type { Booking } from '@/types/model';
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

export default function CancelBookingDialog({
  booking,
  onCancelled
}: {
  booking: Booking;
  onCancelled: () => void;
}) {
  const canCancel = useHasRole(['ADMIN', 'SUPER_ADMIN']);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const id = useId();
  const client = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => cancelBookingApi(booking.id, reason.trim()),
    onSuccess: async () => {
      setOpen(false);
      onCancelled();
      toast.success('Seluruh pemesanan berhasil dibatalkan.');
      await Promise.all(
        [
          ['admin', 'bookings'],
          ['admin', 'schedule'],
          ['admin', 'courts'],
          ['admin', 'booked-courts'],
          ['admin', 'coaching'],
          ['admin', 'booked-coaches'],
          ['admin', 'booked-ballboys'],
          ['admin', 'analytics'],
          ['admin', 'inhouse'],
          ['admin', 'invoices'],
          ['admin', 'customers'],
          ['invoice'],
          ['invoices'],
          ['courts']
        ].map((queryKey) => client.invalidateQueries({ queryKey }))
      );
    }
  });
  if (!canCancel || booking.status === BookingStatus.CANCELLED) return null;
  return (
    <>
      <Button
        variant="outline"
        className="text-destructive hover:bg-destructive/5 hover:text-destructive"
        onClick={() => {
          cancel.reset();
          setReason('');
          setOpen(true);
        }}
      >
        <CircleX className="size-4" /> Batalkan pemesanan
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!cancel.isPending) setOpen(value);
        }}
      >
        <DialogContent
          className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
          showCloseButton={!cancel.isPending}
          onEscapeKeyDown={(event) => {
            if (cancel.isPending) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (cancel.isPending) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Batalkan seluruh pemesanan?</DialogTitle>
            <DialogDescription>
              Seluruh jadwal lapangan, coach, dan ballboy yang terkait akan dibatalkan. Ini berlaku
              untuk semua jam dalam pemesanan, termasuk layanan dengan invoice terpisah.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 space-y-1 rounded-lg border p-3 text-sm">
            <p className="font-semibold break-all">{booking.invoice?.number || booking.id}</p>
            <p className="text-muted-foreground">
              {booking.user?.name || 'Pemesanan lapangan'} · {booking.details?.length || 0} slot
              lapangan
            </p>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Slot akan dilepas dan kuota membership yang terpakai dikembalikan sesuai aturan
            pembatalan. Pembayaran lunas perlu ditinjau untuk refund secara manual; pembatalan tidak
            mengirim pengembalian dana otomatis.
          </p>
          <div className="space-y-2">
            <Label htmlFor={`${id}-reason`}>
              Alasan pembatalan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id={`${id}-reason`}
              required
              maxLength={500}
              value={reason}
              disabled={cancel.isPending}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Contoh: pelanggan membatalkan seluruh jadwal"
            />
          </div>
          {cancel.isError && (
            <p role="alert" className="text-destructive text-sm">
              {getApiErrorMessage(
                cancel.error,
                'Pemesanan belum dapat dibatalkan. Silakan coba lagi.'
              )}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={cancel.isPending} onClick={() => setOpen(false)}>
              Kembali
            </Button>
            <Button
              variant="destructive"
              disabled={cancel.isPending || !reason.trim() || !canCancel}
              onClick={() => cancel.mutate()}
            >
              {cancel.isPending ? 'Membatalkan…' : 'Ya, batalkan seluruh pemesanan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
