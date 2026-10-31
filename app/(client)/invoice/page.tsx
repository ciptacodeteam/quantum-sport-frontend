'use client';

import { Button } from '@/components/ui/button';
import MainHeader from '@/components/headers/MainHeader';
import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import { getStatusColor, getStatusLabel } from '@/components/invoice/status';
import { invoicesQueryOptions } from '@/queries/invoice';
import { profileQueryOptions } from '@/queries/profile';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import dayjs from '@/lib/dayjs';
import { groupBookingSchedule } from '@/lib/booking-schedule';
import { CalendarDays, ArrowUpRight, LoaderCircle } from 'lucide-react';
import type { Invoice } from '@/types/model';
import useAuthModalStore from '@/stores/useAuthModalStore';
import type { ApiErrorResponse } from '@/lib/api-error';

const currency = (value: number) => `Rp${Number(value).toLocaleString('id-ID')}`;

function HistoryEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  onShowAll
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  onShowAll?: () => void;
}) {
  return (
    <section
      className="flex flex-col items-center justify-center border border-black/10 bg-[#f8f8f6] px-5 py-9 text-center sm:px-10 sm:py-12"
      aria-label="Riwayat kosong"
    >
      <CalendarDays className="mb-5 size-10 text-[#ad422b]" strokeWidth={1.25} aria-hidden="true" />
      <h2 className="max-w-sm text-xl font-medium tracking-tight text-[#171717] sm:text-2xl">
        {title}
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-black/50">{description}</p>
      <Button
        onClick={onAction}
        className="mt-7 h-12 gap-3 rounded-full bg-[#111111] px-7 text-sm text-white shadow-none hover:bg-black/80 has-[>svg]:px-7"
      >
        {actionLabel}
        <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </Button>
      {onShowAll && (
        <button
          onClick={onShowAll}
          className="mt-4 min-h-10 text-xs text-black/50 underline-offset-4 hover:text-black hover:underline focus-visible:outline-2 focus-visible:outline-[#ad422b]"
        >
          Lihat semua riwayat
        </button>
      )}
    </section>
  );
}

