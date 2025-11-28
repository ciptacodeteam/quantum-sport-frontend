'use client';

import MainHeader from '@/components/headers/MainHeader';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, resolveMediaUrl } from '@/lib/utils';
import { membershipCheckoutMutationOptions } from '@/mutations/membership';
import { membershipQueryOptions } from '@/queries/membership';
import { paymentMethodsQueryOptions } from '@/queries/paymentMethod';
import { profileQueryOptions } from '@/queries/profile';
import useAuthModalStore from '@/stores/useAuthModalStore';
import type { PaymentMethod } from '@/types/model';
import { IconCheck } from '@tabler/icons-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
});

const formatCurrency = (value: number) => currencyFormatter.format(value).replace(/\s/g, '');
const PAYMENT_METHOD_STORAGE_KEY = 'membership-selected-payment';

export default function MembershipCheckoutPage() {
  const router = useRouter();
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  const { data: user, isPending: isUserPending } = useQuery(profileQueryOptions);
  const { data: membership, isPending: isMembershipLoading } = useQuery({
    ...membershipQueryOptions(membershipId || ''),
    enabled: !!membershipId
  });
  const { data: paymentMethods = [], isPending: isLoadingPaymentMethods } = useQuery(
    paymentMethodsQueryOptions()
  );

  const isAuthenticated = !!user?.id;
  const openAuthModal = useAuthModalStore((state) => state.open);

  // Get membership ID from sessionStorage
  useEffect(() => {
    const storedId = sessionStorage.getItem('membershipCheckoutId');
    if (!storedId) {
      router.push('/membership');
      return;
    }
    setMembershipId(storedId);
  }, [router]);

  const readStoredPaymentMethodId = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(PAYMENT_METHOD_STORAGE_KEY);
  }, []);

  const persistPaymentMethodId = useCallback((methodId: string | null) => {
    if (typeof window === 'undefined') return;
    if (methodId) {
      sessionStorage.setItem(PAYMENT_METHOD_STORAGE_KEY, methodId);
    } else {
      sessionStorage.removeItem(PAYMENT_METHOD_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (paymentMethods.length === 0) return;

    setSelectedPaymentMethod((current) => {
      if (current) {
        const stillExists = paymentMethods.find((method) => method.id === current.id);
        if (stillExists) {
          return stillExists;
        }
      }

      const storedId = readStoredPaymentMethodId();
      if (storedId) {
        const stored = paymentMethods.find((method) => method.id === storedId);
        if (stored) return stored;
      }

      return paymentMethods[0] ?? null;
    });
  }, [paymentMethods, readStoredPaymentMethodId]);

  useEffect(() => {
    persistPaymentMethodId(selectedPaymentMethod?.id ?? null);
  }, [selectedPaymentMethod, persistPaymentMethodId]);

  // Check authentication
  useEffect(() => {
    if (!isUserPending && !isAuthenticated) {
      openAuthModal();
    }
  }, [isUserPending, isAuthenticated, openAuthModal]);

  const checkoutMutation = useMutation(
    membershipCheckoutMutationOptions({
      onSuccess: (data) => {
        // Clear session storage
        sessionStorage.removeItem('membershipCheckoutId');
        persistPaymentMethodId(null);

        // Redirect to invoice page using the invoice number from response
        const invoiceNumber = data?.data?.invoiceNumber;
        if (invoiceNumber) {
          router.push(`/invoice/${invoiceNumber}`);
        }
      }
    })
  );

  const paymentFeeBreakdown = (() => {
    if (!selectedPaymentMethod || !membership) {
      return {
        fixedFee: 0,
        percentageRate: 0,
        percentageFee: 0,
        totalFee: 0
      };
    }

    const percentageRate = Number(selectedPaymentMethod.percentage ?? 0);
    const fixedFee = Number.isFinite(selectedPaymentMethod.fees)
      ? Number(selectedPaymentMethod.fees)
      : 0;
    const percentageFee = Math.round((membership.price * percentageRate) / 100);

    return {
      fixedFee,
      percentageRate,
      percentageFee,
      totalFee: Math.round(fixedFee + percentageFee)
    };
  })();

  const totalWithPaymentFee = (membership?.price || 0) + paymentFeeBreakdown.totalFee;

  const handlePaymentMethodClick = () => {
    setPaymentModalOpen(true);
  };

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setPaymentModalOpen(false);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (!selectedPaymentMethod || !membershipId) {
      return;
    }

    checkoutMutation.mutate({
      membershipId,
      paymentMethodId: selectedPaymentMethod.id
    });
  };

  if (isMembershipLoading || !membership) {
    return (
      <>
        <MainHeader title="Checkout Membership" backHref="/membership" withLogo={false} withBorder/>
        <main className="mx-auto mt-24 w-11/12 max-w-4xl space-y-4 mb-32">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </>
    );
  }

  return (
    <>
      <MainHeader title="Checkout Membership" backHref="/membership" withLogo={false} withBorder/>
      <main className="mx-auto flex w-11/12 max-w-4xl flex-col gap-6 pt-24 pb-32">
        {/* Membership Summary */}
        <div className="border-muted space-y-4 rounded-lg border bg-white p-4">
          <header className="space-y-1">
            <h2 className="text-primary text-base font-semibold">{membership.name}</h2>
            {membership.description && (
              <p className="text-muted-foreground text-sm">{membership.description}</p>
            )}
          </header>

          <div className="border-muted/60 flex items-center gap-6 border-t border-dashed pt-3">
            <div>
              <p className="text-muted-foreground text-xs">Jumlah Jam</p>
              <p className="text-sm font-semibold">{membership.sessions} jam</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Durasi</p>
              <p className="text-sm font-semibold">{membership.duration} hari</p>
            </div>
          </div>

          {membership.benefits && membership.benefits.length > 0 && (
            <div className="border-muted/60 space-y-2 border-t border-dashed pt-3">
              <p className="text-muted-foreground text-xs">Keuntungan</p>
              <ul className="space-y-1.5">
                {membership.benefits.slice(0, 3).map((benefit) => (
                  <li key={benefit.id} className="flex items-start gap-2 text-sm">
                    <IconCheck className="text-primary mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="text-muted-foreground">{benefit.benefit}</span>
                  </li>
                ))}
                {membership.benefits.length > 3 && (
                  <li className="text-muted-foreground pl-5 text-xs">
                    +{membership.benefits.length - 3} benefit lainnya
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Payment Method Selection */}
        <div className="border-muted rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedPaymentMethod ? (
                resolveMediaUrl(selectedPaymentMethod.logo) ? (
                  <Image
                    src={resolveMediaUrl(selectedPaymentMethod.logo)!}
                    alt={selectedPaymentMethod.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-md object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-md text-sm font-semibold">
                    {selectedPaymentMethod.name.slice(0, 2).toUpperCase()}
                  </div>
                )
              ) : null}
              <div>
                <p className="text-sm font-medium">
                  {selectedPaymentMethod ? selectedPaymentMethod.name : 'Pilih Metode Pembayaran'}
                </p>
                <p className="text-muted-foreground text-xs">
                  {selectedPaymentMethod
                    ? 'Konfirmasi Instan'
                    : 'Klik untuk memilih metode pembayaran'}
                </p>
              </div>
            </div>
            <Button variant="link" className="text-primary px-0" onClick={handlePaymentMethodClick}>
              {selectedPaymentMethod ? 'Ganti Metode' : 'Pilih'}
            </Button>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="border-muted mb-5 rounded-lg border bg-white p-4">
          <h3 className="mb-3 text-base font-semibold">Ringkasan Pembayaran</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground font-medium">
                {formatCurrency(membership.price)}
              </span>
            </div>
            {selectedPaymentMethod && paymentFeeBreakdown.totalFee > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Biaya Layanan</span>
                <span className="text-foreground font-medium">
                  {formatCurrency(paymentFeeBreakdown.totalFee)}
                </span>
              </div>
            )}
            <div className="border-muted flex items-center justify-between border-t border-dashed pt-2 text-base font-semibold">
              <span>Total Pembayaran</span>
              <span className="text-primary">{formatCurrency(totalWithPaymentFee)}</span>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        <Dialog open={isPaymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-semibold">
                Pilih Metode Pembayaran
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {isLoadingPaymentMethods ? (
                <div className="text-muted-foreground py-6 text-center text-sm">
                  Memuat metode pembayaran...
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-muted-foreground py-6 text-center text-sm">
                  Tidak ada metode pembayaran tersedia
                </div>
              ) : (
                paymentMethods.map((method) => {
                  const percentage = Number(method.percentage ?? 0);
                  const baseFee = Number.isFinite(method.fees) ? method.fees : 0;
                  const feesValue = Math.round(
                    baseFee + ((membership?.price || 0) * percentage) / 100
                  );
                  const isSelected = selectedPaymentMethod?.id === method.id;

                  return (
                    <button
                      key={method.id}
                      onClick={() => handleSelectPaymentMethod(method)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md border p-4 transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-muted hover:border-primary/60 hover:bg-muted/10'
                      )}
                    >
                      {/* Kiri: Logo + Nama */}
                      <div className="flex items-center gap-4">
                        {resolveMediaUrl(method.logo) ? (
                          <Image
                            src={resolveMediaUrl(method.logo)!}
                            alt={method.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-md bg-white object-contain p-1"
                            unoptimized
                          />
                        ) : (
                          <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-md text-sm font-semibold">
                            {method.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="flex flex-col items-start">
                          <p className="text-foreground text-sm leading-tight font-semibold">
                            {method.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Biaya {formatCurrency(feesValue)}
                          </p>
                        </div>
                      </div>

                      {/* Kanan: Biaya dan Radio */}
                      <div>
                        <div
                          className={cn(
                            'mt-1 flex h-5 w-5 items-center justify-center rounded-full border transition-all',
                            isSelected ? 'border-primary bg-primary' : 'border-muted bg-background'
                          )}
                        >
                          {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <BottomNavigationWrapper className="pb-4">
        <div className="mx-auto w-11/12 py-4 lg:max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs">Total Pembayaran</p>
              <p className="text-primary text-lg font-semibold">
                {formatCurrency(totalWithPaymentFee)}
              </p>
            </div>
            <Button
              size="lg"
              className="min-w-40"
              onClick={handleCheckout}
              disabled={(!selectedPaymentMethod || checkoutMutation.isPending) && isAuthenticated}
            >
              {isUserPending
                ? 'Memuat...'
                : !isAuthenticated
                  ? 'Login untuk Checkout'
                  : checkoutMutation.isPending
                    ? 'Memproses...'
                    : selectedPaymentMethod
                      ? 'Bayar Sekarang'
                      : 'Pilih Metode'}
            </Button>
          </div>
        </div>
      </BottomNavigationWrapper>
    </>
  );
}
