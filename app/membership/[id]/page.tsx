'use client';

import React from 'react';
import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { membershipQueryOptions } from '@/queries/membership';
import { profileQueryOptions } from '@/queries/profile';
import useAuthModalStore from '@/stores/useAuthModalStore';
import { IconCheck } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Editor } from '@/components/blocks/editor-00/editor';

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
        <MainHeader title="Detail Membership" backHref="/valuepack" withLogo={false} />
        <main className="mx-auto mt-28 w-11/12 max-w-4xl pb-12">
          <div className="text-muted-foreground py-10 text-center">Membership tidak ditemukan</div>
        </main>
      </>
    );
  }

  return (
    <>
      <MainHeader title="Detail Membership" backHref="/valuepack" withLogo={false} />
      <main className="mx-auto mt-28 w-11/12 max-w-4xl space-y-6 pb-12">
        {/* Membership Header Card */}
        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold uppercase">{membership.name}</CardTitle>
            {membership.description && (
              <p className="text-muted-foreground text-sm">{membership.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-primary text-3xl font-bold">
                {formatCurrency(membership.price)}
              </span>
              <span className="text-muted-foreground text-sm">/ {membership.duration} hari</span>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
              <div>
                <p className="text-muted-foreground text-xs">Jumlah Sesi</p>
                <p className="text-lg font-semibold">{membership.sessions} sesi</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Durasi</p>
                <p className="text-lg font-semibold">{membership.duration} hari</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Card */}
        {membership.benefits && membership.benefits.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Keuntungan</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {membership.benefits.map((benefit) => (
                  <li key={benefit.id} className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary mt-0.5 rounded-full p-1">
                      <IconCheck className="h-4 w-4" />
                    </div>
                    <span className="flex-1 text-sm">{benefit.benefit}</span>
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
              <CardTitle>Deskripsi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{membership.content}</p>
              <Editor
                editorSerializedState={
                  membership.content ? JSON.parse(membership.content) : undefined
                }
                onHtmlGenerated={(html) => {
                  console.log('🚀 ~ MembershipDetailPage ~ html:', html);
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Buy Button - Fixed at bottom */}
        <div className="fixed right-0 bottom-0 left-0 border-t bg-white p-4 shadow-lg">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-xs">Total Pembayaran</p>
              <p className="text-primary text-xl font-bold">{formatCurrency(membership.price)}</p>
            </div>
            <Button
              size="lg"
              className="flex-1 md:flex-initial"
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
