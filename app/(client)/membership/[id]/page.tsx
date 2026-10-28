'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { SanitizedHtml } from '@/components/ui/sanitized-html';
import { Skeleton } from '@/components/ui/skeleton';
import { membershipTypeDescriptions, membershipTypeLabels } from '@/lib/membership-hours';
import { membershipQueryOptions } from '@/queries/membership';
import { profileQueryOptions } from '@/queries/profile';
import useAuthModalStore from '@/stores/useAuthModalStore';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React from 'react';
import { ArrowUpRight, Check } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
});

const formatCurrency = (value: number) => currencyFormatter.format(value).replace(/\s/g, '');

export default function MembershipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const membershipId = resolvedParams.id;

  const { data: membership, isPending: isMembershipLoading } = useQuery(
    membershipQueryOptions(membershipId)
  );
  const { data: user, isPending: isUserPending } = useQuery(profileQueryOptions);
  const openAuthModal = useAuthModalStore((state) => state.open);

  const isAuthenticated = !!user?.id;

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    // Store membership ID in sessionStorage for checkout page
    sessionStorage.setItem('membershipCheckoutId', membershipId);
    router.push('/membership/checkout');
  };

  const pageClassName =
    'value-pack-page mx-auto w-full max-w-7xl px-5 pt-24 pb-[calc(7rem+env(safe-area-inset-bottom))] text-[#171717] sm:px-8 lg:pb-16 xl:pt-32';

  if (isMembershipLoading) {
    return (
      <>
        <MainHeader backHref="/membership" />
        <main className={pageClassName} aria-label="Memuat detail paket">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <Skeleton className="h-80 w-full rounded-none" />
            <Skeleton className="h-60 w-full rounded-none" />
          </div>
        </main>
      </>
    );
  }

  if (!membership) {
    return (
      <>
        <MainHeader backHref="/membership" />
        <main className={pageClassName}>
          <section className="border border-dashed border-black/20 bg-[#f8f8f6] px-5 py-14 text-center">
            <h1 className="text-xl font-medium">Paket tidak ditemukan</h1>
            <Button
              className="mt-6 h-12 rounded-full bg-[#111111] px-6 text-white hover:bg-black/80"
              onClick={() => router.push('/membership')}
            >
              Lihat Value Pack
            </Button>
          </section>
        </main>
      </>
    );
  }

  const hourlyPrice =
    membership.sessions > 0 ? Math.round(membership.price / membership.sessions) : null;

  return (
    <>
      <MainHeader backHref="/membership" />
      <main className={pageClassName}>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-7">
          <div className="min-w-0 space-y-5">
            <section className="border border-black/15 bg-[#f8f8f6] p-5 sm:p-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-[10px] font-medium tracking-[0.12em] uppercase">
                <span className="text-black/45">
                  {membership.sport === 'TENNIS' ? 'Tennis' : 'Padel'} / Value Pack
                </span>
                <span className="border border-[#ad422b]/25 px-2.5 py-1.5 text-[#ad422b]">
                  {membership.isActive ? 'Tersedia' : 'Tidak tersedia'}
                </span>
              </div>
              <h1 className="text-2xl leading-tight font-medium tracking-tight break-words uppercase sm:text-3xl">
                {membership.name}
              </h1>
              <p className="mt-5 text-3xl font-medium tracking-[-0.04em] tabular-nums sm:text-4xl">
                {formatCurrency(membership.price)}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                <span className="text-[#ad422b]">{membershipTypeLabels[membership.type]}</span>
                <span className="h-3 border-l border-black/20" aria-hidden="true" />
                <span className="text-black/50">{membershipTypeDescriptions[membership.type]}</span>
              </div>
              <dl className="mt-6 grid grid-cols-2 border-y border-black/15 py-5">
                <div className="border-r border-black/15 pr-4">
                  <dt className="mb-2 text-[10px] tracking-wider text-black/45 uppercase">
                    Waktu bermain
                  </dt>
                  <dd className="text-2xl font-medium">
                    {membership.sessions}{' '}
                    <span className="text-xs font-normal text-black/50">jam</span>
                  </dd>
                </div>
                <div className="pl-5">
                  <dt className="mb-2 text-[10px] tracking-wider text-black/45 uppercase">
                    Masa berlaku
                  </dt>
                  <dd className="text-2xl font-medium">
                    {membership.duration}{' '}
                    <span className="text-xs font-normal text-black/50">hari</span>
                  </dd>
                </div>
              </dl>
              {hourlyPrice !== null && (
                <p className="mt-4 text-xs text-black/50">
                  Setara{' '}
                  <span className="font-medium text-[#ad422b]">{formatCurrency(hourlyPrice)}</span>{' '}
                  / jam
                </p>
              )}
            </section>

            {!!membership.benefits?.length && (
              <section className="border border-black/15 p-5 sm:p-8">
                <h2 className="text-lg font-medium tracking-tight">Termasuk dalam paket</h2>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {membership.benefits.map((benefit) => (
                    <li
                      key={benefit.id}
                      className="flex items-start gap-3 text-sm leading-relaxed text-black/60"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-[#ad422b]"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 break-words">{benefit.benefit}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {membership.contentHtml && (
              <section className="border border-black/15 p-5 sm:p-8">
                <h2 className="mb-4 text-lg font-medium tracking-tight">Detail paket</h2>
                <SanitizedHtml
                  className="prose prose-sm prose-headings:font-medium prose-headings:text-[#171717] prose-a:text-[#ad422b] max-w-none text-sm leading-relaxed break-words text-black/60"
                  html={membership.contentHtml}
                />
              </section>
            )}

            <section className="border border-black/15 bg-[#f8f8f6] p-5 sm:p-8">
              <h2 className="text-lg font-medium tracking-tight">Informasi penting</h2>
              <ul className="mt-4 list-disc space-y-2 pl-4 text-xs leading-relaxed text-black/50 marker:text-[#ad422b]">
                <li>Value Pack berlaku selama {membership.duration} hari sejak tanggal aktivasi</li>
                <li>Total {membership.sessions} jam dapat digunakan dalam periode aktif</li>
                <li>Jam yang tidak terpakai akan hangus setelah masa aktif berakhir</li>
                <li>Value Pack tidak dapat dikembalikan atau dipindahtangankan</li>
              </ul>
            </section>
          </div>

          <aside
            aria-label="Pembelian paket"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-black/15 bg-[#f8f8f6] px-5 pb-[env(safe-area-inset-bottom)] lg:sticky lg:inset-x-auto lg:top-28 lg:z-auto lg:border lg:p-6 lg:pb-6"
          >
            <h2 className="hidden text-lg font-medium tracking-tight lg:block">
              Ringkasan pembelian
            </h2>
            <p className="mt-4 hidden text-sm text-black/55 lg:block">{membership.name}</p>
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 lg:mt-5 lg:h-auto lg:flex-col lg:items-stretch lg:gap-6 lg:border-t lg:border-black/15 lg:pt-5">
              <div className="min-w-0 lg:flex lg:items-center lg:justify-between lg:gap-3">
                <p className="text-[10px] text-black/50 lg:text-xs">Total pembayaran</p>
                <p className="mt-1 text-xl font-medium tracking-tight tabular-nums lg:mt-0">
                  {formatCurrency(membership.price)}
                </p>
              </div>
              <Button
                onClick={handleBuyNow}
                disabled={!membership.isActive || isUserPending}
                className="h-12 shrink-0 gap-2 rounded-full bg-[#111111] px-5 text-xs text-white shadow-none hover:bg-black/80 has-[>svg]:px-5 lg:w-full"
              >
                {membership.isActive ? 'Beli sekarang' : 'Tidak tersedia'}
                {membership.isActive && (
                  <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                )}
              </Button>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
