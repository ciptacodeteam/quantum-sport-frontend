'use client';

import PaymentLoading, { PaymentProcessingOverlay } from '@/components/invoice/PaymentLoading';
import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, resolveMediaUrl } from '@/lib/utils';
import { membershipCheckoutMutationOptions } from '@/mutations/membership';
import CreditCardForm, { type CreditCardFormData } from '@/components/forms/payment/CreditCardForm';
import { getCardToken } from '@/lib/midtrans';
import { membershipQueryOptions } from '@/queries/membership';
import { paymentMethodsQueryOptions } from '@/queries/paymentMethod';
import { profileQueryOptions } from '@/queries/profile';
import useAuthModalStore from '@/stores/useAuthModalStore';
import type { PaymentMethod } from '@/types/model';
import { Check } from 'lucide-react';
import { membershipTypeDescriptions, membershipTypeLabels } from '@/lib/membership-hours';
import { useMutation, useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
});

const formatCurrency = (value: number) => currencyFormatter.format(value).replace(/\s/g, '');
const PAYMENT_METHOD_STORAGE_KEY = 'membership-selected-payment';

export default function MembershipCheckoutPage() {
  const router = useRouter();
  const [isNavigatingToPayment, setNavigatingToPayment] = useState(false);
  const cardPayTab = useRef<Window | null>(null);
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cardDraft, setCardDraft] = useState<CreditCardFormData | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [isTokenizingCard, setTokenizingCard] = useState(false);

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
        sessionStorage.removeItem('membershipCheckoutId');
        persistPaymentMethodId(null);
        const paymentUrl = data?.data?.paymentUrl;
        const needsCard3ds =
          selectedPaymentMethod?.channel === 'CARDS' &&
          paymentUrl &&
          data?.data?.paymentStatus !== 'PAID';
        if (needsCard3ds) {
          const tab = cardPayTab.current;
          cardPayTab.current = null;
          if (tab && !tab.closed) {
            tab.location.href = paymentUrl;
            tab.opener = null;
          } else {
            setNavigatingToPayment(true);
            window.location.href = paymentUrl;
            return;
          }
        } else {
          cardPayTab.current?.close();
          cardPayTab.current = null;
        }
        const invoiceNumber = data?.data?.invoiceNumber;
        if (invoiceNumber) {
          setNavigatingToPayment(true);
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
    if (method.channel === 'CARDS') {
      setShowCardForm(true);
      return;
    }
    setCardDraft(null);
    setShowCardForm(false);
    setPaymentModalOpen(false);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (!selectedPaymentMethod || !membershipId) {
      return;
    }

    if (selectedPaymentMethod.channel === 'CARDS') {
      if (!cardDraft) {
        setShowCardForm(true);
        setPaymentModalOpen(true);
        return;
      }
      cardPayTab.current?.close();
      cardPayTab.current = window.open('', '_blank');
      setTokenizingCard(true);
      try {
        const tokenId = await getCardToken({
          cardNumber: cardDraft.cardNumber,
          expiryMonth: cardDraft.expiryMonth,
          expiryYear: cardDraft.expiryYear,
          cvv: cardDraft.cvv
        });
        checkoutMutation.mutate(
          {
            membershipId,
            paymentMethodId: selectedPaymentMethod.id,
            cardPayment: { tokenId }
          },
          {
            onError: () => {
              cardPayTab.current?.close();
              cardPayTab.current = null;
            }
          }
        );
      } catch (err: any) {
        cardPayTab.current?.close();
        cardPayTab.current = null;
        toast.error(err.message || 'Card processing failed. Please try again.');
      } finally {
        setTokenizingCard(false);
      }
      return;
    }

    checkoutMutation.mutate({
      membershipId,
      paymentMethodId: selectedPaymentMethod.id
    });
  };

  const checkoutAction = (
    <Button
      size="lg"
      className="h-12 w-full min-w-0 rounded-full bg-[#111111] px-3 text-xs font-medium text-white hover:bg-black/80 disabled:bg-black/15 disabled:text-black/40 disabled:opacity-100"
      onClick={handleCheckout}
      disabled={
        (!selectedPaymentMethod || checkoutMutation.isPending || isTokenizingCard) &&
        isAuthenticated
      }
    >
      {isUserPending
        ? 'Memuat...'
        : !isAuthenticated
          ? 'Login untuk Checkout'
          : isTokenizingCard
            ? 'Memproses Kartu...'
            : checkoutMutation.isPending
            ? 'Memproses...'
            : selectedPaymentMethod
              ? 'Bayar Sekarang'
              : 'Pilih Metode'}
    </Button>
  );

  if (isNavigatingToPayment) return <PaymentLoading />;
  if (isMembershipLoading || !membership)
    return (
      <>
        <MainHeader />
        <main className="checkout-page mx-auto w-full max-w-7xl px-5 pt-24 pb-32 sm:px-8 xl:pt-32">
          <div className="mb-6 border-b border-black/15 pb-5">
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">Checkout</h1>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
            <Skeleton className="h-64 w-full rounded-none" />
            <Skeleton className="h-64 w-full rounded-none" />
          </div>
        </main>
      </>
    );

  return (
    <div className="min-h-dvh">
      {(checkoutMutation.isPending || isTokenizingCard) && <PaymentProcessingOverlay />}
      <MainHeader />
      <main className="checkout-page mx-auto w-full max-w-7xl px-5 pt-24 pb-[calc(8rem+env(safe-area-inset-bottom))] text-[#171717] sm:px-8 lg:pb-16 xl:pt-32">
        <header className="mb-6 flex items-center justify-between gap-4 border-b border-black/15 pb-5">
          <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">Checkout</h1>
        </header>
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
          <div className="min-w-0 space-y-4">
            <section
              className="border border-black/15 bg-[#f8f8f6] p-5 sm:p-6"
              aria-label="Paket yang dipilih"
            >
              <p className="mb-3 text-[10px] tracking-[0.12em] text-[#ad422b] uppercase">
                Value Pack
                {membership.sport ? ` / ${membership.sport === 'TENNIS' ? 'Tennis' : 'Padel'}` : ''}
              </p>
              <h2 className="text-lg font-medium tracking-tight">{membership.name}</h2>
              <dl className="mt-5 grid grid-cols-2 gap-5 border-t border-black/15 pt-5">
                <div>
                  <dt className="text-xs text-black/45">Waktu bermain</dt>
                  <dd className="mt-1 text-lg font-medium">
                    {membership.sessions}{' '}
                    <span className="text-xs font-normal text-black/50">jam</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-black/45">Masa berlaku</dt>
                  <dd className="mt-1 text-lg font-medium">
                    {membership.duration}{' '}
                    <span className="text-xs font-normal text-black/50">hari</span>
                  </dd>
                </div>
              </dl>
              {membership.type && (
                <p className="mt-4 text-xs text-black/50">
                  {membershipTypeLabels[membership.type]} ·{' '}
                  {membershipTypeDescriptions[membership.type]}
                </p>
              )}
              {!!membership.benefits?.length && (
                <details className="mt-5 border-t border-black/15 pt-4">
                  <summary className="cursor-pointer text-xs text-black/55 marker:text-[#ad422b] focus-visible:outline-2 focus-visible:outline-[#ad422b]">
                    Benefit paket
                  </summary>
                  <ul className="mt-4 space-y-2">
                    {membership.benefits.map((benefit) => (
                      <li key={benefit.id} className="flex items-start gap-2 text-sm text-black/55">
                        <Check
                          className="mt-0.5 size-3.5 shrink-0 text-[#ad422b]"
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                        {benefit.benefit}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
            <section
              className="min-w-0 border border-black/15 bg-[#f8f8f6] p-5 sm:p-6"
              aria-label="Metode pembayaran"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  {selectedPaymentMethod &&
                    (resolveMediaUrl(selectedPaymentMethod.logo) ? (
                      <Image
                        src={resolveMediaUrl(selectedPaymentMethod.logo)!}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded-none object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="bg-muted text-muted-foreground flex h-12 w-12 shrink-0 items-center justify-center text-sm font-semibold">
                        {selectedPaymentMethod.name.slice(0, 2).toUpperCase()}
                      </div>
                    ))}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {selectedPaymentMethod?.name || 'Pilih Metode Pembayaran'}
                    </p>
                    <p className="mt-1 text-xs text-black/45">
                      {selectedPaymentMethod ? 'Konfirmasi Instan' : 'Pilih metode pembayaran Anda'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="link"
                  className="h-10 rounded-full border border-black/15 px-4 text-xs text-[#ad422b] no-underline hover:bg-black/5"
                  onClick={handlePaymentMethodClick}
                >
                  {selectedPaymentMethod ? 'Ganti Metode' : 'Pilih'}
                </Button>
              </div>
            </section>
          </div>
          <aside
            aria-label="Ringkasan pembayaran"
            className="min-w-0 border border-black/15 bg-[#f8f8f6] p-5 sm:p-6 lg:sticky lg:top-28"
          >
            <h2 className="mb-4 text-lg font-medium tracking-tight">Ringkasan pembayaran</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatCurrency(membership.price)}</dd>
              </div>
              {selectedPaymentMethod && paymentFeeBreakdown.totalFee > 0 && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Biaya Layanan</dt>
                  <dd className="font-medium">{formatCurrency(paymentFeeBreakdown.totalFee)}</dd>
                </div>
              )}
              <div className="flex items-end justify-between gap-4 border-t border-black/15 pt-4 text-sm font-medium">
                <dt>Total Pembayaran</dt>
                <dd className="text-[#ad422b]">{formatCurrency(totalWithPaymentFee)}</dd>
              </div>
            </dl>
            <div className="mt-5 hidden border-t border-black/15 pt-5 lg:block">
              {checkoutAction}
            </div>
          </aside>
        </div>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/15 bg-[#f8f8f6] px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-black/50">Total pembayaran</p>
            <p className="mt-1 text-xl font-medium tracking-tight tabular-nums">
              {formatCurrency(totalWithPaymentFee)}
            </p>
          </div>
          {checkoutAction}
        </div>
      </div>
      <Dialog open={isPaymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="auth-dialog max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-none border-black/15 bg-[#f8f8f6] p-5 text-[#171717] sm:max-w-lg sm:p-7">
          <DialogHeader>
            <DialogTitle className="pr-6 text-left text-xl font-medium tracking-tight text-[#171717]">
              Pilih Metode Pembayaran
            </DialogTitle>
          </DialogHeader>

          {showCardForm ? (
            <CreditCardForm
              showSaveOption={false}
              submitButtonText="Gunakan kartu"
              onSubmit={(data) => {
                setCardDraft(data);
                setShowCardForm(false);
                setPaymentModalOpen(false);
              }}
            />
          ) : (
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
                    aria-pressed={isSelected}
                    onClick={() => handleSelectPaymentMethod(method)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-none border p-4 text-left transition-colors',
                      isSelected
                        ? 'border-[#ad422b] bg-[#ad422b]/5 shadow-none'
                        : 'border-black/15 bg-white hover:border-black/30 hover:bg-black/5'
                    )}
                  >
                    {/* Kiri: Logo + Nama */}
                    <div className="flex min-w-0 items-center gap-3">
                      {resolveMediaUrl(method.logo) ? (
                        <Image
                          src={resolveMediaUrl(method.logo)!}
                          alt={method.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded-none bg-white object-contain p-1"
                          unoptimized
                        />
                      ) : (
                        <div className="bg-muted text-muted-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-none text-sm font-semibold">
                          {method.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="flex min-w-0 flex-col items-start">
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
                          isSelected
                            ? 'border-[#ad422b] bg-[#ad422b]'
                            : 'bg-background border-black/15'
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
