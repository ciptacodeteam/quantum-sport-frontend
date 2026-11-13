'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import type { ServiceIncomeReport } from '@/types/service-income';

const time = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
const hours = (value: number) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value);

function ReportTable({
  label,
  headers,
  children,
  footer,
  numericFrom
}: {
  label: string;
  headers: string[];
  children: ReactNode;
  footer?: ReactNode;
  numericFrom: 1 | 3 | 4;
}) {
  const alignment = {
    1: '[&_tr>*:nth-child(n+2)]:text-right',
    3: '[&_tr>*:nth-child(n+4)]:text-right',
    4: '[&_tr>*:nth-child(n+5)]:text-right'
  }[numericFrom];
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className={`w-full min-w-[660px] text-sm ${alignment}`} aria-label={label}>
        <thead>
          <tr className="bg-muted/40 text-muted-foreground border-b">
            {headers.map((header, index) => (
              <th
                scope="col"
                key={header}
                className={`px-4 py-3 text-xs font-medium ${index === headers.length - 1 ? 'text-right' : 'text-left'}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
        {footer && <tfoot className="bg-muted/40 border-t font-semibold">{footer}</tfoot>}
      </table>
    </div>
  );
}

export default function ServiceIncomeSection({
  data,
  isLoading
}: {
  data?: ServiceIncomeReport;
  isLoading: boolean;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  if (isLoading)
    return (
      <div className="space-y-6" role="status" aria-label="Memuat pendapatan coach dan ballboy">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  if (!data) return null;
  const { summary } = data;
  const term = search.trim().toLocaleLowerCase('id-ID');
  const filtered = data.rows.filter((row) =>
    `${row.invoiceNumber} ${row.customerName} ${row.staffName} ${row.clubName} ${row.branchName}`
      .toLocaleLowerCase('id-ID')
      .includes(term)
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 20, currentPage * 20);
  const filteredTotal = filtered.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="space-y-8">
      <Card className="gap-6 py-6 sm:py-8" role="region" aria-label="Ringkasan hak club">
        <CardHeader className="gap-2 px-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Ringkasan hak pendapatan</CardTitle>
            <Badge variant="outline">100% untuk club</Badge>
          </div>
          <CardDescription>
            {time(data.dateRange.startDate)} — {time(data.dateRange.endDate)} WIB
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 px-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] xl:items-center xl:gap-8">
          <div className="min-w-0 space-y-3">
            <p className="text-muted-foreground text-sm font-medium">Total hak coach & ballboy</p>
            <p className="text-3xl leading-tight font-semibold tracking-tight break-words tabular-nums sm:text-4xl">
              {formatCurrency(summary.totalAmount)}
            </p>
            <p className="text-muted-foreground text-sm">
              {summary.invoiceCount} invoice lunas · {summary.sessions} sesi jasa
            </p>
          </div>
          <dl className="grid gap-5 border-t pt-6 sm:grid-cols-3 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-8">
            {[
              {
                label: 'Pendapatan coach',
                value: formatCurrency(summary.coachAmount),
                note: 'Biaya jasa coach yang diterima'
              },
              {
                label: 'Pendapatan ballboy',
                value: formatCurrency(summary.ballboyAmount),
                note: 'Biaya jasa ballboy yang diterima'
              },
              {
                label: 'Club penerima',
                value: `${summary.clubCount} club`,
                note: 'Di luar kelompok Tanpa Club'
              }
            ].map((metric) => (
              <div className="min-w-0 space-y-2" key={metric.label}>
                <dt className="text-muted-foreground text-xs font-medium sm:text-sm">
                  {metric.label}
                </dt>
                <dd className="text-base leading-snug font-semibold break-words tabular-nums xl:text-lg">
                  {metric.value}
                </dd>
                <p className="text-muted-foreground text-xs leading-relaxed">{metric.note}</p>
              </div>
            ))}
          </dl>
        </CardContent>
        <div className="bg-muted/50 mx-6 space-y-2 rounded-lg p-4 text-xs leading-relaxed sm:mx-8">
          <p className="text-foreground text-sm font-medium">
            Hak club = 100% pembayaran jasa setelah alokasi promo
          </p>
          <p className="text-muted-foreground">
            Berdasarkan tanggal pembayaran pelanggan (WIB), bukan tanggal latihan. Biaya lapangan
            dan administrasi tidak termasuk. Potongan Coach Club hanya mengubah biaya lapangan,
            bukan tarif jasa. Coach in-house tidak termasuk hak club. Invoice belum lunas, refund,
            dan jasa yang dibatalkan tidak dihitung. Coach yang ditandai Lunas ke Club tetap tampil
            dengan nominal Rp0 dan status Lunas, tanpa menambah pendapatan.
          </p>
        </div>
      </Card>

      {summary.unassignedAmount > 0 && (
        <div
          className="space-y-1.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4"
          role="note"
          aria-label="Pendapatan tanpa club"
        >
          <p className="text-sm font-semibold">
            {formatCurrency(summary.unassignedAmount)} belum terhubung ke club
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Tetap termasuk dalam total hak pendapatan dan dicatat pada kelompok Tanpa Club. Ballboy
            sementara masuk kelompok ini; data lama coach tanpa catatan club juga ditampilkan di
            sini.
          </p>
        </div>
      )}

      <Card className="gap-5 py-6">
        <CardHeader className="gap-2 px-6 sm:px-8">
          <CardTitle className="text-base">Rekap hak per club</CardTitle>
          <CardDescription>
            Dasar perhitungan pembayaran ke masing-masing club. Nama club coach mengikuti catatan
            saat booking.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8">
          <ReportTable
            label="Rekap hak per club"
            numericFrom={1}
            headers={[
              'Club',
              'Sesi jasa',
              'Pendapatan coach',
              'Pendapatan ballboy',
              'Total hak club'
            ]}
            footer={
              data.clubs.length > 0 && (
                <tr>
                  <th scope="row" className="px-4 py-3 text-left">
                    Total
                  </th>
                  <td className="px-4 py-3 tabular-nums">{summary.sessions}</td>
                  <td className="px-4 py-3 tabular-nums">{formatCurrency(summary.coachAmount)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatCurrency(summary.ballboyAmount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(summary.totalAmount)}
                  </td>
                </tr>
              )
            }
          >
            {data.clubs.length ? (
              data.clubs.map((club) => (
                <tr key={club.id}>
                  <th scope="row" className="px-4 py-4 text-left font-medium">
                    {club.name}
                    {club.id === 'unassigned' && (
                      <span className="text-muted-foreground mt-1 block text-xs font-normal">
                        Penerima club belum ditentukan
                      </span>
                    )}
                  </th>
                  <td className="px-4 py-4 tabular-nums">{club.sessions}</td>
                  <td className="px-4 py-4 tabular-nums">{formatCurrency(club.coachAmount)}</td>
                  <td className="px-4 py-4 tabular-nums">{formatCurrency(club.ballboyAmount)}</td>
                  <td className="px-4 py-4 text-right font-semibold tabular-nums">
                    {formatCurrency(club.totalAmount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-12 text-center">
                  Belum ada pembayaran jasa lunas yang sesuai periode dan filter.
                </td>
              </tr>
            )}
          </ReportTable>
        </CardContent>
      </Card>

      <Card className="gap-5 py-6">
        <CardHeader className="gap-2 px-6 sm:px-8">
          <CardTitle className="text-base">Rincian per coach & ballboy</CardTitle>
          <CardDescription>
            Lihat kontribusi setiap petugas pada club penerimanya. Satu petugas dapat muncul pada
            beberapa club.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8">
          <ReportTable
            label="Pendapatan per coach dan ballboy"
            numericFrom={3}
            headers={['Nama', 'Jenis jasa', 'Club', 'Sesi / jam', 'Hak pendapatan']}
          >
            {data.staff.length ? (
              data.staff.map((member) => (
                <tr key={member.id}>
                  <th scope="row" className="px-4 py-4 text-left font-medium">
                    {member.name}
                  </th>
                  <td className="px-4 py-4">
                    <Badge variant="outline">
                      {member.service === 'COACH' ? 'Coach' : 'Ballboy'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">{member.clubName}</td>
                  <td className="px-4 py-4 tabular-nums">
                    {member.sessions} sesi / {hours(member.hours)} jam
                  </td>
                  <td className="px-4 py-4 text-right font-semibold tabular-nums">
                    {formatCurrency(member.amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-12 text-center">
                  Belum ada rincian pendapatan.
                </td>
              </tr>
            )}
          </ReportTable>
        </CardContent>
      </Card>

      <Card className="gap-5 py-6">
        <CardHeader className="gap-3 px-6 sm:px-8">
          <CardTitle className="text-base">Detail transaksi jasa</CardTitle>
          <CardDescription>
            Satu baris untuk satu sesi jasa. Invoice yang sama dapat memuat beberapa sesi.
          </CardDescription>
          <SearchInput
            aria-label="Cari transaksi jasa"
            placeholder="Cari invoice, pelanggan, petugas, club, atau cabang…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="mt-2"
          />
        </CardHeader>
        <CardContent className="space-y-4 px-6 sm:px-8">
          <ReportTable
            label="Detail transaksi pendapatan jasa"
            numericFrom={4}
            headers={[
              'Invoice / pelanggan',
              'Dibayar (WIB)',
              'Petugas / club',
              'Jadwal jasa (WIB)',
              'Biaya jasa',
              'Alokasi promo',
              'Hak club'
            ]}
            footer={
              filtered.length > 0 && (
                <tr>
                  <th scope="row" colSpan={6} className="px-4 py-3 text-left">
                    {term ? 'Total hasil pencarian' : 'Total hak pendapatan'} · {filtered.length}{' '}
                    sesi
                  </th>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(filteredTotal)}
                  </td>
                </tr>
              )
            }
          >
            {visible.length ? (
              visible.map((row) => (
                <tr key={row.id}>
                  <td className="min-w-48 px-4 py-4">
                    <Link
                      className="text-primary text-xs font-medium hover:underline"
                      href={`/admin/kelola-transaksi/${row.invoiceId}`}
                    >
                      {row.invoiceNumber}
                    </Link>
                    <p className="mt-1 text-sm font-medium">{row.customerName}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{row.branchName}</p>
                  </td>
                  <td className="min-w-40 px-4 py-4 text-xs tabular-nums">{time(row.paidAt)}</td>
                  <td className="min-w-44 px-4 py-4">
                    <p className="font-medium">{row.staffName}</p>
                    {row.service === 'COACH' && (
                      <Badge
                        variant={row.isClubSettled ? 'lightSuccess' : 'lightWarning'}
                        className="mt-1"
                      >
                        {row.isClubSettled ? 'Lunas' : 'Belum lunas'}
                      </Badge>
                    )}
                    {row.description && (
                      <p className="text-muted-foreground mt-1 text-xs whitespace-pre-line">
                        {row.description}
                      </p>
                    )}
                    <p className="text-muted-foreground mt-1 text-xs">
                      {row.service === 'COACH' ? 'Coach' : 'Ballboy'} · {row.clubName}
                    </p>
                  </td>
                  <td className="min-w-44 px-4 py-4 text-xs tabular-nums">
                    <p>{row.startAt.slice(0, 16)}</p>
                    <p className="text-muted-foreground mt-1">
                      s.d. {row.endAt.slice(11, 16)} ·{' '}
                      {row.hours === 0 ? 'Selisih reschedule' : `${hours(row.hours)} jam`}
                    </p>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                    {formatCurrency(row.servicePrice)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                    {formatCurrency(row.discount)}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold whitespace-nowrap tabular-nums">
                    {formatCurrency(row.amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-4 py-12 text-center">
                  {term
                    ? 'Tidak ada transaksi yang cocok dengan pencarian.'
                    : 'Belum ada transaksi jasa pada periode dan filter ini.'}
                </td>
              </tr>
            )}
          </ReportTable>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs">
              {filtered.length
                ? `${(currentPage - 1) * 20 + 1}–${Math.min(currentPage * 20, filtered.length)} dari ${filtered.length} sesi`
                : '0 sesi'}
              {term && ' · Pencarian hanya memfilter detail transaksi.'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Sebelumnya
              </Button>
              <span className="text-muted-foreground text-xs tabular-nums">
                {currentPage} / {pages}
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
        </CardContent>
      </Card>
    </div>
  );
}
