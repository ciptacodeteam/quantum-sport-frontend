'use client';

import MainHeader from '@/components/headers/MainHeader';
import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { profileQueryOptions } from '@/queries/profile';
import { myMembershipTrackingQueryOptions } from '@/queries/membership';
import { groupBookingSchedule } from '@/lib/booking-schedule';
import { membershipTypeLabels } from '@/lib/membership-hours';
import dayjs from '@/lib/dayjs';
import type { TrackedPackage } from '@/types/membership-tracking';
import type { ApiErrorResponse } from '@/lib/api-error';
import useAuthModalStore from '@/stores/useAuthModalStore';
import useAuthRedirectStore from '@/stores/useAuthRedirectStore';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, CalendarDays, Crown, LoaderCircle } from 'lucide-react';
import BranchLink from '@/components/branches/BranchLink';
import { useState, type ReactNode } from 'react';

const labels: Record<TrackedPackage['status'], string> = {
  ACTIVE: 'Aktif',
  PENDING: 'Menunggu pembayaran',
  PAYMENT_FAILED: 'Pembelian tidak selesai',
  EXPIRED: 'Kedaluwarsa',
  SUSPENDED: 'Ditangguhkan',
  EXHAUSTED: 'Jam habis',
  UPCOMING: 'Belum dimulai'
};
const number = (value: number) => value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
const hours = (value: string) => value.slice(11).replace(':', '.');
function PackageSummary({ pack }: { pack: TrackedPackage }) {
  const statusClass = ['ACTIVE', 'PENDING', 'UPCOMING'].includes(pack.status)
    ? 'text-[#ad422b]'
    : 'text-black/50';

  return (
    <span className="block min-w-0 flex-1 text-left">
      <span className="block text-sm leading-5 font-medium break-words whitespace-normal">
        {pack.name}
      </span>
      <span className="mt-0.5 block text-xs leading-5 font-normal whitespace-normal text-black/50">
        {pack.sport === 'TENNIS' ? 'Tennis' : 'Padel'} · {membershipTypeLabels[pack.type]}
        <span className="mx-1.5 text-black/25" aria-hidden="true">
          ·
        </span>
        <span className={statusClass}>{labels[pack.status]}</span>
      </span>
    </span>
  );
}
function PageState({
  title,
  children,
  action
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center border border-black/10 bg-[#f8f8f6] px-5 py-10 text-center sm:p-12">
      <Crown className="mb-5 size-9 text-[#ad422b]" strokeWidth={1.25} aria-hidden="true" />
      <h2 className="text-xl font-medium tracking-tight">{title}</h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-black/50">{children}</p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
function UsageRow({ usage }: { usage: TrackedPackage['usage'][number] }) {
  const groups = groupBookingSchedule(usage.details);
  const cancelled = usage.status === 'CANCELLED';
  const held = usage.status === 'HOLD';
  const content = (
    <>
      <div className="flex min-w-0 items-start justify-between gap-4 border-b border-black/10 pb-4">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] tracking-wider text-black/45 uppercase">Invoice</p>
          <h3 className="text-sm font-medium break-all">
            {usage.invoiceNumber || 'Booking tanpa invoice'}
          </h3>
          <p className={`mt-1.5 text-xs ${held ? 'text-[#ad422b]' : 'text-black/45'}`}>
            {cancelled ? 'Dibatalkan' : held ? 'Menunggu pembayaran' : 'Booked'}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="mb-1 text-[10px] text-black/45">
            {cancelled ? 'Pemakaian' : held ? 'Jam ditahan' : 'Potongan jam'}
          </p>
          <p
            className={`text-sm font-medium tabular-nums ${cancelled ? 'text-black/35' : 'text-[#171717]'}`}
          >
            {cancelled ? '—' : `${held ? '' : '−'}${number(usage.hours)} jam`}
          </p>
        </div>
      </div>
      {usage.branch && (
        <p className="mt-4 text-xs font-medium text-[#ad422b]">{usage.branch.name}</p>
      )}
      <div className="space-y-4 pt-4">
        {groups.map((group) => (
          <div key={group.date}>
            <p className="mb-2 text-xs font-medium text-black/65">
              {dayjs(`${group.date}T12:00:00`).format('D MMM YYYY')}
            </p>
            <div className="space-y-2">
              {group.courts.map((court) => (
                <div
                  key={court.id}
                  className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs leading-5 text-black/50"
                >
                  <span>{court.name}</span>
                  <span className="tabular-nums">
                    {court.ranges
                      .map((range) => `${hours(range.start)} - ${hours(range.end)}`)
                      .join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!groups.length && <p className="text-xs text-black/45">Rincian jadwal belum tersedia.</p>}
      </div>
    </>
  );
  return usage.invoiceNumber ? (
    <BranchLink
      href={`/invoice/${encodeURIComponent(usage.invoiceNumber)}`}
      className="block border border-black/15 p-4 transition-colors hover:border-[#ad422b]/40 focus-visible:outline-2 focus-visible:outline-[#ad422b] sm:p-5"
    >
      {content}
    </BranchLink>
  ) : (
    <div className="border border-black/15 p-4 sm:p-5">{content}</div>
  );
}

export default function MyPackagesPage() {
  const { data: user, isPending: profilePending } = useQuery(profileQueryOptions);
  const staff = !!user && 'role' in user;
  const [selectedId, setSelectedId] = useState('');
  const openAuth = useAuthModalStore((state) => state.open);
  const setRedirect = useAuthRedirectStore((state) => state.setRedirectPath);
  const { data, isPending, isError, error, isFetching, refetch } = useQuery({
    ...myMembershipTrackingQueryOptions(user?.id || 'guest'),
    enabled: !profilePending && !!user?.id && !staff,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => (error as ApiErrorResponse)?.code !== 401 && failureCount < 2
  });
  const packs = data?.packages || [];
  const pack =
    packs.find((item) => item.id === selectedId) ||
    packs.find((item) => item.status === 'ACTIVE') ||
    packs[0];
  const expiredSession = isError && (error as ApiErrorResponse)?.code === 401;
  const signIn = () => {
    setRedirect('/my-packages');
    openAuth();
  };
  const actionClass = 'h-12 rounded-full bg-[#111111] px-7 text-sm text-white hover:bg-black/80';
  return (
    <div className="flex min-h-dvh flex-col bg-white text-[#171717]">
      <MainHeader />
      <main className="my-packages-page mx-auto w-full max-w-7xl flex-1 px-5 pt-24 pb-6 sm:px-8 lg:pb-12 xl:pt-32">
        <header className="mb-6 flex items-center justify-between gap-4 border-b border-black/15 pb-5">
          <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">Paket Saya</h1>
          <BranchLink
            href="/membership"
            className="flex items-center gap-1 text-xs text-[#ad422b] hover:underline"
          >
            Lihat paket
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </BranchLink>
        </header>
        {!profilePending && (!user?.id || staff || expiredSession) ? (
          <PageState
            title={
              staff
                ? 'Paket untuk akun pelanggan'
                : expiredSession
                  ? 'Sesi Anda telah berakhir'
                  : 'Masuk untuk melihat paket'
            }
            action={
              staff ? (
                <Button asChild className={actionClass}>
                  <BranchLink href="/profile">Kembali ke profil</BranchLink>
                </Button>
              ) : (
                <Button className={actionClass} onClick={signIn}>
                  Masuk ke akun
                </Button>
              )
            }
          >
            {staff
              ? 'Gunakan akun pelanggan untuk melihat paket dan pemakaian jam bermain.'
              : 'Lihat sisa jam, masa berlaku, dan riwayat pemakaian Value Pack Anda.'}
          </PageState>
        ) : profilePending || (isPending && !data) ? (
          <div role="status" className="border border-black/10 bg-[#f8f8f6] p-6">
            <p className="flex items-center gap-2 text-sm text-black/50">
              <LoaderCircle
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Memuat paket Anda…
            </p>
            <div
              className="mt-6 grid gap-5 motion-safe:animate-pulse lg:grid-cols-[320px_1fr]"
              aria-hidden="true"
            >
              <div className="h-40 bg-black/5" />
              <div className="h-56 bg-black/5" />
            </div>
          </div>
        ) : isError && !data ? (
          <PageState
            title="Paket belum dapat dimuat"
            action={
              <Button className={actionClass} onClick={() => void refetch()} disabled={isFetching}>
                Coba lagi
              </Button>
            }
          >
            Terjadi kendala saat mengambil data paket. Silakan coba lagi.
          </PageState>
        ) : !pack ? (
          <PageState
            title="Belum ada paket"
            action={
              <Button asChild className={actionClass}>
                <BranchLink href="/membership">Lihat Value Pack</BranchLink>
              </Button>
            }
          >
            Paket yang Anda beli dan riwayat penggunaannya akan muncul di sini.
          </PageState>
        ) : (
          <>
            {packs.length > 1 && (
              <div className="mb-6 max-w-md">
                <label
                  htmlFor="package-selector"
                  className="mb-2 block text-xs font-medium text-black/55"
                >
                  Pilih paket
                </label>
                <Select value={pack.id} onValueChange={setSelectedId}>
                  <SelectTrigger
                    id="package-selector"
                    className="h-auto w-full gap-3 rounded-none border-black/15 bg-white px-4 py-3 text-left text-[#171717] shadow-none transition-[border-color,box-shadow] hover:border-black/30 focus-visible:border-[#ad422b] focus-visible:ring-[#ad422b]/10 data-[size=default]:h-auto data-[state=open]:border-[#ad422b] [&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180"
                  >
                    <span className="min-w-0 flex-1">
                      <SelectValue>
                        <PackageSummary pack={pack} />
                      </SelectValue>
                    </span>
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    sideOffset={6}
                    className="w-(--radix-select-trigger-width) rounded-none border-black/15 bg-white text-[#171717] shadow-sm"
                  >
                    {packs.map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.id}
                        textValue={`${item.name} · ${labels[item.status]}`}
                        className="cursor-pointer rounded-none px-3 py-3 focus:bg-[#f8f8f6] focus:text-[#171717] data-[state=checked]:bg-[#f8f8f6] [&>span:first-child]:hidden [&>span:last-child]:min-w-0 [&>span:last-child]:flex-1"
                      >
                        <PackageSummary pack={item} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <section
                aria-label="Saldo paket"
                className="min-w-0 border border-black/15 bg-[#f8f8f6] p-5 sm:p-6 lg:sticky lg:top-28"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[10px] tracking-wider text-black/45 uppercase">
                    {pack.sport === 'TENNIS' ? 'Tennis' : 'Padel'} ·{' '}
                    {membershipTypeLabels[pack.type]}
                  </p>
                  <span className="text-xs text-[#ad422b]">{labels[pack.status]}</span>
                </div>
                <h2 className="text-xl font-medium tracking-tight break-words">{pack.name}</h2>
                <dl className="mt-6">
                  <div>
                    <dt className="text-xs text-black/45">
                      {['PENDING', 'PAYMENT_FAILED'].includes(pack.status)
                        ? 'Jam paket'
                        : 'Sisa waktu bermain'}
                    </dt>
                    <dd className="mt-2 text-4xl font-medium tracking-tight tabular-nums">
                      {number(
                        ['PENDING', 'PAYMENT_FAILED'].includes(pack.status)
                          ? pack.totalHours
                          : pack.remainingHours
                      )}{' '}
                      <span className="text-sm font-normal text-black/45">
                        / {number(pack.totalHours)} jam
                      </span>
                    </dd>
                  </div>
                  {!['PENDING', 'PAYMENT_FAILED'].includes(pack.status) && (
                    <div className="mt-5 space-y-3 border-t border-black/15 pt-5 text-xs">
                      <div className="flex justify-between gap-4">
                        <dt className="text-black/45">Terpakai pada booking</dt>
                        <dd>{number(pack.usedHours)} jam</dd>
                      </div>
                      {!!pack.debtTransferredHours && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-black/45">Minus dialihkan ke paket baru</dt>
                          <dd>{number(pack.debtTransferredHours)} jam</dd>
                        </div>
                      )}
                      {!!pack.debtSettledHours && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-black/45">Kuota untuk pelunasan minus</dt>
                          <dd>{number(pack.debtSettledHours)} jam</dd>
                        </div>
                      )}
                      {pack.heldHours > 0 && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-black/45">Ditahan untuk pembayaran</dt>
                          <dd>{number(pack.heldHours)} jam</dd>
                        </div>
                      )}
                      <div className="flex flex-wrap justify-between gap-2">
                        <dt className="text-black/45">Berlaku hingga</dt>
                        <dd>{dayjs(pack.endDate).tz('Asia/Jakarta').format('D MMM YYYY')}</dd>
                      </div>
                    </div>
                  )}
                </dl>
                {pack.status === 'PENDING' && pack.purchaseInvoice && (
                  <Button
                    asChild
                    className="mt-6 h-11 w-full rounded-full bg-[#111111] text-xs text-white"
                  >
                    <BranchLink
                      href={`/invoice/${encodeURIComponent(pack.purchaseInvoice.number)}`}
                    >
                      Lanjutkan pembayaran
                    </BranchLink>
                  </Button>
                )}
                {pack.status === 'ACTIVE' && (
                  <Button
                    asChild
                    className="mt-6 h-11 w-full rounded-full bg-[#111111] text-xs text-white"
                  >
                    <BranchLink href={pack.sport === 'TENNIS' ? '/booking/tennis' : '/booking'}>
                      Gunakan paket
                    </BranchLink>
                  </Button>
                )}
              </section>
              <section aria-labelledby="usage-title" className="min-w-0">
                <h2 id="usage-title" className="mb-5 text-lg font-medium tracking-tight">
                  Riwayat pemakaian
                </h2>
                {pack.usage.length ? (
                  <div className="space-y-3">
                    {pack.usage.map((usage) => (
                      <UsageRow key={usage.id} usage={usage} />
                    ))}
                  </div>
                ) : (
                  <div className="border-y border-black/15 py-8">
                    <CalendarDays
                      className="mb-4 size-7 text-[#ad422b]"
                      strokeWidth={1.25}
                      aria-hidden="true"
                    />
                    <h3 className="text-base font-medium">Belum ada pemakaian tercatat</h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-black/50">
                      Booking yang menggunakan paket ini akan tampil di sini, beserta lapangan,
                      jadwal, dan jumlah jamnya.
                    </p>
                  </div>
                )}
                {pack.heldHours > 0 && (
                  <p className="mt-5 text-xs leading-relaxed text-black/45">
                    Jam yang ditahan sudah mengurangi saldo tersedia selama booking menunggu
                    pembayaran.
                  </p>
                )}
              </section>
            </div>
          </>
        )}
      </main>
      <MainBottomNavigation />
    </div>
  );
}
