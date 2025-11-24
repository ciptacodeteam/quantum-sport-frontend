'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, resolveMediaUrl } from '@/lib/utils';
import { membershipCheckoutMutationOptions } from '@/mutations/membership';
import { membershipQueryOptions } from '@/queries/membership';
import { paymentMethodsQueryOptions } from '@/queries/paymentMethod';
import { profileQueryOptions } from '@/queries/profile';
import useAuthModalStore from '@/stores/useAuthModalStore';
import type { PaymentMethod } from '@/types/model';
import { IconCheck, IconChevronRight } from '@tabler/icons-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
});

const formatCurrency = (value: number) => currencyFormatter.format(value).replace(/\s/g, '');

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
      router.push('/valuepack');
      return;
    }
    setMembershipId(storedId);
  }, [router]);

  // Set default payment method
  useEffect(() => {
    if (paymentMethods.length === 0) return;

    if (!selectedPaymentMethod) {
      setSelectedPaymentMethod(paymentMethods[0]);
      return;
    }

    const stillExists = paymentMethods.find((method) => method.id === selectedPaymentMethod.id);
    if (!stillExists) {
      setSelectedPaymentMethod(paymentMethods[0]);
    }
  }, [paymentMethods, selectedPaymentMethod]);

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
        <MainHeader title="Checkout Membership" backHref="/valuepack" withLogo={false} />
        <main className="mx-auto mt-28 w-11/12 max-w-4xl space-y-4 pb-12">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </>
    );
  }

  return (
    <>
      <MainHeader title="Checkout Membership" backHref="/valuepack" withLogo={false} />
      <main className="mx-auto mt-28 w-11/12 max-w-4xl space-y-6 pb-32">
        {/* Membership Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Membership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold uppercase">{membership.name}</h3>
              {membership.description && (
                <p className="text-muted-foreground text-sm">{membership.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
              <div>
                <p className="text-muted-foreground text-xs">Jumlah Jam</p>
                <p className="font-semibold">{membership.sessions} jam</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Durasi</p>
                <p className="font-semibold">{membership.duration} hari</p>
              </div>
            </div>

            {membership.benefits && membership.benefits.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Keuntungan:</p>
                <ul className="space-y-2">
                  {membership.benefits.slice(0, 3).map((benefit) => (
                    <li key={benefit.id} className="flex items-start gap-2 text-sm">
                      <IconCheck className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-muted-foreground">{benefit.benefit}</span>
                    </li>
                  ))}
                  {membership.benefits.length > 3 && (
                    <li className="text-muted-foreground text-xs">
                      +{membership.benefits.length - 3} benefit lainnya
                    </li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPaymentMethods ? (
              <div className="flex items-center justify-center py-8">
                <Skeleton className="h-16 w-full" />
              </div>
            ) : selectedPaymentMethod ? (
              <button
                onClick={handlePaymentMethodClick}
                className="flex w-full items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {selectedPaymentMethod.logo && (
                    <Image
                      src={resolveMediaUrl(selectedPaymentMethod.logo) || ''}
                      unoptimized
                      alt={selectedPaymentMethod.name}
                      width={64}
                      height={32}
                      className="h-8 w-auto object-contain"
                    />
                  )}
                  <div className="text-left">
                    <p className="font-medium">{selectedPaymentMethod.name}</p>
                    {selectedPaymentMethod.channel && (
                      <p className="text-muted-foreground text-xs">
                        {selectedPaymentMethod.channel}
                      </p>
                    )}
                  </div>
                </div>
                <IconChevronRight className="text-muted-foreground h-5 w-5" />
              </button>
            ) : (
              <Button onClick={handlePaymentMethodClick} variant="outline" className="w-full">
                Pilih Metode Pembayaran
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(membership.price)}</span>
            </div>

            {selectedPaymentMethod && paymentFeeBreakdown.totalFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Biaya Layanan</span>
                <span className="font-medium">{formatCurrency(paymentFeeBreakdown.totalFee)}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Total Pembayaran</span>
              <span className="text-primary">{formatCurrency(totalWithPaymentFee)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Modal */}
        <Dialog open={isPaymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pilih Metode Pembayaran</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleSelectPaymentMethod(method)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border p-4 transition-colors',
                    selectedPaymentMethod?.id === method.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {method.logo && (
                      <Image
                        src={resolveMediaUrl(method.logo) || ''}
                        unoptimized
                        alt={method.name}
                        width={64}
                        height={32}
                        className="h-8 w-auto object-contain"
                      />
                    )}
                    <div className="text-left">
                      <p className="font-medium">{method.name}</p>
                      {method.channel && (
                        <p className="text-muted-foreground text-xs">{method.channel}</p>
                      )}
                    </div>
                  </div>
                  {selectedPaymentMethod?.id === method.id && (
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <IconCheck className="h-4 w-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </main>

      {/* Fixed Bottom Checkout Button */}
      <div className="fixed right-0 bottom-0 left-0 border-t bg-white p-4 shadow-lg">
        <div className="mx-auto flex max-w-4xl flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs">Total Pembayaran</p>
              <p className="text-primary text-xl font-bold">
                {formatCurrency(totalWithPaymentFee)}
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleCheckout}
              disabled={!selectedPaymentMethod || checkoutMutation.isPending || !isAuthenticated}
              className="flex-1 md:flex-initial"
            >
              {checkoutMutation.isPending ? 'Memproses...' : 'Bayar Sekarang'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
