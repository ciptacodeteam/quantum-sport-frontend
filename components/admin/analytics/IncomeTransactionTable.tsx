'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  customerName: string;
  branchName: string;
  source: string;
  paymentMethod: string | null;
  paidAt: string | null;
  amount: number;
  processingFee: number;
  netAmount: number;
};

const sourceLabels: Record<string, string> = {
  Online: 'Online Booking',
  Cashier: 'Cashier Booking',
  Membership: 'Membership',
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

export default function IncomeTransactionTable({
  transactions,
  embedded = false,
  title = 'Rincian transaksi customer',
  description = 'Invoice lunas yang membentuk angka revenue di atas, berdasarkan tanggal pembayaran (WIB) pada periode dan cabang pilihan. Satu baris untuk satu invoice.'
}: {
  transactions?: IncomeTransaction[];
  embedded?: boolean;
  title?: string;
  description?: string;
}) {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all');
  const [page, setPage] = useState(1);
  const rows = transactions ?? [];
  const term = search.trim().toLocaleLowerCase('id-ID');
  const filtered = rows.filter(
    (row) =>
      (source === 'all' || row.source === source) &&
      `${row.customerName} ${row.invoiceNumber} ${row.branchName} ${row.paymentMethod ?? ''}`
        .toLocaleLowerCase('id-ID')
        .includes(term)
  );
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
        <CardDescription>{description}</CardDescription>
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
                    <tr key={row.id} className="border-b last:border-b-0">
                      <th scope="row" className="px-3 py-3 text-left font-normal">
                        <p className="font-medium">{row.customerName}</p>
                        <Link
                          href={`/admin/kelola-transaksi/${row.id}`}
                          className="text-primary text-xs underline underline-offset-4"
                        >
                          {row.invoiceNumber}
                        </Link>
                      </th>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {paymentTime(row.paidAt)}
                        {row.paidAt ? ' WIB' : ''}
                      </td>
                      <td className="px-3 py-3">{row.branchName}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {sourceLabels[row.source] ?? row.source}
                      </td>
                      <td className="px-3 py-3">{row.paymentMethod ?? '—'}</td>
                      <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">
                        {formatCurrency(row.processingFee)}
                      </td>
                      <td className="px-3 py-3 text-right font-medium whitespace-nowrap tabular-nums">
                        {formatCurrency(row.netAmount)}
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-muted-foreground py-10 text-center">
                        {hasFilters
                          ? 'Tidak ada transaksi yang sesuai filter.'
                          : 'Tidak ada transaksi lunas pada periode ini.'}
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
              Baris total menjumlahkan seluruh hasil di semua halaman. Pencarian dan filter di tabel
              ini tidak mengubah ringkasan revenue di atas.
            </p>
          </>
        )}
      </CardContent>
    </Container>
  );
}
