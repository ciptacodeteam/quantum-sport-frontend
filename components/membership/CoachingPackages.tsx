'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { myCoachingPackagesQueryOptions } from '@/queries/coaching-packages';
import type { ApiErrorResponse } from '@/lib/api-error';
import { formatBookingDate, formatBookingSlotDate } from '@/lib/booking-display';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import BranchLink from '@/components/branches/BranchLink';

const number = (value: number) => value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
const labels = { ACTIVE: 'Aktif', EXHAUSTED: 'Jam habis', SUSPENDED: 'Coach tidak aktif' };

export default function CoachingPackages({
  userId,
  onSignIn
}: {
  userId: string;
  onSignIn: () => void;
}) {
  const [selectedId, setSelectedId] = useState('');
  const query = useQuery({
    ...myCoachingPackagesQueryOptions(userId),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    retry: (count, error) => (error as ApiErrorResponse)?.code !== 401 && count < 2
  });
  const expiredSession = query.isError && (query.error as ApiErrorResponse)?.code === 401;
  const packages = query.data?.packages ?? [];
  const pack =
    packages.find((item) => item.id === selectedId) ||
    packages.find((item) => item.status === 'ACTIVE') ||
    packages[0];
  if (expiredSession)
    return (
      <div className="border border-black/10 bg-[#f8f8f6] p-6 text-center">
        <h2 className="text-xl font-medium">Sesi Anda telah berakhir</h2>
        <Button className="mt-5 rounded-full" onClick={onSignIn}>
          Masuk ke akun
        </Button>
      </div>
    );
  if (query.isPending)
    return (
      <p role="status" className="border border-black/10 bg-[#f8f8f6] p-6 text-sm text-black/50">
        Memuat paket coaching Anda…
      </p>
    );
  if (query.isError && !query.data)
    return (
      <div role="alert" className="border border-black/10 bg-[#f8f8f6] p-6 text-center">
        <h2 className="text-xl font-medium">Paket coaching belum dapat dimuat</h2>
        <p className="mt-3 text-sm text-black/50">
          Silakan coba lagi untuk melihat kuota dan riwayat sesi Anda.
        </p>
        <Button
          className="mt-5 rounded-full"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Coba lagi
        </Button>
      </div>
    );
  if (!pack)
    return (
      <div className="border border-black/10 bg-[#f8f8f6] px-5 py-10 text-center">
        <h2 className="text-xl font-medium">Belum ada paket coaching</h2>
        <p className="mt-3 text-sm leading-relaxed text-black/50">
          Paket coaching in-house yang Anda beli dan riwayat pemakaiannya akan muncul di sini.
        </p>
      </div>
    );
  return (
    <>
      {packages.length > 1 && (
        <div className="mb-6 max-w-md">
          <label
            htmlFor="coach-package-selector"
            className="mb-2 block text-xs font-medium text-black/55"
          >
            Pilih paket coach
          </label>
          <Select value={pack.id} onValueChange={setSelectedId}>
            <SelectTrigger
              id="coach-package-selector"
              className="h-auto w-full rounded-none border-black/15 py-3 whitespace-normal"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {packages.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} · {item.coachName} · {labels[item.status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section
          aria-label="Saldo paket coaching"
          className="min-w-0 border border-black/15 bg-[#f8f8f6] p-5 sm:p-6 lg:sticky lg:top-28"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <p className="text-black/45">
              {pack.coachType === 'TENNIS'
                ? 'Tennis'
                : pack.coachType === 'PADEL_TENNIS'
                  ? 'Padel & Tennis'
                  : 'Padel'}{' '}
              · Coaching in-house
            </p>
            <span className="text-[#ad422b]">{labels[pack.status]}</span>
          </div>
          <h2 className="text-xl font-medium tracking-tight break-words">{pack.name}</h2>
          <p className="mt-2 text-sm font-medium">{pack.coachName}</p>
          <p className="mt-1 text-xs text-black/50">{pack.branchName}</p>
          <dl className="mt-6">
            <div>
              <dt className="text-xs text-black/45">Sisa waktu coaching</dt>
              <dd className="mt-2 text-4xl font-medium tracking-tight tabular-nums">
                {number(pack.remainingHours)}{' '}
                <span className="text-sm font-normal text-black/45">
                  / {number(pack.totalHours)} jam
                </span>
              </dd>
            </div>
            <div className="mt-5 space-y-3 border-t border-black/15 pt-5 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-black/45">Terpakai pada sesi</dt>
                <dd>{number(pack.usedHours)} jam</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-black/45">Dibeli pada</dt>
                <dd>{formatBookingDate(pack.createdAt, 'D MMM YYYY')}</dd>
              </div>
            </div>
          </dl>
          {pack.purchaseInvoice && (
            <BranchLink
              className="mt-5 block text-xs text-[#ad422b] hover:underline"
              href={`/invoice/${encodeURIComponent(pack.purchaseInvoice.number)}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Invoice pembelian · {pack.purchaseInvoice.number}
            </BranchLink>
          )}
          <p className="mt-5 text-xs leading-relaxed text-black/50">
            Kuota berlaku untuk coach dan cabang pada paket ini. Hubungi admin untuk menjadwalkan
            sesi.
          </p>
        </section>
        <section aria-labelledby="coach-usage-title" className="min-w-0">
          <h2 id="coach-usage-title" className="mb-5 text-lg font-medium tracking-tight">
            Riwayat pemakaian coaching
          </h2>
          {pack.usage.length ? (
            <div className="space-y-3">
              {pack.usage.map((usage) => (
                <article key={usage.id} className="border border-black/15 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-4">
                    <div className="min-w-0">
                      {usage.invoiceNumber ? (
                        <BranchLink
                          className="text-sm font-medium break-all hover:underline"
                          href={`/invoice/${encodeURIComponent(usage.invoiceNumber)}`}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {usage.invoiceNumber}
                        </BranchLink>
                      ) : (
                        <p className="text-sm font-medium">Sesi tanpa invoice</p>
                      )}
                      <p className="mt-1.5 text-xs text-black/50">
                        {usage.restoredAt
                          ? 'Dibatalkan · kuota dikembalikan'
                          : usage.status === 'CANCELLED'
                            ? 'Dibatalkan · pengembalian kuota belum tercatat'
                            : usage.status === 'HOLD'
                              ? 'Ditahan'
                              : 'Terkonfirmasi'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <p className="mb-1 text-black/45">Pemakaian</p>
                      <p className="font-medium tabular-nums">
                        {usage.restoredAt ? '0 jam' : `−${number(usage.hours)} jam`}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-medium text-[#ad422b]">{usage.branchName}</p>
                  <p className="mt-3 text-sm">
                    {formatBookingSlotDate(usage.startAt, 'D MMM YYYY')} ·{' '}
                    {formatBookingSlotDate(usage.startAt, 'HH:mm')}–
                    {formatBookingSlotDate(usage.endAt, 'HH:mm')} WIB
                  </p>
                  <p className="mt-2 text-xs text-black/50">
                    {usage.courtName || 'Lapangan belum tersedia'} · {usage.participants} peserta
                  </p>
                  {usage.restoredAt && (
                    <p className="mt-3 text-xs text-black/50">
                      +{number(usage.hours)} jam dikembalikan pada{' '}
                      {formatBookingDate(usage.restoredAt, 'D MMM YYYY · HH:mm')} WIB.
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="border-y border-black/15 py-8">
              <h3 className="font-medium">Belum ada pemakaian coaching tercatat</h3>
              <p className="mt-2 text-sm leading-relaxed text-black/50">
                Sesi yang menggunakan paket ini akan tampil di sini beserta jadwal dan jumlah
                jamnya.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
