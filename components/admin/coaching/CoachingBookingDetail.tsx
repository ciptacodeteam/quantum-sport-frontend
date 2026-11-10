'use client';
import Link from 'next/link';
import CoachClubSettlementToggle from './CoachClubSettlementToggle';
import { ExternalLink } from 'lucide-react';
import type { CoachingBooking } from '@/api/admin/coaching';
import { formatScheduleSlotTime } from '@/lib/admin-schedule-time';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
const currency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;
export default function CoachingBookingDetail({
  booking,
  kind,
  onClose
}: {
  booking?: CoachingBooking;
  kind: 'COACH' | 'BALLBOY';
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!booking}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Detail Pemesanan {kind === 'COACH' ? 'Coach' : 'Ballboy'}</DialogTitle>
          <DialogDescription>Informasi layanan, pelanggan, dan pembayaran.</DialogDescription>
        </DialogHeader>
        {booking && (
          <div className="space-y-5">
            <dl className="[&_dt]:text-muted-foreground grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 [&_dd]:mt-1 [&_dd]:font-medium">
              <div>
                <dt>{kind === 'COACH' ? 'Coach' : 'Ballboy'}</dt>
                <dd>{booking.name}</dd>
              </div>
              {kind === 'COACH' && (
                <div>
                  <dt>Grup coaching</dt>
                  <dd>
                    {booking.isInHouse
                      ? 'Coach In-house'
                      : booking.coachingGroupName || 'Coach Independen'}
                  </dd>
                </div>
              )}
              <div>
                <dt>Pelanggan</dt>
                <dd>{booking.customer}</dd>
              </div>
              <div>
                <dt>Nomor WhatsApp</dt>
                <dd>{booking.phone || 'Belum tersedia'}</dd>
              </div>
              <div>
                <dt>Tanggal bermain</dt>
                <dd>{formatScheduleSlotTime(booking.startAt, 'DD MMM YYYY')}</dd>
              </div>
              <div>
                <dt>Jam layanan (WIB)</dt>
                <dd>
                  {formatScheduleSlotTime(booking.startAt)} –{' '}
                  {formatScheduleSlotTime(booking.endAt)}
                </dd>
              </div>
              <div>
                <dt>Lapangan</dt>
                <dd>{booking.court || 'Belum tersedia'}</dd>
              </div>
              <div>
                <dt>Harga layanan</dt>
                <dd>{currency(booking.price)}</dd>
              </div>
              <div>
                <dt>Status pemesanan</dt>
                <dd>
                  <Badge variant={booking.status === 'CONFIRMED' ? 'lightSuccess' : 'secondary'}>
                    {booking.status === 'CONFIRMED'
                      ? 'Dikonfirmasi'
                      : booking.status === 'HOLD'
                        ? 'Menunggu pembayaran'
                        : 'Dibatalkan'}
                  </Badge>
                </dd>
              </div>
            </dl>
            {kind === 'COACH' && (
              <section className="space-y-2 rounded-xl border p-4" aria-label="Pelunasan ke club">
                <h3 className="font-semibold">Pelunasan ke club</h3>
                <CoachClubSettlementToggle booking={booking} />
                <p className="text-muted-foreground text-xs">
                  Sesi yang ditandai lunas tidak masuk tagihan club di Income Layanan.
                </p>
              </section>
            )}
            <section className="space-y-3 rounded-xl border p-4" aria-label="Invoice layanan">
              <h3 className="font-semibold">Invoice</h3>
              {booking.invoice ? (
                <>
                  <p className="text-sm font-medium break-all">{booking.invoice.number}</p>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Status pembayaran</dt>
                      <dd>
                        {booking.invoice.status === 'PAID'
                          ? 'Lunas'
                          : booking.invoice.status === 'PENDING'
                            ? 'Menunggu pembayaran'
                            : booking.invoice.status}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Total invoice</dt>
                      <dd className="font-semibold">{currency(booking.invoice.total)}</dd>
                    </div>
                  </dl>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/admin/kelola-transaksi/${booking.invoice.id}`}>
                      Buka detail invoice <ExternalLink aria-hidden="true" />
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Belum ada invoice untuk pemesanan ini.
                </p>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
