'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, UserRound } from 'lucide-react';
import dayjs from '@/lib/dayjs';
import { adminInvoiceQueryOptions } from '@/queries/admin/invoice';
import { getCourtNameForSlot } from '@/lib/ballboy-utils';
import { formatScheduleSlotTime } from '@/lib/admin-schedule-time';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type SlotTime = { startAt?: string | null; endAt?: string | null };
type ScheduleRow = {
  key: string;
  kind?: 'Lapangan' | 'Coach' | 'Ballboy';
  name: string;
  description?: string;
  slot?: SlotTime;
  price: number;
  normalPrice?: number;
  valuePack?: boolean;
  inHouse?: boolean;
};
const money = (value: number | null | undefined) => formatCurrency(Number(value ?? 0));
const timestamp = (value?: string | null) => {
  if (!value) return '—';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.tz('Asia/Jakarta').format('DD MMM YYYY · HH:mm [WIB]') : '—';
};
const typeLabels: Record<string, string> = {
  BOOKING: 'Booking',
  CLASS_BOOKING: 'Kelas',
  MEMBERSHIP: 'Value Pack',
  INHOUSE_PACKAGE: 'Paket Coach In-house'
};
const paymentLabels: Record<string, string> = {
  PAID: 'Lunas',
  PENDING: 'Menunggu pembayaran',
  AWAITING_CONFIRMATION: 'Menunggu konfirmasi',
  EXPIRED: 'Kedaluwarsa',
  CANCELLED: 'Dibatalkan',
  REFUNDED: 'Dikembalikan'
};
const bookingLabels: Record<string, string> = {
  CONFIRMED: 'Terkonfirmasi',
  HOLD: 'Menunggu pembayaran',
  CANCELLED: 'Dibatalkan'
};

