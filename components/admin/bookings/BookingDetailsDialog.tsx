'use client';

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
import { getBallboyCourtName } from '@/lib/ballboy-utils';
import { formatBookingDate } from '@/lib/booking-display';
import { BOOKING_STATUS_BADGE_VARIANT, BookingStatus } from '@/lib/constants';
import { formatPhone } from '@/lib/utils';
import type { Booking, BookingDetail } from '@/types/model';
import { RescheduleCourtDialog, type BookingDetailWithSlot } from './RescheduleCourtDialog';

const currency = (value: number) => `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
const time = (value: Date | string) => formatBookingDate(value, 'HH:mm');

export default function BookingDetailsDialog({
  booking,
  status,
  onRescheduleSuccess
}: {
  booking: Booking;
  status: BookingStatus;
  onRescheduleSuccess: () => void;
}) {
  const groups = new Map<string, { name: string; date: string; details: BookingDetail[] }>();
  for (const detail of booking.details || []) {
    const date = detail.slot ? formatBookingDate(detail.slot.startAt, 'YYYY-MM-DD') : '';
    const key = `${detail.court?.id || detail.courtId || detail.court?.name}-${date}`;
    if (!groups.has(key))
      groups.set(key, { name: detail.court?.name || 'Lapangan', date, details: [] });
    groups.get(key)!.details.push(detail);
  }
  const courtTotal = booking.details?.reduce((sum, detail) => sum + detail.price, 0) || 0;
  const otherCharges = booking.totalPrice - courtTotal;
  const fee = booking.processingFee || 0;
  const statusLabel =
    status === BookingStatus.HOLD
      ? 'Menunggu'
      : status === BookingStatus.CONFIRMED
        ? 'Dikonfirmasi'
        : 'Dibatalkan';

  return (
    <DialogContent className="flex max-h-[90dvh] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-2xl">
      <DialogHeader className="shrink-0 gap-3 border-b px-5 py-5 pr-12 text-left sm:px-6">
        <DialogTitle className="text-foreground text-lg">Detail pemesanan</DialogTitle>
        <DialogDescription asChild>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="font-mono text-xs break-all">
                {booking.invoice?.number || booking.id}
              </span>
              <CopyButton
                size="sm"
                variant="ghost"
                content={booking.invoice?.number || booking.id}
                aria-label="Salin nomor pemesanan"
              />
            </span>
            <Badge variant={BOOKING_STATUS_BADGE_VARIANT[status]}>{statusLabel}</Badge>
            {booking.membershipUserId ? (
              <Badge variant="success">
                Membership · {booking.membershipSessionsUsed ?? 0} sesi
              </Badge>
            ) : null}
          </div>
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-muted-foreground text-xs">Pelanggan</dt>
            <dd className="text-sm font-semibold break-words">{booking.user?.name || '-'}</dd>
            {booking.user?.phone && (
              <dd className="text-muted-foreground text-xs">{formatPhone(booking.user.phone)}</dd>
            )}
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground text-xs">Dibuat pada</dt>
            <dd className="text-sm tabular-nums">
              {formatBookingDate(booking.createdAt, 'DD MMM YYYY, HH:mm')} WIB
            </dd>
            {booking.cashier && (
              <dd className="text-muted-foreground text-xs">Kasir: {booking.cashier.name}</dd>
            )}
          </div>
        </dl>

        {status === BookingStatus.HOLD && booking.holdExpiresAt && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            <span className="font-medium">Batas pembayaran</span>
            <span className="tabular-nums">
              {formatBookingDate(booking.holdExpiresAt, 'DD MMM YYYY, HH:mm')} WIB
            </span>
          </div>
        )}

        {groups.size > 0 && (
          <section aria-label="Jadwal lapangan" className="space-y-3">
            <h3 className="text-sm font-semibold">Jadwal lapangan</h3>
            {[...groups.entries()].map(([key, group]) => (
              <div key={key} className="overflow-hidden rounded-lg border">
                <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5">
                  <p className="text-sm font-medium">{group.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {group.date ? formatBookingDate(group.date, 'DD MMM YYYY') : '-'}
                  </p>
                </div>
                <div className="divide-y">
                  {[...group.details]
                    .sort((a, b) =>
                      String(a.slot?.startAt || '').localeCompare(String(b.slot?.startAt || ''))
                    )
                    .map((detail) => (
                      <div
                        key={detail.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"
                      >
                        <p className="text-sm font-medium tabular-nums">
                          {detail.slot
                            ? `${time(detail.slot.startAt)}–${time(detail.slot.endAt)} WIB`
                            : 'Waktu belum tersedia'}
                        </p>
                        <div className="ml-auto flex items-center gap-3">
                          <span className="text-sm tabular-nums">{currency(detail.price)}</span>
                          {detail.slot && status !== BookingStatus.CANCELLED && (
                            <RescheduleCourtDialog
                              detail={detail as BookingDetailWithSlot}
                              canReschedule={
                                status === BookingStatus.CONFIRMED &&
                                (!booking.invoice || booking.invoice.status === 'PAID')
                              }
                              membershipCovered={
                                (booking.membershipSessionsUsed ?? 0) > 0 &&
                                (booking.courtDiscountPrice === 0 || detail.discountPrice === 0)
                              }
                              onSuccess={onRescheduleSuccess}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {!!booking.ballboys?.length && (
          <section className="space-y-2" aria-label="Ballboy">
            <h3 className="text-sm font-semibold">Ballboy</h3>
            <div className="divide-y rounded-lg border px-3">
              {booking.ballboys.map((ballboy) => (
                <div
                  key={ballboy.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">{ballboy.slot?.staff?.name || 'Ballboy'}</p>
                    <p className="text-muted-foreground text-xs">
                      {getBallboyCourtName(ballboy, booking.details)}
                    </p>
                    {(ballboy.slot?.staff?.phone || ballboy.slot?.staff?.email) && (
                      <details className="text-muted-foreground text-xs">
                        <summary className="cursor-pointer">Kontak ballboy</summary>
                        <div className="mt-1 space-y-1 break-all">
                          {ballboy.slot.staff.phone && (
                            <p>{formatPhone(ballboy.slot.staff.phone)}</p>
                          )}
                          {ballboy.slot.staff.email && <p>{ballboy.slot.staff.email}</p>}
                        </div>
                      </details>
                    )}
                  </div>
                  <div className="ml-auto space-y-1 text-right">
                    <p className="text-muted-foreground text-xs tabular-nums">
                      {ballboy.slot
                        ? `${time(ballboy.slot.startAt)}–${time(ballboy.slot.endAt)} WIB`
                        : '-'}
                    </p>
                    <p className="text-xs tabular-nums">{currency(ballboy.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {booking.adminNote && (
          <section className="space-y-1.5">
            <h3 className="text-muted-foreground text-xs font-medium">Catatan admin</h3>
            <p className="bg-muted/40 rounded-lg px-3 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap">
              {booking.adminNote}
            </p>
          </section>
        )}
        {booking.cancellationReason && (
          <section className="border-destructive/20 bg-destructive/5 space-y-1.5 rounded-lg border p-3">
            <h3 className="text-destructive text-xs font-medium">Alasan pembatalan</h3>
            <p className="text-sm leading-relaxed break-words">{booking.cancellationReason}</p>
          </section>
        )}

        <dl className="space-y-2.5 border-t pt-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Biaya lapangan</dt>
            <dd className="tabular-nums">{currency(courtTotal)}</dd>
          </div>
          {otherCharges !== 0 && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Layanan & penyesuaian</dt>
              <dd className="tabular-nums">{currency(otherCharges)}</dd>
            </div>
          )}
          {fee > 0 && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Biaya administrasi</dt>
              <dd className="tabular-nums">{currency(fee)}</dd>
            </div>
          )}
        </dl>
      </div>
      <footer className="bg-muted/20 flex shrink-0 items-center justify-between gap-4 border-t px-5 py-4 sm:px-6">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Total tagihan</p>
          <p className="text-xl font-semibold tracking-tight tabular-nums">
            {currency(booking.totalPrice + fee)}
          </p>
        </div>
        <DialogClose asChild>
          <Button variant="outline" className="rounded-lg px-5 shadow-none">
            Tutup
          </Button>
        </DialogClose>
      </footer>
    </DialogContent>
  );
}
