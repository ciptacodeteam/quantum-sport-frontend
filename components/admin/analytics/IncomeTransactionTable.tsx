'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

export type IncomeTransaction = {
  id: string;
  invoiceNumber: string;
  bookingId?: string | null;
  paymentStatus?: string;
  bookingStatus?: string | null;
  cancellationStatus?: 'NONE' | 'PARTIAL' | 'CANCELLED';
  cancelledServices?: {
    kind: 'COACH' | 'BALLBOY';
    name: string;
    amount: number;
    cancelledAt: string | null;
    reason: string | null;
  }[];
  branchId?: string;
  playingSchedules?: { label: string; startAt: string; endAt: string }[];
  customerName: string;
  branchName: string;
  source: string;
  paymentMethod: string | null;
  paidAt: string | null;
  amount: number;
  processingFee: number;
  netAmount: number;
  revenueBreakdown?: { court: number; coach: number; ballboy: number; other: number };
  excludedAmount?: number;
  reschedule?: {
    at: string;
    bookingId: string;
    from: { court: string; startAt: string; endAt: string };
    to: { court: string; startAt: string; endAt: string };
  } | null;
};

const sourceLabels: Record<string, string> = {
  Online: 'Online Booking',
  Cashier: 'Cashier Booking',
  Membership: 'Membership',
  InHouse: 'Paket Coach In-house',
  'Class Bookings': 'Transaksi kelas',
  Other: 'Belum terkelompok'
};
const paymentTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(value))
    : '—';

function PlayingSchedule({
  schedules = []
}: {
  schedules?: IncomeTransaction['playingSchedules'];
}) {
  if (!schedules.length)
    return <p className="text-muted-foreground text-xs">Jadwal bermain belum tersedia</p>;
  const dateFormat = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeFormat = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });
  // Court and service invoices may cover the same playing window.
  const unique = Array.from(
    new Map(schedules.map((slot) => [`${slot.startAt}:${slot.endAt}`, slot])).values()
  ).sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  return (
    <div className="space-y-2">
      {unique.map((slot) => {
        const start = new Date(slot.startAt);
        const end = new Date(slot.endAt);
        const sameDay = dateFormat.format(start) === dateFormat.format(end);
        return (
          <div key={`${slot.startAt}:${slot.endAt}`}>
            <p className="text-sm font-medium">{dateFormat.format(start)}</p>
            <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
              {timeFormat.format(start)}–{!sameDay && `${dateFormat.format(end)}, `}
              {timeFormat.format(end)} WIB
            </p>
          </div>
        );
      })}
    </div>
  );
}

function CancellationStatus({
  invoices,
  details = true
}: {
  invoices: IncomeTransaction[];
  details?: boolean;
}) {
  const cancelled = invoices.filter(
    (invoice) =>
      invoice.cancellationStatus === 'CANCELLED' || invoice.cancellationStatus === 'PARTIAL'
  );
  if (!cancelled.length) return null;
  const fullyCancelled =
    cancelled.length === invoices.length &&
    cancelled.every((invoice) => invoice.cancellationStatus === 'CANCELLED');
  return (
    <div className="mt-2 space-y-1.5">
      <Badge variant={fullyCancelled ? 'lightDestructive' : 'lightWarning'}>
        {fullyCancelled ? 'Dibatalkan' : 'Sebagian dibatalkan'}
      </Badge>
      <p className="text-muted-foreground text-xs font-normal">
        Nominal dibatalkan tidak masuk revenue.
      </p>
      <p className="text-muted-foreground text-xs font-normal">
        {cancelled.every((invoice) => invoice.paymentStatus === 'CANCELLED')
          ? 'Invoice dibatalkan; riwayat pembayaran dipertahankan.'
          : 'Riwayat pembayaran lunas tetap tersimpan.'}
      </p>
      {details &&
        cancelled
          .flatMap((invoice) => invoice.cancelledServices ?? [])
          .map((service, index) => (
            <div
              key={`${service.kind}-${index}`}
              className="text-muted-foreground text-xs font-normal"
            >
              <p>
                {service.kind === 'COACH' ? 'Coach' : 'Ballboy'} · {service.name} ·{' '}
                {formatCurrency(service.amount)}
              </p>
              {service.cancelledAt && <p>Dibatalkan {paymentTime(service.cancelledAt)} WIB</p>}
              {service.reason && <p>Alasan: {service.reason}</p>}
            </div>
          ))}
    </div>
  );
}