function ScheduleTable({ rows }: { rows: ScheduleRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full min-w-[760px] table-fixed text-sm"
        aria-label="Jadwal lapangan dan layanan"
      >
        <colgroup>
          <col className="w-28" />
          <col />
          <col className="w-44" />
          <col className="w-40" />
          <col className="w-40" />
        </colgroup>
        <thead className="bg-muted/40 border-b">
          <tr>
            {['Jenis', 'Lapangan / layanan', 'Tanggal main', 'Jam (WIB)', 'Harga'].map(
              (label, index) => (
                <th
                  key={label}
                  scope="col"
                  className={`text-muted-foreground px-5 py-3 text-xs font-medium ${index === 4 ? 'text-right' : 'text-left'}`}
                >
                  {label}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, index) => {
            const date = formatScheduleSlotTime(row.slot?.startAt, 'DD MMM YYYY');
            const endDate = formatScheduleSlotTime(row.slot?.endAt, 'DD MMM YYYY');
            return (
              <tr key={`${row.kind}-${row.key}-${index}`} className="align-middle">
                <td className="px-5 py-4">
                  <Badge variant="outline" className="text-muted-foreground font-normal">
                    {row.kind}
                  </Badge>
                </td>
                <th scope="row" className="px-5 py-4 text-left font-medium">
                  <p className="break-words">{row.name}</p>
                  {row.description && row.description.toLowerCase() !== 'default' && (
                    <p className="text-muted-foreground mt-1 text-xs font-normal">
                      {row.description}
                    </p>
                  )}
                </th>
                <td className="px-5 py-4 text-xs tabular-nums sm:text-sm">
                  <p className="whitespace-nowrap">{date}</p>
                  {endDate !== '-' && endDate !== date && (
                    <p className="text-muted-foreground mt-1 text-xs whitespace-nowrap">
                      s.d. {endDate}
                    </p>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap tabular-nums">
                  {row.slot?.startAt && row.slot?.endAt
                    ? `${formatScheduleSlotTime(row.slot.startAt)}–${formatScheduleSlotTime(row.slot.endAt)}`
                    : '—'}
                </td>
                <td className="px-5 py-4 text-right whitespace-nowrap tabular-nums">
                  {row.normalPrice != null && row.price > 0 && row.price < row.normalPrice && (
                    <p className="text-muted-foreground mb-0.5 text-xs line-through">
                      {money(row.normalPrice)}
                    </p>
                  )}
                  <p className="font-semibold">{money(row.price)}</p>
                  {row.inHouse && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Ditanggung paket coaching in-house
                    </p>
                  )}
                  {row.valuePack && (
                    <p className="text-muted-foreground mt-1 text-xs">Menggunakan Value Pack</p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isPending, isError, refetch } = useQuery(adminInvoiceQueryOptions(id));

  if (isPending)
    return (
      <div role="status" aria-label="Memuat detail transaksi" className="space-y-5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  if (isError || !invoice)
    return (
      <Card role="alert">
        <CardHeader>
          <CardTitle>Detail transaksi belum dapat dimuat</CardTitle>
          <CardDescription>Periksa koneksi lalu coba kembali.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button onClick={() => void refetch()}>Coba lagi</Button>
          <Button asChild variant="outline">
            <Link href="/admin/kelola-transaksi">Kembali ke transaksi</Link>
          </Button>
        </CardContent>
      </Card>
    );

  const booking = invoice.booking;
  const pack = invoice.membership?.membership ?? invoice.membership;
  const name = invoice.user?.name || 'Customer tidak tersedia';
  const courts: ScheduleRow[] = (booking?.courts ?? []).map((item: any, index: number) => {
    const normalPrice = item.price ?? item.slot?.price ?? 0;
    const discounted = item.discountPrice ?? item.slot?.discountPrice ?? 0;
    const valuePack = !!booking.membershipUserId && discounted === 0;
    return {
      key: item.slot?.id ?? `court-${index}`,
      name: item.court?.name ?? 'Lapangan',
      slot: item.slot,
      normalPrice,
      valuePack,
      inHouse: !!item.inHouseCovered,
      price: item.inHouseCovered ? 0 : valuePack ? 0 : discounted > 0 ? discounted : normalPrice
    };
  });
  const coaches: ScheduleRow[] = (booking?.coaches ?? []).map((item: any, index: number) => ({
    key: item.slot?.id ?? `coach-${index}`,
    name: item.staff?.name ?? 'Coach',
    description: item.coachType?.name,
    slot: item.slot,
    price: item.price ?? 0
  }));
  const ballboys: ScheduleRow[] = (booking?.ballboys ?? []).map((item: any, index: number) => ({
    key: item.slot?.id ?? `ballboy-${index}`,
    name: item.staff?.name ?? 'Ballboy',
    description: getCourtNameForSlot(item.slot, booking.courts),
    slot: item.slot,
    price: item.price ?? 0
  }));

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Detail transaksi</h1>
          <p className="text-muted-foreground text-sm break-all">{invoice.number}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/kelola-transaksi">
            <ArrowLeft className="size-4" />
            Kembali ke transaksi
          </Link>
        </Button>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 gap-5 py-6">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 px-5 sm:px-6">
            <div className="space-y-2">
              <CardTitle className="text-base">Ringkasan pembayaran</CardTitle>
              <CardDescription>{typeLabels[invoice.type] ?? invoice.type}</CardDescription>
            </div>
            <Badge variant={invoice.status === 'PAID' ? 'lightSuccess' : 'outline'}>
              {paymentLabels[invoice.status] ?? invoice.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6 px-5 sm:px-6">
            <div className="bg-muted/40 rounded-lg p-4">
              <p className="text-muted-foreground text-xs">Total pembayaran</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                {money(invoice.total)}
              </p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-3">
              {[
                ['Diterbitkan', timestamp(invoice.issuedAt)],
                ['Jatuh tempo', timestamp(invoice.dueDate)],
                [
                  'Dibayar',
                  invoice.paidAt
                    ? timestamp(invoice.paidAt)
                    : invoice.status === 'PAID'
                      ? '—'
                      : 'Belum dibayar'
                ]
              ].map(([label, value]) => (
                <div key={label} className="space-y-1.5">
                  <dt className="text-muted-foreground text-xs">{label}</dt>
                  <dd className="text-sm font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <dl className="space-y-3 border-t pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  {invoice.promoDiscountAmount > 0 ? 'Subtotal setelah promo' : 'Subtotal'}
                </dt>
                <dd className="font-medium tabular-nums">{money(invoice.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Biaya proses</dt>
                <dd className="font-medium tabular-nums">{money(invoice.processingFee)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t pt-3 font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(invoice.total)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card className="min-w-0 gap-5 py-6">
          <CardHeader className="px-5 sm:px-6">
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
                <UserRound className="size-5" />
              </span>
              <p className="font-medium break-words">{name}</p>
            </div>
            {invoice.user?.phone && (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Phone className="size-4 shrink-0" />
                <span className="break-all">{invoice.user.phone}</span>
              </p>
            )}
            {invoice.user?.email && (
              <p className="text-muted-foreground flex items-start gap-2 text-sm">
                <Mail className="mt-0.5 size-4 shrink-0" />
                <span className="break-all">{invoice.user.email}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {booking && (
        <section aria-labelledby="booking-schedule-title" className="min-w-0 space-y-4">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <h2 id="booking-schedule-title" className="text-base font-semibold">
                Jadwal booking
              </h2>
              <p className="text-muted-foreground text-sm">
                Rincian lapangan dan layanan. Semua jam mengikuti WIB.
              </p>
            </div>
            <Badge variant={booking.status === 'CONFIRMED' ? 'lightSuccess' : 'outline'}>
              {bookingLabels[booking.status] ?? booking.status}
            </Badge>
          </header>
          <div className="bg-card overflow-hidden rounded-xl border">
            <ScheduleTable
              rows={[
                ...courts.map((row) => ({ ...row, kind: 'Lapangan' as const })),
                ...coaches.map((row) => ({ ...row, kind: 'Coach' as const })),
                ...ballboys.map((row) => ({ ...row, kind: 'Ballboy' as const }))
              ]}
            />
            {booking.inventories?.length > 0 && (
              <section className="space-y-3 border-t px-5 py-4">
                <h3 className="text-sm font-semibold">Inventori</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm" aria-label="Rincian inventori">
                    <thead className="bg-muted/40">
                      <tr>
                        {['Item', 'Jumlah', 'Harga satuan', 'Total'].map((label, index) => (
                          <th
                            key={label}
                            scope="col"
                            className={`text-muted-foreground px-4 py-3 font-medium ${index === 0 ? 'text-left' : 'text-right'}`}
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {booking.inventories.map((item: any, index: number) => (
                        <tr key={item.inventory?.id ?? index}>
                          <th scope="row" className="px-4 py-3 text-left font-medium">
                            {item.inventory?.name ?? 'Inventori'}
                          </th>
                          <td className="px-4 py-3 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{money(item.price)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {money((item.price ?? 0) * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            <footer className="bg-muted/20 flex flex-wrap items-center justify-between gap-4 border-t px-5 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Total nilai booking</p>
                <p className="text-muted-foreground text-xs">Di luar biaya proses</p>
              </div>
              <p className="text-lg font-semibold tracking-tight tabular-nums">
                {money(booking.totalPrice)}
              </p>
            </footer>
          </div>
        </section>
      )}

      {invoice.classBooking && (
        <Card className="gap-5 py-6">
          <CardHeader className="px-5 sm:px-6">
            <CardTitle className="text-base">Detail kelas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 px-5 sm:grid-cols-3 sm:px-6">
            {[
              ['Kelas', invoice.classBooking.class?.name ?? '—'],
              ['Status', bookingLabels[invoice.classBooking.status] ?? invoice.classBooking.status],
              ['Nilai kelas', money(invoice.classBooking.totalPrice)]
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-muted-foreground mb-1 text-xs">{label}</p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {invoice.inHousePackage && (
        <Card>
          <CardHeader>
            <CardTitle>Detail paket coaching in-house</CardTitle>
            <CardDescription>
              Kuota khusus coach yang dipilih, dapat digunakan pada hari berbeda.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {[
              ['Coach', invoice.inHousePackage.staff.name],
              ['Paket', invoice.inHousePackage.packageName],
              ['Kuota pembelian', `${invoice.inHousePackage.totalMinutes / 60} jam`],
              ['Harga per jam', money(invoice.inHousePackage.hourlyPrice)],
              ['Bagian lapangan per jam', money(invoice.inHousePackage.courtHourlyShare)],
              [
                'Tambahan peserta per orang/jam',
                money(invoice.inHousePackage.extraParticipantHourlyPrice)
              ]
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-muted-foreground mb-1 text-xs">{label}</p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {pack && (
        <Card className="gap-5 py-6">
          <CardHeader className="px-5 sm:px-6">
            <CardTitle className="text-base">Detail Value Pack</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 px-5 sm:grid-cols-3 sm:px-6">
            {[
              ['Paket', pack.name ?? '—'],
              ['Durasi', pack.duration != null ? `${pack.duration} hari` : '—'],
              ['Kuota paket', pack.sessions != null ? `${pack.sessions} jam` : '—']
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-muted-foreground mb-1 text-xs">{label}</p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
