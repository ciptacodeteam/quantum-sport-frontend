'use client';

import { MembershipHoursDescription } from '@/components/booking/MembershipHoursDescription';

import MainHeader from '@/components/headers/MainHeader';
import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import { Button } from '@/components/ui/button';
import { membershipTypeLabels } from '@/lib/membership-hours';
import { membershipsQueryOptions } from '@/queries/membership';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type MembershipSport = 'PADEL' | 'TENNIS';

const sportLabels: Record<MembershipSport, string> = {
  PADEL: 'Padel',
  TENNIS: 'Tennis'
};

export default function MembershipPage() {
  const { data, isLoading, isError, refetch } = useQuery(membershipsQueryOptions());
  const showSportTabs = true;
  const [sportChoice, setSelectedSport] = useState<MembershipSport>('PADEL');
  const selectedSport = sportChoice;
  const memberships = useMemo(
    () => (data ?? []).filter((pack) => pack.isActive && (pack.sport ?? 'PADEL') === selectedSport),
    [data, selectedSport]
  );

  return (
    <>
      <MainHeader backHref="/" title="Value Pack" withLogo={false} withBorder />
      <main className="value-pack-page mx-auto w-full max-w-7xl px-5 pt-24 pb-8 text-[#171717] sm:px-8 lg:pb-16 xl:pt-32">
        {showSportTabs && (
          <div
            className="mb-6 grid grid-cols-2 border-b border-black/15 sm:max-w-lg"
            role="group"
            aria-label="Jenis olahraga"
          >
            {(['PADEL', 'TENNIS'] as const).map((sport) => (
              <button
                key={sport}
                type="button"
                aria-pressed={selectedSport === sport}
                onClick={() => setSelectedSport(sport)}
                className={`relative min-h-12 px-2 pb-3 text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ad422b] ${selectedSport === sport ? 'font-medium text-[#171717] after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-[#ad422b]' : 'text-black/40 hover:text-black/75'}`}
              >
                {sportLabels[sport]}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            role="status"
            aria-label="Memuat Value Pack"
          >
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-96 animate-pulse border border-black/10 bg-[#f8f8f6] p-6 motion-reduce:animate-none"
              >
                <div className="mb-8 h-5 w-1/2 bg-black/5" />
                <div className="mb-8 h-10 w-2/3 bg-black/5" />
                <div className="h-24 bg-black/5" />
              </div>
            ))}
            <span className="sr-only">Memuat paket...</span>
          </div>
        )}

        {isError && !isLoading && (
          <div role="alert" className="border border-black/15 bg-[#f8f8f6] px-6 py-12 text-center">
            <h2 className="text-lg font-medium">Paket belum dapat dimuat</h2>
            <p className="mt-2 text-sm text-black/50">
              Silakan coba lagi untuk melihat paket yang tersedia.
            </p>
            <Button
              onClick={() => refetch()}
              className="mt-5 rounded-full bg-[#111111] px-6 text-white hover:bg-black/80"
            >
              Coba lagi
            </Button>
          </div>
        )}

        {!isLoading && !isError && memberships.length === 0 && (
          <div className="border border-dashed border-black/20 bg-[#f8f8f6] px-6 py-16 text-center">
            <h2 className="text-xl font-medium tracking-tight">
              Belum ada paket {sportLabels[selectedSport]}
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-black/50">
              Paket untuk kategori ini belum tersedia. Silakan cek kembali nanti atau lihat kategori
              lainnya.
            </p>
          </div>
        )}

        {!isLoading && !isError && memberships.length > 0 && (
          <section
            aria-label={`Paket ${sportLabels[selectedSport]}`}
            className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {memberships.map((pack) => (
              <article
                key={pack.id}
                className="flex min-w-0 flex-col border border-black/15 bg-[#f8f8f6] p-6 transition-colors hover:border-black/35 sm:p-7"
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium tracking-[0.12em] uppercase">
                  <span className="text-black/45">{sportLabels[selectedSport]} / Value Pack</span>
                  <span className="border border-[#ad422b]/20 px-2 py-1 text-[#ad422b]">
                    {membershipTypeLabels[pack.type]}
                  </span>
                </div>
                <h2 className="text-xl leading-tight font-medium tracking-tight break-words uppercase">
                  {pack.name}
                </h2>
                <div className="mt-5 mb-6">
                  <p className="text-3xl font-medium tracking-[-0.04em] tabular-nums">
                    Rp{pack.price.toLocaleString('id-ID')}
                  </p>
                  <p className="mt-2 text-xs text-black/50">
                    <MembershipHoursDescription shared type={pack.type} sport={pack.sport} />
                  </p>
                </div>
                <dl className="mb-4 grid grid-cols-2 border-y border-black/15 py-4">
                  <div className="border-r border-black/15 pr-4">
                    <dt className="mb-1 text-[10px] tracking-wider text-black/45 uppercase">
                      Waktu bermain
                    </dt>
                    <dd className="text-lg font-medium">
                      {pack.sessions} <span className="text-xs font-normal text-black/50">jam</span>
                    </dd>
                  </div>
                  <div className="pl-4">
                    <dt className="mb-1 text-[10px] tracking-wider text-black/45 uppercase">
                      Masa berlaku
                    </dt>
                    <dd className="text-lg font-medium">
                      {pack.duration}{' '}
                      <span className="text-xs font-normal text-black/50">hari</span>
                    </dd>
                  </div>
                </dl>
                <Button
                  className="mt-auto h-12 w-full rounded-full bg-[#111111] text-sm font-medium text-white hover:bg-black/80"
                  asChild
                >
                  <Link href={`/membership/${pack.id}`} aria-label={`Pilih paket ${pack.name}`}>
                    Pilih paket{' '}
                    <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  </Link>
                </Button>
              </article>
            ))}
          </section>
        )}
      </main>
      <MainBottomNavigation />
    </>
  );
}
