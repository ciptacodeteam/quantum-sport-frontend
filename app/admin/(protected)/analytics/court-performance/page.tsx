'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Download, Clock3, Users, CalendarDays, Banknote, ArrowDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/adminApi';
import { useBranchStore } from '@/stores/useBranchStore';
import useAuthStore from '@/stores/useAuthStore';
import DateRangeInput from '@/components/ui/date-range-input';
import AppSectionHeader from '@/components/ui/app-section-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { CourtPerformance } from '@/types/court-performance';

const n = (v: number) => v.toLocaleString('id-ID', { maximumFractionDigits: 2 });
const rp = (v: number) => `Rp ${Math.round(v).toLocaleString('id-ID')}`;
const localDate = (v: string, time = false) =>
  new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(time ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(new Date(v));
const clock = (v: string) =>
  new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(new Date(v));
const th = 'px-5 py-3 text-left text-sm font-medium whitespace-nowrap';
const td = 'px-5 py-4 text-sm';

export default function CourtPerformancePage() {
  const selectedBranch = useBranchStore((s) => s.adminBranchId);
  const user = useAuthStore((s) => s.user) as { branchId?: string; role?: string } | null;
  const branch =
    user?.role === 'SUPER_ADMIN'
      ? selectedBranch === 'all'
        ? null
        : selectedBranch
      : user?.branchId;
  return <CourtPerformanceContent key={branch ?? 'all'} branch={branch} />;
}

function CourtPerformanceContent({ branch }: { branch: string | null | undefined }) {
  const [date, setDate] = useState<DateRange | undefined>(() => ({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  }));
  const [court, setCourt] = useState('all');
  const [applied, setApplied] = useState(() => ({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    courtId: undefined as string | undefined
  }));
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [band, setBand] = useState('all');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const query = useQuery({
    queryKey: ['admin', 'analytics', 'court-performance', branch, applied],
    queryFn: async () =>
      (await adminApi.get('/analytics/court-performance', { params: applied })).data
        .data as CourtPerformance,
    staleTime: 60_000
  });
  const data = query.data;
  const filtered = (data?.rows ?? []).filter(
    (r) =>
      (category === 'all' || r.categoryId === category) &&
      (band === 'all' || r.band === band) &&
      `${r.customer} ${r.invoiceNumber ?? ''} ${r.court}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 20, currentPage * 20);
  const categoryName = data?.categories.find((c) => c.id === category)?.name ?? 'Seluruh kategori';
  const exportExcel = async () => {
    setExporting(true);
    try {
      const response = await adminApi.get('/analytics/court-performance/export', {
        params: applied,
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data),
        a = document.createElement('a');
      a.href = url;
      a.download = `court-performance-${applied.startDate}-${applied.endDate}.xlsx`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error('Export gagal. Silakan coba kembali.');
    } finally {
      setExporting(false);
    }
  };
  const jump = (offset: number) => {
    const d = subMonths(new Date(), offset);
    setDate({ from: startOfMonth(d), to: endOfMonth(d) });
  };
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <AppSectionHeader
        title="Court Performance"
        description="Pantau revenue, jam bermain, dan okupansi setiap lapangan."
        className="mb-0 gap-4 pb-0"
      >
        <Button
          variant="outline"
          title="Export seluruh kategori untuk periode dan lapangan yang ditampilkan"
          onClick={exportExcel}
          disabled={!data || exporting || query.isFetching || query.isError}
        >
          <Download className="size-4" />
          {exporting ? 'Mengunduh…' : 'Export Excel'}
        </Button>
      </AppSectionHeader>
      <section className="space-y-4 rounded-xl border p-5">
        <div className="flex flex-wrap items-center gap-2 border-b pb-4">
          <CalendarDays className="text-muted-foreground mr-1 size-4" />
          <span className="mr-3 text-sm font-medium">Periode laporan</span>
          <Button variant="outline" onClick={() => jump(0)}>
            Bulan ini
          </Button>
          <Button variant="outline" onClick={() => jump(1)}>
            Bulan lalu
          </Button>
          <span className="text-muted-foreground ml-auto text-xs">
            Berdasarkan tanggal main · WIB
          </span>
        </div>
        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,20rem)_minmax(0,24rem)_auto] lg:justify-start">
          <div className="flex min-w-0 flex-col gap-2">
            <label className="text-sm font-medium">Rentang tanggal</label>
            <DateRangeInput
              value={date}
              onValueChange={(v) => setDate(v ?? undefined)}
              className="h-10 w-full sm:w-full"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="performance-court" className="text-sm font-medium">
              Lapangan
            </label>
            <Select value={court} onValueChange={setCourt}>
              <SelectTrigger id="performance-court" className="w-full data-[size=default]:h-10">
                <SelectValue placeholder="Semua lapangan" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">Semua lapangan</SelectItem>
                {data?.courts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} · {c.sport === 'TENNIS' ? 'Tennis' : 'Padel'}
                    {!branch && c.branch ? ` · ${c.branch}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="h-10 w-full px-5 sm:col-span-2 lg:col-span-1 lg:w-auto"
            disabled={!date?.from || !date.to || query.isFetching}
            onClick={() => {
              if (!date?.from || !date.to) return;
              if ((+date.to - +date.from) / 86400000 > 365) {
                toast.error('Pilih periode maksimal 366 hari.');
                return;
              }
              const next = {
                startDate: format(date.from, 'yyyy-MM-dd'),
                endDate: format(date.to, 'yyyy-MM-dd'),
                courtId: court === 'all' ? undefined : court
              };
              if (
                next.startDate === applied.startDate &&
                next.endDate === applied.endDate &&
                next.courtId === applied.courtId
              )
                void query.refetch();
              else setApplied(next);
              setPage(1);
            }}
          >
            Tampilkan
          </Button>
        </div>
      </section>
      {query.isLoading && (
        <div role="status" className="text-muted-foreground rounded-xl border p-10 text-center">
          Memuat performa lapangan…
        </div>
      )}
      {query.isError && (
        <div role="alert" className="rounded-xl border p-6">
          <p>Data performa gagal dimuat. Pastikan cabang dan periode sudah dipilih.</p>
          <Button variant="outline" className="mt-3" onClick={() => query.refetch()}>
            Coba lagi
          </Button>
        </div>
      )}
      {data && !query.isError && (
        <>
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <span>
              {localDate(`${data.startDate}T00:00:00+07:00`)} —{' '}
              {localDate(`${data.endDate}T00:00:00+07:00`)} /{' '}
              {data.courts.find((c) => c.id === applied.courtId)?.name ?? 'Semua lapangan'}
            </span>
            <span className="rounded-full border px-3 py-0.5 text-xs">
              {query.isFetching ? 'Memperbarui…' : 'Booking confirmed'}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                label: 'Total jam dipesan',
                value: `${n(data.summary.hours)} jam`,
                note: `${n(data.summary.pastHours)} berlalu · ${n(data.summary.upcomingHours)} mendatang`,
                icon: Clock3,
                primary: true
              },
              {
                label: 'Okupansi periode',
                value: `${n(data.summary.occupancy)}%`,
                note: `${n(data.summary.occupiedHours)} dari ${n(data.summary.capacityHours)} jam kapasitas terbit`,
                icon: CalendarDays
              },
              {
                label: 'Nilai pemakaian lapangan',
                value: rp(data.summary.revenue),
                note: `${rp(data.summary.realizedRevenue)} untuk jam yang sudah berlalu`,
                icon: Banknote
              },
              {
                label: 'Revenue lapangan',
                value: rp(data.summary.paidRevenue),
                note: 'Setelah diskon & promo · tanpa add-on dan biaya proses',
                icon: Banknote
              },
              {
                label: 'Alokasi Value Pack',
                value: rp(data.summary.membershipAllocation),
                note: `${n(data.summary.membershipHours)} jam · alokasi harga pembelian paket`,
                icon: Users
              },
              {
                label: 'Non-membership',
                value: `${n(data.summary.nonMembershipHours)} jam`,
                note: `${n(data.summary.bookings)} booking unik seluruh kategori`,
                icon: Clock3
              }
            ].map((k) => (
              <div
                key={k.label}
                className={`flex min-h-40 flex-col justify-between rounded-xl border p-5 ${k.primary ? 'border-primary bg-primary text-primary-foreground' : ''}`}
              >
                <div className="flex justify-between gap-3">
                  <span className={`text-sm ${k.primary ? 'opacity-85' : 'text-muted-foreground'}`}>
                    {k.label}
                  </span>
                  <k.icon className="size-4 shrink-0 opacity-70" />
                </div>
                <div className="mt-4 text-2xl font-semibold tracking-tight">{k.value}</div>
                <p className={`mt-2 text-xs ${k.primary ? 'opacity-85' : 'text-muted-foreground'}`}>
                  {k.note}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-muted/40 text-muted-foreground rounded-lg px-4 py-3 text-xs leading-relaxed">
            Okupansi = jam terisi ÷ kapasitas slot yang sudah diterbitkan. Slot nonaktif tidak masuk
            kapasitas, kecuali sudah dibooking. Periode di luar jadwal yang terbit belum punya
            kapasitas. Nilai pemakaian = pembayaran lapangan + alokasi Value Pack; alokasi paket
            merupakan nilai penggunaan, bukan penerimaan kas baru. Booking mendatang termasuk dalam
            periode ini.
            {data.summary.unvaluedMembershipHours > 0 && (
              <p className="text-foreground mt-2 font-medium">
                {n(data.summary.unvaluedMembershipHours)} jam Value Pack belum dapat dinilai karena
                invoice pembelian dibayar tidak tersedia.
              </p>
            )}
          </div>
          {!branch && !applied.courtId && !!data.branchSummary?.length && (
            <section className="overflow-hidden rounded-xl border">
              <div className="p-5">
                <h2 className="font-semibold">Perbandingan antar cabang</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Periode yang sama untuk seluruh cabang. Pemakaian Value Pack mengikuti lokasi
                  bermain.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/40 border-y">
                    <tr>
                      {[
                        'Cabang',
                        'Jam terisi / kapasitas',
                        'Okupansi',
                        'Revenue lapangan',
                        'Alokasi Value Pack',
                        'Nilai pemakaian',
                        'Kontribusi nilai'
                      ].map((label) => (
                        <th className={th} key={label}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.branchSummary.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className={td}>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {item.courts} lapangan · {item.bookings} booking unik
                          </p>
                        </td>
                        <td className={`${td} whitespace-nowrap`}>
                          {n(item.occupiedHours)} / {n(item.capacityHours)} jam
                        </td>
                        <td className={td}>
                          <span className="font-medium">{n(item.occupancy)}%</span>
                          <div className="bg-muted mt-2 h-1.5 w-24 overflow-hidden rounded-full">
                            <div
                              className="bg-primary h-full"
                              style={{ width: `${Math.min(100, item.occupancy)}%` }}
                            />
                          </div>
                        </td>
                        <td className={`${td} whitespace-nowrap`}>{rp(item.paidRevenue)}</td>
                        <td className={`${td} whitespace-nowrap`}>
                          {rp(item.membershipAllocation)}
                        </td>
                        <td className={`${td} font-medium whitespace-nowrap`}>
                          {rp(item.revenue)}
                        </td>
                        <td className={td}>{n(item.revenueShare)}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/40 border-t font-medium">
                    <tr>
                      <td className={td}>Seluruh cabang</td>
                      <td className={`${td} whitespace-nowrap`}>
                        {n(data.summary.occupiedHours)} / {n(data.summary.capacityHours)} jam
                      </td>
                      <td className={td}>{n(data.summary.occupancy)}%</td>
                      <td className={`${td} whitespace-nowrap`}>{rp(data.summary.paidRevenue)}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        {rp(data.summary.membershipAllocation)}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{rp(data.summary.revenue)}</td>
                      <td className={td}>{data.summary.revenue > 0 ? '100%' : '0%'}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}
          <section className="overflow-hidden rounded-xl border">
            <div className="p-5">
              <h2 className="font-semibold">Performa per lapangan</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Bandingkan okupansi dan nilai pemakaian pada periode yang sama.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/40 border-y">
                  <tr>
                    {[
                      'Lapangan',
                      'Jam terisi / kapasitas',
                      'Okupansi',
                      'Pembayaran lapangan',
                      'Alokasi Value Pack',
                      'Nilai pemakaian'
                    ].map((t) => (
                      <th className={th} key={t}>
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.courtSummary.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20">
                      <td className={td}>
                        {c.name}
                        <p className="text-muted-foreground text-xs">
                          {c.sport}
                          {!branch && c.branch ? ` · ${c.branch}` : ''}
                        </p>
                      </td>
                      <td className={td}>
                        {n(c.occupiedHours)} / {n(c.capacityHours)} jam
                      </td>
                      <td className={td}>
                        <span className="font-medium">{n(c.occupancy)}%</span>
                        <div className="bg-muted mt-2 h-1.5 w-24 overflow-hidden rounded-full">
                          <div
                            className="bg-primary h-full"
                            style={{ width: `${Math.min(100, c.occupancy)}%` }}
                          />
                        </div>
                      </td>
                      <td className={td}>{rp(c.paidRevenue)}</td>
                      <td className={td}>{rp(c.membershipAllocation)}</td>
                      <td className={`${td} font-medium`}>{rp(c.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="overflow-hidden rounded-xl border">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <h2 className="font-semibold">Rekap jam per kategori</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Pilih kategori atau paket untuk menelusuri detail booking.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setCategory('all');
                  setPage(1);
                  document
                    .getElementById('booking-details')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Semua booking <ArrowDown className="size-4" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/40 border-y">
                  <tr>
                    {[
                      'Kategori / paket membership',
                      'Jam berlalu',
                      'Mendatang',
                      'Total jam',
                      'Booking',
                      'Nilai pemakaian',
                      ''
                    ].map((t) => (
                      <th className={th} key={t}>
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.categories.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20">
                      <td className={td}>
                        <span
                          className={`mr-3 inline-block size-2 rounded-full ${c.id.startsWith('membership:') ? 'bg-violet-500' : c.id === 'complimentary' ? 'bg-amber-500' : 'bg-teal-500'}`}
                        />
                        {c.name}
                      </td>
                      <td className={td}>{n(c.pastHours)}</td>
                      <td className={`${td} text-muted-foreground`}>{n(c.upcomingHours)}</td>
                      <td className={`${td} font-medium whitespace-nowrap`}>{n(c.hours)} jam</td>
                      <td className={td}>{c.bookings}</td>
                      <td className={`${td} whitespace-nowrap`}>{rp(c.revenue)}</td>
                      <td className={td}>
                        <Button
                          variant="ghost"
                          disabled={!c.bookings}
                          onClick={() => {
                            setCategory(c.id);
                            setSearch('');
                            setBand('all');
                            setPage(1);
                            document
                              .getElementById('booking-details')
                              ?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          Detail <ArrowDown className="size-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/40 border-t font-medium">
                  <tr>
                    <td className={td}>Total seluruh kategori</td>
                    <td className={td}>{n(data.summary.pastHours)}</td>
                    <td className={td}>{n(data.summary.upcomingHours)}</td>
                    <td className={`${td} whitespace-nowrap`}>{n(data.summary.hours)} jam</td>
                    <td className={`${td} whitespace-nowrap`}>
                      {data.summary.bookings} booking unik
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{rp(data.summary.revenue)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
          <section id="booking-details" className="scroll-mt-6 overflow-hidden rounded-xl border">
            <div className="space-y-4 p-5">
              <div>
                <p className="text-primary mb-2 text-xs font-medium">DETAIL BOOKING</p>
                <h2 className="font-semibold">{categoryName}</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {n(filtered.reduce((s, r) => s + r.hours, 0))} jam ·{' '}
                  {new Set(filtered.map((r) => r.bookingId)).size} booking · {filtered.length}{' '}
                  rincian waktu
                </p>
              </div>
              <div className="grid items-center gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)_minmax(0,12rem)]">
                <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    aria-label="Cari booking"
                    className="h-10 pl-9"
                    placeholder="Cari customer, invoice, atau lapangan…"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <Select
                  value={category}
                  onValueChange={(value) => {
                    setCategory(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger
                    aria-label="Kategori booking"
                    className="w-full min-w-0 data-[size=default]:h-10"
                  >
                    <SelectValue placeholder="Semua kategori" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="all">Semua kategori</SelectItem>
                    {data.categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={band}
                  onValueChange={(value) => {
                    setBand(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger
                    aria-label="Jam tarif"
                    className="w-full min-w-0 data-[size=default]:h-10"
                  >
                    <SelectValue placeholder="Semua jam tarif" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="all">Semua jam tarif</SelectItem>
                    <SelectItem value="happyHour">Happy Hour</SelectItem>
                    <SelectItem value="peakHour">Peak Hour</SelectItem>
                    <SelectItem value="other">Di luar jam tarif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/40 border-y">
                  <tr>
                    {[
                      'Customer / invoice',
                      'Tanggal & jam main',
                      'Lapangan',
                      'Kategori / paket',
                      'Durasi',
                      'Harga normal',
                      'Nilai pemakaian',
                      'Booking dibuat'
                    ].map((t) => (
                      <th className={th} key={t}>
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visible.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20">
                      <td className={td}>
                        {r.customer}
                        {r.invoiceId ? (
                          <Link
                            className="text-primary mt-1 block text-xs whitespace-nowrap hover:underline"
                            href={`/admin/kelola-transaksi/${r.invoiceId}`}
                          >
                            {r.invoiceNumber} ↗
                          </Link>
                        ) : (
                          <p className="text-muted-foreground text-xs">Tanpa invoice</p>
                        )}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>
                        {localDate(r.startAt)}
                        <p className="text-muted-foreground mt-1 text-xs">
                          {clock(r.startAt)}–{clock(r.endAt)} WIB ·{' '}
                          {r.band === 'peakHour'
                            ? 'Peak'
                            : r.band === 'happyHour'
                              ? 'Happy'
                              : 'Lainnya'}
                        </p>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>
                        {r.court}
                        {!branch && (
                          <p className="text-muted-foreground mt-1 text-xs">{r.branch}</p>
                        )}
                      </td>
                      <td className={td}>{r.category}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        {n(r.hours)} jam
                        <p className="text-muted-foreground mt-1 text-xs">
                          {r.upcomingHours === 0
                            ? 'Berlalu'
                            : r.pastHours === 0
                              ? 'Mendatang'
                              : 'Sedang berlangsung'}
                        </p>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{rp(r.normalPrice)}</td>
                      <td className={`${td} font-medium whitespace-nowrap`}>
                        {r.unvaluedMembershipHours > 0 ? 'Belum dapat dinilai' : rp(r.revenue)}
                        <p className="text-muted-foreground mt-1 text-xs font-normal">
                          {r.categoryId.startsWith('membership:')
                            ? 'Alokasi Value Pack'
                            : 'Pembayaran lapangan'}
                        </p>
                      </td>
                      <td className={`${td} text-muted-foreground text-xs whitespace-nowrap`}>
                        {localDate(r.createdAt, true)} WIB
                      </td>
                    </tr>
                  ))}
                  {!visible.length && (
                    <tr>
                      <td colSpan={8} className="text-muted-foreground p-10 text-center text-sm">
                        Belum ada booking yang sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm">
              <span className="text-muted-foreground">
                {filtered.length} rincian · 20 per halaman
              </span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Sebelumnya
                </Button>
                <span>
                  {currentPage} / {pages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage === pages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
