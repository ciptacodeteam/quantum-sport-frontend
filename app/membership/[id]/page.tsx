'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_BADGE_VARIANT, STATUS_MAP } from '@/lib/constants';
import { membershipQueryOptions } from '@/queries/membership';
import { profileQueryOptions } from '@/queries/profile';
import useAuthModalStore from '@/stores/useAuthModalStore';
import { IconCheck } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React from 'react';

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

  if (isMembershipLoading) {
    return (
      <>
        <MainHeader title="Detail Membership" backHref="/valuepack" withLogo={false} />
        <main className="mx-auto mt-28 w-11/12 max-w-4xl space-y-4 pb-12">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </>
    );
  }

  if (!membership) {
    return (
      <>
        <MainHeader title="Detail Membership" backHref="/membership" withLogo={false} />
        <main className="mx-auto mt-28 w-11/12 max-w-4xl pb-12">
          <div className="text-muted-foreground py-10 text-center">Membership tidak ditemukan</div>
        </main>
      </>
    );
  }

  return (
    <>
      <MainHeader title="Detail Membership" backHref="/membership" withLogo={false} />
      <main className="mx-auto mt-28 w-11/12 max-w-4xl space-y-4 pb-32 sm:space-y-6">
        {/* Membership Header Card */}
        <Card className="overflow-hidden py-0">
          <div className="from-primary/10 via-primary/5 bg-linear-to-br to-transparent p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex-1">
                <CardTitle className="mb-2 text-xl font-bold tracking-tight uppercase sm:text-2xl lg:text-3xl">
                  {membership.name}
                </CardTitle>
                {membership.description && (
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {membership.description}
                  </p>
                )}
              </div>
              {membership.isActive && (
                <Badge
                  variant={STATUS_BADGE_VARIANT[Number(membership.isActive)]}
                  className="w-fit"
                >
                  {STATUS_MAP[Number(membership.isActive)]}
                </Badge>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-baseline gap-2 sm:mt-6">
              <span className="text-primary text-2xl font-extrabold sm:text-3xl lg:text-4xl">
                {formatCurrency(membership.price)}
              </span>
              <span className="text-muted-foreground text-sm sm:text-base">
                untuk {membership.duration} hari
              </span>
            </div>
          </div>

          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
              {/* Sessions Info */}
              <div className="bg-card flex items-center gap-3 rounded-lg border p-3 sm:p-4">
                <div className="bg-primary/10 text-primary rounded-lg p-2 sm:p-2.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-bold sm:text-2xl">{membership.sessions}</p>
                  <p className="text-muted-foreground text-xs">Total Sesi</p>
                </div>
              </div>

              {/* Duration Info */}
              <div className="bg-card flex items-center gap-3 rounded-lg border p-3 sm:p-4">
                <div className="bg-primary/10 text-primary rounded-lg p-2 sm:p-2.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-bold sm:text-2xl">{membership.duration}</p>
                  <p className="text-muted-foreground text-xs">Hari Aktif</p>
                </div>
              </div>

              {/* Price per Session */}
              <div className="bg-card flex items-center gap-3 rounded-lg border p-3 sm:p-4">
                <div className="bg-primary/10 text-primary rounded-lg p-2 sm:p-2.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold sm:text-lg">
                    {formatCurrency(Math.round(membership.price / membership.sessions))}
                  </p>
                  <p className="text-muted-foreground text-xs">Per Sesi</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Card */}
        {membership.benefits && membership.benefits.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Benefit & Keuntungan</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                {membership.benefits.map((benefit) => (
                  <li
                    key={benefit.id}
                    className="bg-muted/30 flex items-start gap-2.5 rounded-lg border p-2.5 sm:gap-3 sm:p-3"
                  >
                    <div className="bg-primary/10 text-primary mt-0.5 rounded-full p-1 shadow-sm">
                      <IconCheck className="h-4 w-4 stroke-3" />
                    </div>
                    <span className="flex-1 text-sm leading-relaxed">{benefit.benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Content Card */}
        {membership.content && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <span>Detail Membership</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: membership?.contentHtml ?? '' }}
              ></div>
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="space-y-1 text-xs sm:text-sm">
                <p className="font-medium">Informasi Penting:</p>
                <ul className="text-muted-foreground space-y-1 text-xs sm:text-sm">
                  <li>
                    • Membership berlaku selama {membership.duration} hari sejak tanggal aktivasi
                  </li>
                  <li>• Total {membership.sessions} sesi dapat digunakan dalam periode aktif</li>
                  <li>• Sesi yang tidak terpakai akan hangus setelah masa aktif berakhir</li>
                  <li>• Membership tidak dapat dikembalikan atau dipindahtangankan</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buy Button - Fixed at bottom */}
        <div className="fixed right-0 bottom-0 left-0 z-50 border-t bg-white p-3 shadow-lg sm:p-4">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center justify-between sm:block">
              <p className="text-muted-foreground text-xs">Total Pembayaran</p>
              <p className="text-primary text-lg font-bold sm:text-xl">
                {formatCurrency(membership.price)}
              </p>
            </div>
            <Button
              size="lg"
              className="w-full sm:w-auto sm:min-w-[180px]"
              onClick={handleBuyNow}
              disabled={!membership.isActive || isUserPending}
            >
              {!membership.isActive ? 'Tidak Tersedia' : 'Beli Sekarang'}
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