function RescheduleStatus({
  invoices,
  details = false
}: {
  invoices: IncomeTransaction[];
  details?: boolean;
}) {
  const events = [
    ...new Map(
      invoices.flatMap((invoice) =>
        invoice.reschedule
          ? [
              [
                `${invoice.reschedule.bookingId}:${invoice.reschedule.at}`,
                invoice.reschedule
              ] as const
            ]
          : []
      )
    ).values()
  ];
  if (!events.length) return null;
  return (
    <div className="mt-2 space-y-2">
      {events.map((event) => (
        <div key={`${event.bookingId}:${event.at}`} className="space-y-1">
          <Badge variant="lightInfo">Dijadwalkan ulang</Badge>
          <p className="text-muted-foreground text-xs font-normal">
            Diubah {paymentTime(event.at)} WIB
          </p>
          {details && (
            <div className="space-y-2 text-xs font-normal">
              <p className="text-muted-foreground">Jadwal terbaru · {event.to.court}</p>
              <PlayingSchedule schedules={[{ label: event.to.court, ...event.to }]} />
              <details>
                <summary className="text-muted-foreground cursor-pointer">
                  Jadwal sebelumnya · {event.from.court}
                </summary>
                <PlayingSchedule schedules={[{ label: event.from.court, ...event.from }]} />
              </details>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function IncomeTransactionTable({
  transactions,
  embedded = false,
  groupByBooking = false,
  title = 'Rincian transaksi customer',
  description = 'Riwayat pembayaran dan revenue setelah pembatalan, berdasarkan tanggal pembayaran (WIB). Nominal booking atau layanan yang dibatalkan tidak dihitung sebagai revenue.'
}: {
  transactions?: IncomeTransaction[];
  embedded?: boolean;
  groupByBooking?: boolean;
  title?: string;
  description?: string;
}) {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  // Apply the source filter to invoices before grouping so all totals stay scoped.
  const groups = new Map<string, IncomeTransaction[]>();
  for (const row of transactions ?? []) {
    if (source !== 'all' && row.source !== source) continue;
    const key =
      groupByBooking && row.bookingId
        ? `booking:${row.branchId ?? row.branchName}:${row.bookingId}`
        : `invoice:${row.id}`;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  const term = search.trim().toLocaleLowerCase('id-ID');
  const filtered = Array.from(groups.values())
    .filter((invoices) =>
      invoices.some((row) =>
        `${row.customerName} ${row.invoiceNumber} ${row.branchName} ${row.paymentMethod ?? ''}`
          .toLocaleLowerCase('id-ID')
          .includes(term)
      )
    )
    .map((invoices) => ({
      ...invoices[0],
      invoices,
      revenueBreakdown: invoices.some((invoice) => invoice.revenueBreakdown)
        ? invoices.reduce(
            (sum, invoice) => ({
              court: sum.court + (invoice.revenueBreakdown?.court ?? 0),
              coach: sum.coach + (invoice.revenueBreakdown?.coach ?? 0),
              ballboy: sum.ballboy + (invoice.revenueBreakdown?.ballboy ?? 0),
              other: sum.other + (invoice.revenueBreakdown?.other ?? invoice.netAmount)
            }),
            { court: 0, coach: 0, ballboy: 0, other: 0 }
          )
        : undefined,
      paidAt: invoices.reduce<string | null>(
        (latest, invoice) =>
          invoice.paidAt && (!latest || Date.parse(invoice.paidAt) > Date.parse(latest))
            ? invoice.paidAt
            : latest,
        null
      ),
      paymentMethod: Array.from(new Set(invoices.map((row) => row.paymentMethod ?? '—'))).join(
        ', '
      ),
      source: Array.from(
        new Set(invoices.map((row) => sourceLabels[row.source] ?? row.source))
      ).join(', '),
      ...invoices.reduce(
        (sum, row) => ({
          amount: sum.amount + row.amount,
          processingFee: sum.processingFee + row.processingFee,
          netAmount: sum.netAmount + row.netAmount
        }),
        { amount: 0, processingFee: 0, netAmount: 0 }
      )
    }));
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 20, currentPage * 20);
  const totals = filtered.reduce(
    (sum, row) => ({
      amount: sum.amount + row.amount,
      processingFee: sum.processingFee + row.processingFee,
      netAmount: sum.netAmount + row.netAmount
    }),
    { amount: 0, processingFee: 0, netAmount: 0 }
  );
  const hasFilters = source !== 'all' || term !== '';
  const Container = embedded ? 'section' : Card;

  return (
    <Container className={embedded ? 'min-w-0 space-y-5' : 'gap-5 py-6'} id="income-transactions">
      <CardHeader className={embedded ? 'gap-3 px-0' : 'gap-3 px-6 sm:px-8'}>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          {groupByBooking
            ? 'Rekap riwayat pembayaran per booking, termasuk ballboy dan coach yang terhubung. Total mengikuti tanggal pembayaran (WIB), periode, dan cabang pilihan. Buka rincian untuk melihat setiap invoice.'
            : description}
        </CardDescription>
        {transactions && (
          <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <SearchInput
              aria-label="Cari transaksi customer"
              placeholder="Cari customer, invoice, cabang, atau metode bayar…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <Select
              value={source}
              onValueChange={(value) => {
                setSource(value);
                setPage(1);
              }}
            >
              <SelectTrigger aria-label="Sumber transaksi" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua sumber</SelectItem>
                {Object.entries(sourceLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent className={embedded ? 'px-0' : 'px-6 sm:px-8'}>
        {!transactions ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Rincian transaksi belum tersedia untuk periode ini.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table
                className="w-full min-w-[1050px] text-sm"
                aria-label="Transaksi customer pembentuk revenue"
              >
                <thead>
                  <tr className="text-muted-foreground border-b">
                    {[
                      'Customer / invoice',
                      'Dibayar (WIB)',
                      'Cabang',
                      'Sumber',
                      'Metode bayar',
                      'Pembayaran pelanggan',
                      'Biaya proses',
                      'Revenue'
                    ].map((label, index) => (
                      <th
                        key={label}
                        scope="col"
                        className={`px-3 py-3 font-medium whitespace-nowrap ${index < 5 ? 'text-left' : 'text-right'}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <Fragment key={row.id}>
                      <tr className="border-b align-top">
                        <th scope="row" className="px-3 py-4 text-left font-normal">
                          <p className="font-semibold">{row.customerName}</p>
                          {row.invoices.length > 1 ? (
                            <button
                              type="button"
                              aria-expanded={expanded.has(row.id)}
                              aria-controls={`invoice-details-${row.id}`}
                              className="text-primary mt-2 inline-flex cursor-pointer items-center gap-2 text-xs font-medium"
                              onClick={() =>
                                setExpanded((current) => {
                                  const next = new Set(current);
                                  if (next.has(row.id)) next.delete(row.id);
                                  else next.add(row.id);
                                  return next;
                                })
                              }
                            >
                              {row.invoices.length} invoice ·{' '}
                              {expanded.has(row.id) ? 'Tutup rincian' : 'Lihat rincian'}
                              <ChevronDown
                                aria-hidden="true"
                                className={`size-3.5 transition-transform ${expanded.has(row.id) ? 'rotate-180' : ''}`}
                              />
                            </button>
                          ) : (
                            <Link
                              href={`/admin/kelola-transaksi/${row.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary mt-1 inline-flex items-center gap-1 text-xs underline underline-offset-4"
                            >
                              {row.invoiceNumber}
                              <ArrowUpRight aria-hidden="true" className="size-3" />
                            </Link>
                          )}
                          <CancellationStatus
                            invoices={row.invoices}
                            details={row.invoices.length === 1}
                          />
                          <RescheduleStatus
                            invoices={row.invoices}
                            details={row.invoices.length === 1}
                          />
                        </th>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {paymentTime(row.paidAt)}
                          {row.paidAt ? ' WIB' : ''}
                          {row.invoices.length > 1 && (
                            <p className="text-muted-foreground mt-1 text-xs">
                              Pembayaran terakhir
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-4">{row.branchName}</td>
                        <td className="px-3 py-4 whitespace-nowrap">{row.source}</td>
                        <td className="px-3 py-4">{row.paymentMethod ?? '—'}</td>
                        <td className="px-3 py-4 text-right whitespace-nowrap tabular-nums">
                          {formatCurrency(row.amount)}
                        </td>
                        <td className="px-3 py-4 text-right whitespace-nowrap tabular-nums">
                          {formatCurrency(row.processingFee)}
                        </td>
                        <td className="px-3 py-4 text-right font-medium whitespace-nowrap tabular-nums">
                          {formatCurrency(row.netAmount)}
                          {row.revenueBreakdown && (
                            <dl className="text-muted-foreground mt-2 space-y-1 text-xs font-normal">
                              {(
                                [
                                  ['court', 'Lapangan'],
                                  ['coach', 'Coach'],
                                  ['ballboy', 'Ballboy'],
                                  ['other', 'Lainnya']
                                ] as const
                              )
                                .filter(([key]) => row.revenueBreakdown![key] !== 0)
                                .map(([key, label]) => (
                                  <div key={key} className="flex justify-between gap-3">
                                    <dt>{label}</dt>
                                    <dd>{formatCurrency(row.revenueBreakdown![key])}</dd>
                                  </div>
                                ))}
                            </dl>
                          )}
                        </td>
                      </tr>
                      {row.invoices.length > 1 && expanded.has(row.id) && (
                        <tr id={`invoice-details-${row.id}`} className="border-b">
                          <td colSpan={8} className="bg-muted/20 px-4 py-5 sm:px-6">
                            <div className="mb-3 flex items-center gap-2">
                              <p className="text-sm font-semibold">Rincian invoice</p>
                              <span className="text-muted-foreground bg-background rounded-full border px-2 py-0.5 text-xs">
                                {row.invoices.length} invoice
                              </span>
                            </div>
                            <ul
                              aria-label="Rincian invoice booking"
                              className="grid gap-3 lg:grid-cols-3"
                            >
                              {row.invoices.map((invoice) => {
                                const labels = Array.from(
                                  new Set(
                                    (invoice.playingSchedules ?? []).map((slot) => slot.label)
                                  )
                                );
                                return (
                                  <li
                                    key={invoice.id}
                                    className="bg-background rounded-xl border p-4"
                                  >
                                    <div className="flex items-start justify-between gap-6">
                                      <div className="min-w-0">
                                        <h4 className="text-sm font-semibold">
                                          {labels.join(' · ') || 'Invoice booking'}
                                        </h4>
                                        <Link
                                          href={`/admin/kelola-transaksi/${invoice.id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary mt-1 inline-flex items-center gap-1 text-xs underline underline-offset-4"
                                        >
                                          {invoice.invoiceNumber}
                                          <ArrowUpRight
                                            aria-hidden="true"
                                            className="size-3 shrink-0"
                                          />
                                        </Link>
                                      </div>
                                      <div className="shrink-0 text-right">
                                        <p className="text-muted-foreground text-[11px]">
                                          Nominal invoice
                                        </p>
                                        <p className="mt-1 text-base font-semibold tabular-nums">
                                          {formatCurrency(invoice.amount)}
                                        </p>
                                      </div>
                                    </div>
                                    <CancellationStatus invoices={[invoice]} />
                                    <RescheduleStatus invoices={[invoice]} details />
                                    <div className="mt-4 border-t pt-3">
                                      <p className="text-muted-foreground mb-1.5 text-[11px]">
                                        Jadwal bermain
                                      </p>
                                      <PlayingSchedule schedules={invoice.playingSchedules} />
                                    </div>
                                    {invoice.paymentMethod && (
                                      <p className="text-muted-foreground mt-3 text-xs">
                                        Metode bayar{' '}
                                        <span className="text-foreground font-medium">
                                          {invoice.paymentMethod}
                                        </span>
                                      </p>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-muted-foreground py-10 text-center">
                        {hasFilters
                          ? 'Tidak ada transaksi yang sesuai filter.'
                          : 'Tidak ada riwayat pembayaran pada periode ini.'}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/40 border-t font-semibold">
                    <th scope="row" colSpan={5} className="px-3 py-3 text-left">
                      {hasFilters ? 'Total hasil filter' : 'Total periode'} · {filtered.length}{' '}
                      transaksi
                    </th>
                    <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">
                      {formatCurrency(totals.amount)}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">
                      {formatCurrency(totals.processingFee)}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">
                      {formatCurrency(totals.netAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">
                {filtered.length
                  ? `Menampilkan ${(currentPage - 1) * 20 + 1}–${Math.min(currentPage * 20, filtered.length)} dari ${filtered.length} transaksi`
                  : '0 transaksi'}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Sebelumnya
                </Button>
                <span>
                  Halaman {currentPage} / {pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= pages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              Nominal booking atau layanan yang dibatalkan dikeluarkan dari revenue. Riwayat
              pembayaran tetap tersimpan dan bukan bukti refund. Baris total menjumlahkan seluruh
              hasil di semua halaman. Pencarian dan filter di tabel ini tidak mengubah ringkasan
              revenue di atas.
            </p>
          </>
        )}
      </CardContent>
    </Container>
  );
}
