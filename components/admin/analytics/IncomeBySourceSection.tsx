'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency } from '@/lib/utils';
import { IconCash, IconDeviceDesktop, IconCreditCard } from '@tabler/icons-react';
import IncomeTransactionTable from './IncomeTransactionTable';

interface IncomeBySourceSectionProps {
  data: any;
  isLoading: boolean;
}

export default function IncomeBySourceSection({ data, isLoading }: IncomeBySourceSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-8" role="status" aria-label="Loading income analytics">
        <Card className="gap-6 py-6 sm:py-8">
          <CardHeader className="gap-2 px-6 sm:px-8">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent className="space-y-3 px-6 sm:px-8">
            <Skeleton className="h-10 w-60 max-w-full" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Card key={i} className="gap-6 py-5">
                <CardHeader className="px-5">
                  <Skeleton className="h-10 w-full" />
                </CardHeader>
                <CardContent className="space-y-3 px-5">
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-1.5 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>Unable to load income analytics</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const summary = data.summary || {};
  const bySource = data.bySource || {};

  const fallbackSourceTotals: Record<string, number> = {
    Online: Number(summary.onlineBookingIncome || 0),
    Cashier: Number(summary.cashierBookingIncome || 0),
    'Class Bookings': Number(summary.classBookingIncome || 0),
    Membership: Number(summary.membershipIncome || 0)
  };

  const sourceConfigs = [
    {
      key: 'Online',
      title: 'Online Booking',
      icon: IconDeviceDesktop,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      barColor: 'bg-blue-500'
    },
    {
      key: 'Cashier',
      title: 'Cashier Booking',
      icon: IconCash,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      barColor: 'bg-green-500'
    },
    {
      key: 'Membership',
      title: 'Membership',
      icon: IconCreditCard,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      barColor: 'bg-orange-500'
    }
  ];

  const totalRevenue = Number(summary.totalNetAmount ?? summary.totalIncome ?? 0);
  const totalFees = Number(summary.totalProcessingFees ?? 0);
  const totalGross = Number(summary.totalGrossAmount ?? totalRevenue + totalFees);
  const totalTransactions = Number(summary.totalTransactions ?? 0);
  const dateLabel = (value: string) =>
    new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));

  const detailFor = (key: string, title: string) => {
    const source = bySource[key];
    const revenue = Number(source?.total ?? fallbackSourceTotals[key] ?? 0);
    const processingFee =
      source?.processingFee != null ? Number(source.processingFee) : revenue === 0 ? 0 : null;
    return {
      key,
      title,
      revenue,
      processingFee,
      gross: processingFee === null ? null : revenue + processingFee,
      count: Number(source?.count ?? 0)
    };
  };
  const details = sourceConfigs.map(({ key, title }) => detailFor(key, title));
  const classes = detailFor('Class Bookings', 'Transaksi kelas');
  if (classes.revenue !== 0 || classes.count > 0 || classes.processingFee) details.push(classes);
  const remainder = totalRevenue - details.reduce((sum, row) => sum + row.revenue, 0);
  const remainingCount = Math.max(
    0,
    totalTransactions - details.reduce((sum, row) => sum + row.count, 0)
  );
  if (remainder !== 0 || remainingCount > 0) {
    const fee = details.every((row) => row.processingFee !== null)
      ? totalFees - details.reduce((sum, row) => sum + (row.processingFee ?? 0), 0)
      : null;
    details.push({
      key: 'other',
      title: remainder < 0 ? 'Selisih rincian' : 'Belum terkelompok',
      revenue: remainder,
      processingFee: fee,
      gross: fee === null ? null : remainder + fee,
      count: remainingCount
    });
  }

  const metrics = [
    { label: 'Pembayaran pelanggan', value: totalGross, note: 'Termasuk biaya proses' },
    { label: 'Biaya proses', value: totalFees, note: 'Dikeluarkan dari revenue' },
    { label: 'Total revenue', value: totalRevenue, note: 'Belum dikurangi biaya operasional' }
  ];

  return (
    <div className="space-y-8">
      <Card role="region" aria-label="Ringkasan revenue" className="gap-6 py-6 sm:py-8">
        <CardHeader className="gap-2 px-6 sm:px-8">
          <CardTitle className="text-base leading-snug">Ringkasan revenue</CardTitle>
          {data.dateRange?.startDate && data.dateRange?.endDate && (
            <CardDescription className="text-xs leading-relaxed sm:text-sm">
              {dateLabel(data.dateRange.startDate)} — {dateLabel(data.dateRange.endDate)} WIB
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="grid gap-6 px-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] xl:items-center xl:gap-8">
          <div className="min-w-0 space-y-3">
            <p className="text-muted-foreground text-sm font-medium">Total revenue</p>
            <p className="text-3xl leading-tight font-semibold tracking-tight break-words tabular-nums sm:text-4xl">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium tabular-nums">{totalTransactions}</span>{' '}
              transaksi lunas dalam periode ini
            </p>
          </div>
          <dl className="grid gap-5 border-t pt-6 sm:grid-cols-3 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-8">
            {metrics.map((metric) => (
              <div key={metric.label} className="min-w-0 space-y-2">
                <dt className="text-muted-foreground text-xs leading-relaxed font-medium sm:text-sm">
                  {metric.label}
                </dt>
                <dd className="text-base leading-snug font-semibold break-words tabular-nums xl:text-lg">
                  {formatCurrency(metric.value)}
                </dd>
                <p className="text-muted-foreground text-xs leading-relaxed">{metric.note}</p>
              </div>
            ))}
          </dl>
        </CardContent>
        <div
          className="bg-muted/50 mx-6 rounded-lg p-4 text-sm sm:mx-8"
          aria-label="Perhitungan total revenue"
        >
          <p className="font-medium tabular-nums">
            {formatCurrency(totalGross)} − {formatCurrency(totalFees)} ={' '}
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            Pembayaran pelanggan dikurangi biaya proses. Hanya invoice lunas, berdasarkan tanggal
            pembayaran dalam WIB; jadwal main dapat berada di hari lain. Angka ini belum dikurangi
            biaya operasional.
          </p>
        </div>
      </Card>

      <Card className="gap-5 py-6">
        <CardHeader className="px-6 sm:px-8">
          <CardTitle className="text-base">Rincian total revenue</CardTitle>
          <CardDescription>Setiap transaksi dihitung pada sumber pembayarannya.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm" aria-label="Rincian revenue per sumber">
              <thead>
                <tr className="text-muted-foreground border-b">
                  {['Sumber', 'Transaksi', 'Pembayaran pelanggan', 'Biaya proses', 'Revenue'].map(
                    (label, index) => (
                      <th
                        key={label}
                        scope="col"
                        className={`px-3 py-3 font-medium ${index === 0 ? 'text-left' : 'text-right'}`}
                      >
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {details.map((row) => (
                  <tr key={row.key} className="border-b last:border-b-0">
                    <th scope="row" className="px-3 py-3 text-left font-medium">
                      {row.title}
                    </th>
                    <td className="px-3 py-3 text-right tabular-nums">{row.count}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.gross === null ? '—' : formatCurrency(row.gross)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.processingFee === null ? '—' : formatCurrency(row.processingFee)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">
                      {formatCurrency(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/40 border-t font-semibold">
                  <th scope="row" className="px-3 py-3 text-left">
                    Total
                  </th>
                  <td className="px-3 py-3 text-right tabular-nums">{totalTransactions}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatCurrency(totalGross)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(totalFees)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatCurrency(totalRevenue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
            Online dan kasir mencakup nilai invoice booking setelah diskon/promo, termasuk layanan
            tambahan yang ada di invoice. Membership menghitung pembelian paket; pemakaian kuota
            Value Pack tidak dihitung sebagai pembayaran baru. Tanda — berarti biaya per sumber
            belum tersedia.
          </p>
        </CardContent>
      </Card>

      <section aria-labelledby="income-sources-title" className="space-y-4">
        <div className="space-y-1.5">
          <h3 id="income-sources-title" className="text-base font-semibold">
            Sumber revenue
          </h3>
          <p className="text-muted-foreground text-sm">
            Kontribusi revenue setelah biaya proses, berdasarkan kanal booking dan pembelian
            membership.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sourceConfigs.map((config) => {
            const sourceData = bySource[config.key] || {
              count: 0,
              total: fallbackSourceTotals[config.key] || 0
            };
            const Icon = config.icon;
            const percentage = totalRevenue
              ? ((sourceData.total / totalRevenue) * 100).toFixed(1)
              : '0.0';

            return (
              <Card
                key={config.key}
                role="article"
                aria-label={config.title}
                className="gap-6 py-5"
              >
                <CardHeader className="flex flex-row items-center justify-between gap-3 px-5">
                  <CardTitle className="text-sm leading-snug font-medium">{config.title}</CardTitle>
                  <div className={cn('shrink-0 rounded-xl p-2.5', config.bgColor)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-5">
                  <div className="space-y-2">
                    <p className="text-2xl leading-tight font-semibold tracking-tight break-words tabular-nums">
                      {formatCurrency(sourceData.total)}
                    </p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {sourceData.count || 0} transaksi
                      <span className="mx-2" aria-hidden="true">
                        ·
                      </span>
                      {percentage}% dari total
                    </p>
                  </div>
                  <div className="bg-muted h-1.5 overflow-hidden rounded-full" aria-hidden="true">
                    <div
                      className={cn('h-full rounded-full', config.barColor)}
                      style={{ width: `${Math.min(100, Math.max(0, Number(percentage)))}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
      <IncomeTransactionTable
        key={`${data.dateRange?.startDate ?? ''}:${data.dateRange?.endDate ?? ''}`}
        transactions={data.transactions}
      />
    </div>
  );
}