function HistoryItem({ invoice }: { invoice: Invoice }) {
  const membership = invoice.membershipUser?.membership;
  const details = invoice.booking?.details || [];
  const pending = ['PENDING', 'HOLD', 'AWAITING_CONFIRMATION'].includes(invoice.status);
  const schedule = groupBookingSchedule(details).flatMap(({ date, courts }) =>
    courts.map((court) => ({ date, ...court }))
  );
  return (
    <Link
      href={`/invoice/${encodeURIComponent(invoice.number)}`}
      className="group flex min-w-0 flex-col border border-black/15 bg-white p-5 transition-colors hover:border-[#ad422b]/50 focus-visible:outline-2 focus-visible:outline-[#ad422b] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 text-lg font-medium tracking-tight break-words">Invoice</h2>
        <span className={`shrink-0 border px-2 py-1 text-[10px] ${getStatusColor(invoice.status)}`}>
          {getStatusLabel(invoice.status)}
        </span>
      </div>
      <p className="mt-1 text-xs break-all text-black/45">{invoice.number}</p>
      {invoice.branch && !membership && (
        <p className="mt-2 text-xs text-[#ad422b]">{invoice.branch.name}</p>
      )}
      <div className="my-4 flex-1 border-y border-black/10 py-3 text-sm">
        {membership ? (
          <p className="text-black/55">
            {typeof membership.sessions === 'number' && typeof membership.duration === 'number' ? (
              <>
                {membership.sessions} jam bermain <span className="mx-2 text-black/20">/</span>{' '}
                {membership.duration} hari
              </>
            ) : (
              'Detail paket tersedia pada invoice.'
            )}
          </p>
        ) : details.length ? (
          <div className="space-y-2">
            {schedule.slice(0, 2).map((group, index) => (
              <div key={index} className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                <span className="text-black/55">
                  {dayjs(`${group.date}T12:00:00`).format('D MMM YYYY')}
                  {schedule.length > 1 && <span className="ml-2 text-xs">· {group.name}</span>}
                </span>
                <span className="tabular-nums">
                  {group.ranges
                    .map(
                      (range) =>
                        `${range.start.slice(11).replace(':', '.')} - ${range.end.slice(11).replace(':', '.')}`
                    )
                    .join(', ')}
                </span>
              </div>
            ))}
            {schedule.length > 2 && (
              <p className="text-xs text-black/45">+{schedule.length - 2} jadwal lainnya</p>
            )}
          </div>
        ) : (
          <p className="text-black/55">Peralatan dan layanan tambahan</p>
        )}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-black/45">Total pembayaran</p>
          <p className="mt-1 text-xl font-medium tracking-tight">{currency(invoice.total)}</p>
        </div>
        <span className="flex min-h-10 items-center gap-2 text-xs text-[#ad422b]">
          {pending ? 'Lanjutkan pembayaran' : 'Lihat detail'}
          <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export default function InvoiceHistoryPage() {
  const router = useRouter();
  const { data: user, isPending: isUserPending } = useQuery(profileQueryOptions);
  const isAuthenticated = !!user?.id;
  const isStaffAccount = !!user && 'role' in user;
  const openAuthModal = useAuthModalStore((state) => state.open);

  const {
    data: response,
    isPending,
    isError,
    error,
    refetch
  } = useQuery({
    ...invoicesQueryOptions({ sort: 'createdAt', order: 'desc' }),
    queryKey: ['invoices', { sort: 'createdAt', order: 'desc' }, user?.id ?? 'guest'],
    enabled: !isUserPending && isAuthenticated && !isStaffAccount,
    retry: (failureCount, error) => (error as ApiErrorResponse)?.code !== 401 && failureCount < 2
  });
  const isSessionExpired = isError && (error as ApiErrorResponse)?.code === 401;

  // Invoices data + filter hooks (placed before any early returns)
  const invoices = useMemo(() => (response?.data as Invoice[]) ?? [], [response]);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MEMBERSHIP' | 'BOOKING'>('ALL');
  const filteredInvoices = useMemo(() => {
    if (!Array.isArray(invoices)) return [] as Invoice[];
    if (typeFilter === 'MEMBERSHIP') return invoices.filter((inv) => !!inv.membershipUser);
    if (typeFilter === 'BOOKING') return invoices.filter((inv) => !!inv.booking);
    return invoices;
  }, [invoices, typeFilter]);

  const needsAccount = !isUserPending && (!isAuthenticated || isStaffAccount || isSessionExpired);
  const loading = !needsAccount && (isPending || isUserPending);
  const filters = [
    { key: 'ALL', label: 'Semua' },
    { key: 'MEMBERSHIP', label: 'Value Pack' },
    { key: 'BOOKING', label: 'Pemesanan' }
  ] as const;
  return (
    <div className="flex min-h-dvh flex-col bg-white text-[#171717]">
      <MainHeader withBranchLabel={typeFilter !== 'MEMBERSHIP'} />
      <main className="history-page mx-auto w-full max-w-7xl flex-1 px-5 pt-24 pb-6 sm:px-8 lg:pb-12 xl:pt-32">
        {needsAccount ? (
          <div className="mx-auto max-w-2xl">
            <HistoryEmptyState
              title={
                isStaffAccount
                  ? 'Riwayat untuk akun pelanggan'
                  : isSessionExpired
                    ? 'Sesi Anda telah berakhir'
                    : 'Masuk untuk melihat riwayat'
              }
              description={
                isStaffAccount
                  ? 'Anda sedang masuk sebagai staf. Gunakan akun pelanggan untuk melihat riwayat pemesanan pribadi.'
                  : isSessionExpired
                    ? 'Silakan masuk kembali untuk melihat riwayat pemesanan Anda.'
                    : 'Masuk untuk melihat seluruh riwayat pemesanan Anda.'
              }
              actionLabel={isStaffAccount ? 'Kembali ke profil' : 'Masuk ke akun'}
              onAction={isStaffAccount ? () => router.push('/profile') : openAuthModal}
            />
          </div>
        ) : loading ? (
          <div role="status" aria-live="polite">
            <p className="mb-5 flex items-center gap-2 text-sm text-black/50">
              <LoaderCircle
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Memuat riwayat…
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className="space-y-4 border border-black/10 bg-[#f8f8f6] p-6 motion-safe:animate-pulse"
                >
                  <div className="h-3 w-24 bg-black/10" />
                  <div className="h-5 w-2/3 bg-black/10" />
                  <div className="h-16 bg-black/5" />
                  <div className="h-5 w-1/3 bg-black/10" />
                </div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="mx-auto max-w-2xl">
            <HistoryEmptyState
              title="Riwayat belum dapat dimuat"
              description="Terjadi kendala saat mengambil riwayat pemesanan. Silakan coba lagi."
              actionLabel="Coba lagi"
              onAction={() => void refetch()}
            />
          </div>
        ) : (
          <>
            {invoices.length > 0 && (
              <div
                role="group"
                aria-label="Filter jenis pemesanan"
                className="mb-6 grid grid-cols-3 border-b border-black/15 sm:max-w-lg"
              >
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    aria-pressed={typeFilter === filter.key}
                    onClick={() => setTypeFilter(filter.key)}
                    className={`relative min-h-12 px-2 pb-3 text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ad422b] ${typeFilter === filter.key ? 'font-medium text-[#171717] after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-[#ad422b]' : 'text-black/40 hover:text-black/75'}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
            {filteredInvoices.length === 0 ? (
              <div className="mx-auto max-w-2xl">
                <HistoryEmptyState
                  title={
                    typeFilter === 'MEMBERSHIP'
                      ? 'Belum ada pembelian Value Pack'
                      : typeFilter === 'BOOKING'
                        ? 'Belum ada pemesanan'
                        : 'Belum ada riwayat pemesanan'
                  }
                  description={
                    typeFilter === 'MEMBERSHIP'
                      ? 'Paket yang Anda beli akan muncul di sini.'
                      : typeFilter === 'BOOKING'
                        ? 'Riwayat pemesanan lapangan akan muncul di sini.'
                        : 'Pilih jadwal bermain atau perlengkapan untuk memulai pemesanan pertama Anda.'
                  }
                  actionLabel={typeFilter === 'MEMBERSHIP' ? 'Lihat Value Pack' : 'Mulai bermain'}
                  onAction={() =>
                    router.push(typeFilter === 'MEMBERSHIP' ? '/membership' : '/booking')
                  }
                  onShowAll={typeFilter !== 'ALL' ? () => setTypeFilter('ALL') : undefined}
                />
              </div>
            ) : (
              <>
                <div className="grid items-stretch gap-4 lg:grid-cols-2">
                  {filteredInvoices.map((invoice) => (
                    <HistoryItem key={invoice.id} invoice={invoice} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
      <MainBottomNavigation />
    </div>
  );
}
