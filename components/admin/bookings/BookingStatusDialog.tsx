'use client';

import { IconCheck, IconX } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/clipboard-copy';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { bookingScheduleInJakarta, formatBookingDate } from '@/lib/booking-display';
import { BOOKING_STATUS_BADGE_VARIANT, BookingStatus } from '@/lib/constants';
import { cn, formatPhone } from '@/lib/utils';
import type { Booking } from '@/types/model';

export default function BookingStatusDialog({
  booking,
  status,
  approving = false,
  onApprove,
  onCancel
}: {
  booking: Booking;
  status: BookingStatus;
  approving?: boolean;
  onApprove: () => void;
  onCancel: () => void;
}) {
  const schedules = bookingScheduleInJakarta(booking.details || []);
  const isHold = status === BookingStatus.HOLD;
  const isExpired =
    !!booking.holdExpiresAt && new Date(booking.holdExpiresAt).getTime() < Date.now();

  return (
    <DialogContent className="flex max-h-[90dvh] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-lg">
      <DialogHeader className="shrink-0 gap-3 border-b px-5 py-5 pr-12 text-left">
        <DialogTitle className="text-foreground text-lg">Ubah status pemesanan</DialogTitle>
        <DialogDescription asChild>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="font-mono text-xs break-all">
                {booking.invoice?.number || booking.id}
              </span>
              <CopyButton
                variant="ghost"
                size="sm"
                content={booking.invoice?.number || booking.id}
                aria-label="Salin nomor pemesanan"
              />
            </span>
            <Badge variant={BOOKING_STATUS_BADGE_VARIANT[status]}>
              {isHold
                ? 'Menunggu'
                : status === BookingStatus.CONFIRMED
                  ? 'Dikonfirmasi'
                  : 'Dibatalkan'}
            </Badge>
          </div>
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-muted-foreground text-xs">Pelanggan</dt>
            <dd className="text-sm font-semibold break-words">{booking.user?.name || '-'}</dd>
            {booking.user?.phone && (
              <dd className="text-muted-foreground text-xs">{formatPhone(booking.user.phone)}</dd>
            )}
          </div>
          <div className="space-y-1 sm:text-right">
            <dt className="text-muted-foreground text-xs">Total tagihan</dt>
            <dd className="text-lg font-semibold tabular-nums">
              Rp{' '}
              {new Intl.NumberFormat('id-ID').format(
                booking.totalPrice + (booking.processingFee || 0)
              )}
            </dd>
          </div>
        </dl>

        {isHold && booking.holdExpiresAt && (
          <div
            className={cn(
              'space-y-1 rounded-lg border px-3 py-2.5 text-xs',
              isExpired
                ? 'border-destructive/20 bg-destructive/5 text-destructive'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                {isExpired ? 'Sudah kedaluwarsa' : 'Batas pembayaran'}
              </span>
              <span className="tabular-nums">
                {formatBookingDate(booking.holdExpiresAt, 'DD MMM YYYY, HH:mm')} WIB
              </span>
            </div>
          </div>
        )}

        {schedules.length > 0 && (
          <section aria-label="Ringkasan jadwal" className="space-y-3">
            <h3 className="text-sm font-semibold">Jadwal lapangan</h3>
            <div className="divide-y overflow-hidden rounded-lg border px-3">
              {schedules.flatMap((date) =>
                date.courts.map((court) => (
                  <div key={`${date.date}-${court.id}`} className="space-y-2 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">{court.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatBookingDate(date.date, 'DD MMM YYYY')}
                      </p>
                    </div>
                    {court.ranges.map((range) => (
                      <div
                        key={range.start}
                        className="flex items-center justify-between gap-3 text-sm tabular-nums"
                      >
                        <span className="text-muted-foreground">
                          {range.start.slice(11)}–{range.end.slice(11)} WIB
                        </span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </section>
        )}
        {isHold && (
          <p className="text-muted-foreground text-xs leading-relaxed">
            Konfirmasi pemesanan setelah pembayaran diterima.
          </p>
        )}
      </div>

      <footer className="bg-muted/20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t p-4 sm:px-5">
        <DialogClose asChild>
          <Button variant="ghost" className="rounded-lg" disabled={approving}>
            Tutup
          </Button>
        </DialogClose>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="border-destructive/25 text-destructive hover:bg-destructive/5 hover:text-destructive rounded-lg shadow-none"
            onClick={onCancel}
            disabled={approving}
          >
            <IconX className="size-4" />
            Batalkan
          </Button>
          {isHold && (
            <Button className="rounded-lg" onClick={onApprove} loading={approving}>
              <IconCheck className="size-4" />
              Konfirmasi
            </Button>
          )}
        </div>
      </footer>
    </DialogContent>
  );
}
