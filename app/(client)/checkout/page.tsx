'use client';

import MainHeader from '@/components/headers/MainHeader';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SavedCardSelector from '@/components/forms/payment/SavedCardSelector';
import CreditCardForm, { type CreditCardFormData } from '@/components/forms/payment/CreditCardForm';
import { useMembershipDiscount } from '@/hooks/useMembershipDiscount';
import { useXenditCardCollection } from '@/hooks/useXenditTokenization';
import { cn, resolveMediaUrl } from '@/lib/utils';
import { applyPromoMutationOptions, checkoutMutationOptions } from '@/mutations/booking';
import { paymentMethodsQueryOptions } from '@/queries/paymentMethod';
import { profileQueryOptions } from '@/queries/profile';
import useAuthModalStore from '@/stores/useAuthModalStore';
import useAuthRedirectStore from '@/stores/useAuthRedirectStore';
import { useBookingStore } from '@/stores/useBookingStore';
import type { PaymentMethod, CreditCard } from '@/types/model';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

dayjs.locale('id');
dayjs.extend(customParseFormat);

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
});

// Override default format supaya tidak ada spasi
const formatCurrency = (value: number) => currencyFormatter.format(value).replace(/\s/g, '');
const PAYMENT_METHOD_STORAGE_KEY = 'checkout-selected-payment';

const normalizeSlotTime = (time: string) => time?.trim().replace(/ /g, '').replace(/\t/g, '') ?? '';

const parseSlotTime = (time: string): dayjs.Dayjs | null => {
  const sanitized = normalizeSlotTime(time).replace(/\./g, ':');
  const candidates = ['HH:mm', 'H:mm'];
  for (const format of candidates) {
    const parsed = dayjs(sanitized, format, true);
    if (parsed.isValid()) return parsed;
  }
  return null;
};

const getSlotDisplayRange = (timeSlot: string) => {
  const parsed = parseSlotTime(timeSlot);
  if (!parsed) {
    return {
      start: timeSlot,
      end: timeSlot
    };
  }

  const start = parsed.format('HH:mm');
  const end = parsed.add(1, 'hour').format('HH:mm');

  return { start, end };
};

export default function CheckoutPage() {
  const router = useRouter();
  // const pathname = usePathname();
  // const searchParams = useSearchParams();
  const bookingItems = useBookingStore((state) => state.bookingItems);
  const coachTotal = useBookingStore((state) => state.coachTotal);
  const inventoryTotal = useBookingStore((state) => state.inventoryTotal);
  const selectedCoaches = useBookingStore((state) => state.selectedCoaches);
  const selectedBallboys = useBookingStore((state) => state.selectedBallboys);
  const selectedInventories = useBookingStore((state) => state.selectedInventories);
  // const removeCoach = useBookingStore((state) => state.removeCoach);
  const removeInventory = useBookingStore((state) => state.removeInventory);

  const addOnsTotal = coachTotal + inventoryTotal;

  // Authentication check
  const { data: user, isPending: isUserPending } = useQuery(profileQueryOptions);
  const isAuthenticated = !!user?.id;
  const openAuthModal = useAuthModalStore((state) => state.open);
  const setRedirectPath = useAuthRedirectStore((state) => state.setRedirectPath);

  // Calculate membership discount for court bookings (only if user is authenticated)
  const membershipDiscount = useMembershipDiscount(
    user?.id || null,
    bookingItems,
    undefined,
    true // isUser = true, so it fetches membership for current logged-in user
  );

  // Apply membership discount to court total
  const courtSubtotal = membershipDiscount.originalTotal;
  const discountedCourtTotal = membershipDiscount.discountedTotal;
  const grandTotal = discountedCourtTotal + addOnsTotal;

  const { data: paymentMethods = [], isPending: isLoadingPaymentMethods } = useQuery(
    paymentMethodsQueryOptions()
  );

  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [selectedCardCvv, setSelectedCardCvv] = useState<string>('');
  const [isAddCardModalOpen, setAddCardModalOpen] = useState(false);
  const [newCardData, setNewCardData] = useState<CreditCardFormData | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);

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

  const { collectCard, isLoading: isCollectingCard } = useXenditCardCollection();

  const checkoutMutation = useMutation(
    checkoutMutationOptions({
      onSuccess: (data) => {
        // For card payments, don't redirect to invoice yet
        // Redirect will happen after 3DS authentication completes
        if (selectedPaymentMethod?.channel === 'CARDS') {
          return; // Skip invoice redirect for card payments
        }

        // Clear booking store after successful checkout (non-card payments only)
        persistPaymentMethodId(null);
        useBookingStore.getState().clearAll();

        // Redirect to invoice page using the invoice number from response
        const invoiceNumber = data?.data?.invoiceNumber;
        if (invoiceNumber) {
          router.push(`/invoice/${invoiceNumber}`);
        } else {
          // Fallback to old payment page if invoice number not available
          const enhancedData = {
            ...data,
            paymentMethod: selectedPaymentMethod
              ? {
                  id: selectedPaymentMethod.id,
                  name: selectedPaymentMethod.name,
                  channel: selectedPaymentMethod.channel,
                  logo: selectedPaymentMethod.logo
                }
              : undefined,
            courtSlots: bookingItems.map((item) => ({
              courtId: item.courtId,
              courtName: item.courtName,
              timeSlot: item.timeSlot,
              date: item.date,
              price: item.price
            })),
            promoCode: appliedPromoCode || undefined,
            breakdown: data.breakdown || {
              courtTotal: courtSubtotal,
              addOnsTotal,
              processingFee: paymentFeeBreakdown.totalFee,
              promoDiscount: promoDiscountAmount,
              total: totalAfterPromo
            }
          };
          sessionStorage.setItem('checkoutData', JSON.stringify(enhancedData));
          router.push('/checkout/payment');
        }
      }
    })
  );

  const applyPromoMutation = useMutation(applyPromoMutationOptions());

  // Show login modal if user is not authenticated and has items in cart
  // const currentPath = useMemo(() => {
  //   const params = searchParams.toString();
  //   return params ? `${pathname}?${params}` : pathname;
  // }, [pathname, searchParams]);

  useEffect(() => {
    if (!isUserPending && !isAuthenticated && bookingItems.length > 0) {
      // setRedirectPath(currentPath);
      openAuthModal();
    }
  }, [
    isUserPending,
    isAuthenticated,
    bookingItems.length,
    openAuthModal,
    setRedirectPath
    // currentPath
  ]);

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
        if (stored) {
          return stored;
        }
      }

      return paymentMethods[0] ?? null;
    });
  }, [paymentMethods, readStoredPaymentMethodId]);

  useEffect(() => {
    persistPaymentMethodId(selectedPaymentMethod?.id ?? null);
  }, [selectedPaymentMethod, persistPaymentMethodId]);

  const paymentFeeBreakdown = (() => {
    if (!selectedPaymentMethod) {
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
    const percentageFee = Math.round((grandTotal * percentageRate) / 100);

    return {
      fixedFee,
      percentageRate,
      percentageFee,
      totalFee: Math.round(fixedFee + percentageFee)
    };
  })();

  const totalWithPaymentFee = grandTotal + paymentFeeBreakdown.totalFee;
  const totalAfterPromo = Math.max(0, totalWithPaymentFee - promoDiscountAmount);

  const buildCheckoutSelections = useCallback(() => {
    const courtSlots = bookingItems
      .filter((item) => {
        if (!item.slotId) return false;
        const isConstructed = /-\d{2}:\d{2}$/.test(item.slotId);
        return !isConstructed;
      })
      .map((item) => item.slotId);

    const coachSlots = selectedCoaches.filter((coach) => coach.slotId).map((coach) => coach.slotId);

    const ballboySlots = selectedBallboys
      .filter((ballboy) => ballboy.slotId)
      .map((ballboy) => ballboy.slotId);

    const inventories = selectedInventories
      .filter((inventory) => inventory.inventoryId && inventory.quantity > 0)
      .map((inventory) => ({
        inventoryId: inventory.inventoryId,
        quantity: inventory.quantity
      }));

    return { courtSlots, coachSlots, ballboySlots, inventories };
  }, [bookingItems, selectedBallboys, selectedCoaches, selectedInventories]);

  const groupedCourts = useMemo(() => {
    const map = new Map<
      string,
      {
        courtName: string;
        date: string;
        slots: typeof bookingItems;
      }
    >();

    bookingItems.forEach((item) => {
      const normalizedDate = dayjs(item.date, 'YYYY-MM-DD', true).isValid()
        ? dayjs(item.date).format('YYYY-MM-DD')
        : dayjs(item.date, 'DD MMM', true).isValid()
          ? dayjs(item.date, 'DD MMM').format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD');

      const key = `${item.courtId}-${normalizedDate}`;
      if (!map.has(key)) {
        map.set(key, {
          courtName: item.courtName,
          date: normalizedDate,
          slots: []
        });
      }
      map.get(key)!.slots.push({ ...item, date: normalizedDate });
    });

    return Array.from(map.values()).sort(
      (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    );
  }, [bookingItems]);

  if (bookingItems.length === 0) {
    return (
      <div className="bg-background min-h-screen">
        <MainHeader title="Detail Pembayaran" backHref="/booking" withCartBadge withLogo={false} />
        <main className="flex min-h-[calc(100vh-96px)] flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-xl font-semibold">Tidak ada pesanan</h1>
          <p className="text-muted-foreground text-sm">
            Tambahkan slot booking terlebih dahulu untuk melihat ringkasan pembayaran.
          </p>
          <Button onClick={() => router.push('/booking')}>Kembali ke Booking</Button>
        </main>
      </div>
    );
  }

  const handlePaymentMethodClick = () => {
    setPaymentModalOpen(true);
  };

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setPaymentModalOpen(false);
    // Reset card selection when changing payment method
    if (method.channel !== 'CARDS') {
      setSelectedCard(null);
      setSelectedCardCvv('');
      setNewCardData(null);
    }
  };

  const handleAddNewCard = () => {
    setAddCardModalOpen(true);
  };

  const handleNewCardSubmit = (data: CreditCardFormData) => {
    // Store new card data for checkout
    setNewCardData(data);
    setSelectedCard(null); // Clear saved card selection
    setSelectedCardCvv('');
    setAddCardModalOpen(false);
  };

  const handleApplyPromo = () => {
    if (!selectedPaymentMethod) return;

    const trimmedCode = promoCode.trim();
    if (!trimmedCode) {
      setPromoError('Masukkan kode promo terlebih dahulu.');
      return;
    }

    const selections = buildCheckoutSelections();

    applyPromoMutation.mutate(
      {
        promoCode: trimmedCode,
        courtSlots: selections.courtSlots,
        coachSlots: selections.coachSlots,
        ballboySlots: selections.ballboySlots,
        inventories: selections.inventories
      },
      {
        onSuccess: (response) => {
          const isValid = response?.data?.isValid;
          const discountAmount = Number(response?.data?.discountAmount ?? 0);

          if (isValid) {
            setAppliedPromoCode(trimmedCode);
            setPromoDiscountAmount(Math.max(0, discountAmount));
            setPromoError(null);
            toast.success(response?.msg || 'Promo berhasil diterapkan.');
          } else {
            setAppliedPromoCode(null);
            setPromoDiscountAmount(0);
            setPromoError(response?.msg || 'Kode promo tidak valid.');
          }
        }
      }
    );
  };

  const handlePromoInputChange = (value: string) => {
    setPromoCode(value);
    if (appliedPromoCode && value.trim() !== appliedPromoCode) {
      setAppliedPromoCode(null);
      setPromoDiscountAmount(0);
    }
    if (promoError) {
      setPromoError(null);
    }
  };

  const handleCheckout = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (!selectedPaymentMethod) {
      return;
    }

    // For CARDS channel, check if card is selected or new card data is provided
    if (selectedPaymentMethod.channel === 'CARDS' && !selectedCard && !newCardData) {
      return;
    }

    if (selectedPaymentMethod.channel === 'CARDS' && selectedCard && !selectedCardCvv) {
      return;
    }

    const { courtSlots, coachSlots, ballboySlots, inventories } = buildCheckoutSelections();

    const payload: any = {
      paymentMethodId: selectedPaymentMethod.id
    };

    if (appliedPromoCode) {
      payload.promoCode = appliedPromoCode;
    }

    if (courtSlots.length > 0) {
      payload.courtSlots = courtSlots;
    }

    if (coachSlots.length > 0) {
      payload.coachSlots = coachSlots;
    }

    if (ballboySlots.length > 0) {
      payload.ballboySlots = ballboySlots;
    }

    if (inventories.length > 0) {
      payload.inventories = inventories;
    }

    // Add card payment data if CARDS channel
    if (selectedPaymentMethod.channel === 'CARDS') {
      if (selectedCard) {
        // Use saved card
        payload.cardPayment = {
          savedCardId: selectedCard.id,
          cvv: selectedCardCvv
        };
      } else if (newCardData) {
        // Use new card - just send saveCard flag
        payload.cardPayment = {
          saveCard: newCardData.saveCard || false
        };
      }
    }

    // Send to backend to create Payment Session
    checkoutMutation.mutate(payload, {
      onSuccess: (response) => {
        // If card payment and payment session created, collect card data
        if (
          selectedPaymentMethod.channel === 'CARDS' &&
          newCardData &&
          response.data.paymentSessionId
        ) {
          void (async () => {
            try {
              console.log('Payment Session created:', response.data.paymentSessionId);
              toast.info('Processing card payment...');

              // Collect card data using card_session.js
              const cardResult = await collectCard({
                paymentSessionId: response.data.paymentSessionId,
                cardNumber: newCardData.cardNumber.trim().replace(/\s+/g, ''),
                expiryMonth: newCardData.expiryMonth,
                expiryYear: newCardData.expiryYear,
                cvv: newCardData.cvv,
                cardholderFirstName: user?.name?.split(' ')[0] || 'Cardholder',
                cardholderLastName: user?.name?.split(' ').slice(1).join(' ') || 'User',
                cardholderEmail: user?.email,
                cardholderPhoneNumber: user?.phone || undefined
              });

              console.log('Payment Request created:', cardResult.paymentRequestId);
              console.log('Redirecting to 3DS:', cardResult.actionUrl);

              // Redirect to 3DS authentication
              router.push(cardResult.actionUrl);
            } catch (err: any) {
              console.error('Card collection failed:', err);

              // Show error to user
              toast.error(err.message || 'Card processing failed. Please try again.');

              // Cancel booking and payment session
              void (async () => {
                try {
                  const invoiceId = response.data?.invoiceNumber || response.data?.invoiceId;
                  const sessionId = response.data?.paymentSessionId;

                  // Cancel booking if invoice was created
                  if (invoiceId) {
                    console.log('Cancelling booking:', invoiceId);
                    const { cancelBookingApi } = await import('@/api/booking');
                    await cancelBookingApi(invoiceId, {
                      reason: 'Card payment processing failed'
                    });
                    console.log('Booking cancelled successfully');
                  }

                  // Cancel payment session
                  if (sessionId) {
                    console.log('Cancelling payment session:', sessionId);
                    const { cancelPaymentSession } = await import('@/api/payment-session');
                    await cancelPaymentSession({ sessionId });
                    console.log('Payment session cancelled successfully');
                  }
                } catch (cancelErr) {
                  console.error('Failed to cancel booking/session:', cancelErr);
                  // Don't show error to user - the main error is already shown
                }
              })();

              // Reset checkout mutation state to allow retry
              checkoutMutation.reset();
            }
          })();
        } else if (selectedPaymentMethod.channel !== 'CARDS') {
          // Non-card payment success - proceed normally
          toast.success('Checkout berhasil!');
        }
      }
    });
  };

  return (
    <div className="min-h-screen pb-16">
      <MainHeader
        title="Detail Pembayaran"
        backHref="/booking"
        withCartBadge
        withLogo={false}
        withBorder
      />

      <main className="mx-auto flex w-11/12 max-w-4xl flex-col gap-6 pt-28">
        <section className="border-muted space-y-4 rounded-lg border bg-white p-4">
          {groupedCourts.map((group, index) => (
            <div
              key={`${group.courtName}-${group.date}`}
              className={cn(
                'space-y-3',
                index < groupedCourts.length - 1 && 'border-muted/80 border-b border-dashed pb-4'
              )}
            >
              <header className="space-y-1">
                <h2 className="text-primary text-base font-semibold">{group.courtName}</h2>
                <p className="text-muted-foreground text-sm">
                  {dayjs(group.date).format('dddd, DD MMM YYYY')}
                </p>
              </header>

              <div className="space-y-2">
                {[...group.slots]
                  .sort((a, b) => {
                    const dateCompare = a.date.localeCompare(b.date);
                    if (dateCompare !== 0) return dateCompare;
                    return a.timeSlot.localeCompare(b.timeSlot);
                  })
                  .map((slot, slotIndex) => {
                    // Check if this slot is free due to membership
                    const sortedBookings = [...bookingItems].sort((a, b) => {
                      const dateCompare = a.date.localeCompare(b.date);
                      if (dateCompare !== 0) return dateCompare;
                      return a.timeSlot.localeCompare(b.timeSlot);
                    });
                    const bookingIndex = sortedBookings.findIndex(
                      (b) =>
                        b.courtId === slot.courtId &&
                        b.timeSlot === slot.timeSlot &&
                        b.date === slot.date
                    );
                    const isFree =
                      membershipDiscount.canUseMembership &&
                      bookingIndex >= 0 &&
                      bookingIndex < membershipDiscount.slotsToDeduct;

                    return (
                      <div
                        key={`${slot.courtId}-${slot.timeSlot}-${slotIndex}`}
                        className={cn(
                          'border-muted/60 flex items-center justify-between rounded-md border px-4 py-3',
                          isFree ? 'border-green-200 bg-green-50' : 'bg-muted/50'
                        )}
                      >
                        <div className="flex flex-col">
                          {(() => {
                            const range = getSlotDisplayRange(slot.timeSlot);
                            return (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {range.start} - {range.end}
                                </span>
                                {isFree && (
                                  <span className="text-xs font-medium text-green-600">
                                    (Gratis)
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            isFree && 'text-green-600 line-through'
                          )}
                        >
                          {isFree ? (
                            <>
                              <span className="text-muted-foreground">
                                {formatCurrency(slot.price)}
                              </span>{' '}
                              <span className="ml-1">Gratis</span>
                            </>
                          ) : (
                            formatCurrency(slot.price)
                          )}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </section>

        {/* Coach section - commented out as not in use */}
        {/* {selectedCoaches.length > 0 && (
          <section className="border-muted space-y-3 rounded-lg border bg-white p-4">
            <header className="space-y-1">
              <h3 className="text-base font-semibold">Coach</h3>
              <p className="text-muted-foreground text-sm">{selectedCoaches.length} sesi dipilih</p>
            </header>
            <div className="space-y-2">
              {selectedCoaches.map((coach, index) => (
                <div
                  key={`${coach.coachId}-${coach.slotId ?? coach.timeSlot}-${index}`}
                  className="border-muted/70 flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{coach.coachName}</span>
                    <span className="text-muted-foreground text-xs">
                      {dayjs(coach.date).format('DD MMM YYYY')} • {coach.timeSlot}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatCurrency(coach.price)}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      aria-label="Hapus coach"
                      onClick={() => removeCoach(coach.coachId, coach.timeSlot, coach.slotId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )} */}

        {selectedInventories.length > 0 && (
          <section className="border-muted space-y-3 rounded-lg border bg-white p-4">
            <header className="space-y-1">
              <h3 className="text-base font-semibold">Peralatan</h3>
              <p className="text-muted-foreground text-sm">
                {selectedInventories.length} jenis dipilih
              </p>
            </header>
            <div className="space-y-2">
              {selectedInventories.map((inventory, index) => (
                <div
                  key={`${inventory.inventoryId}-${inventory.timeSlot ?? 'default'}-${index}`}
                  className="border-muted/70 flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{inventory.inventoryName}</span>
                    <span className="text-muted-foreground text-xs">Qty: {inventory.quantity}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatCurrency(inventory.price)}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      aria-label="Hapus peralatan"
                      onClick={() =>
                        removeInventory(inventory.inventoryId, inventory.timeSlot ?? 'default')
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4">
          <Button
            variant="outline"
            className="border-primary/50 bg-primary/5 text-primary hover:bg-primary/10 flex items-center justify-center gap-2 rounded-2xl border border-dashed py-3 text-sm font-semibold transition-colors"
            onClick={() => router.push('/add-ons')}
          >
            Tambah Add-Ons
          </Button>

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
              <Button
                variant="link"
                className="text-primary px-0"
                onClick={handlePaymentMethodClick}
              >
                Ganti Metode
              </Button>
            </div>
          </div>

          {/* Card Payment Selection - Show only if CARDS channel is selected */}
          {selectedPaymentMethod?.channel === 'CARDS' && (
            <div className="border-muted rounded-lg border bg-white p-4">
              {!newCardData ? (
                <SavedCardSelector
                  onCardSelect={(card, cvv) => {
                    setSelectedCard(card);
                    setSelectedCardCvv(cvv);
                  }}
                  onAddNewCard={handleAddNewCard}
                  isLoading={checkoutMutation.isPending}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Kartu Baru</p>
                      <p className="text-muted-foreground text-xs">{newCardData.cardholderName}</p>
                      <p className="text-muted-foreground text-xs">
                        •••• •••• •••• {newCardData.cardNumber.slice(-4)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewCardData(null)}
                    >
                      Ganti Kartu
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="border-muted space-y-3 rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Kode Promo</p>
                <p className="text-muted-foreground text-xs">
                  Masukkan kode promo untuk mendapatkan diskon
                </p>
              </div>
              {appliedPromoCode && promoDiscountAmount > 0 && (
                <span className="text-xs font-semibold text-green-600">Terpasang</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Contoh: HEMAT10"
                value={promoCode}
                onChange={(event) => handlePromoInputChange(event.target.value)}
                className="border-muted/70 focus:border-primary focus:ring-primary/20 h-11 flex-1 rounded-md border bg-white px-3 text-sm transition outline-none"
              />
              <Button
                type="button"
                className="h-11 px-5"
                onClick={handleApplyPromo}
                disabled={
                  !selectedPaymentMethod || applyPromoMutation.isPending || !promoCode.trim()
                }
              >
                {applyPromoMutation.isPending ? 'Memproses...' : 'Gunakan'}
              </Button>
            </div>
            {promoError && <p className="text-xs text-red-600">{promoError}</p>}
            {!promoError && appliedPromoCode && promoDiscountAmount > 0 && (
              <p className="text-xs text-green-600">
                Diskon {formatCurrency(promoDiscountAmount)} diterapkan
              </p>
            )}
          </div>

          {/* Membership Information */}
          {isAuthenticated && membershipDiscount.activeMembership && (
            <div className="border-muted bg-primary/5 rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-primary text-sm font-medium">Membership Aktif</span>
                <span
                  className={
                    membershipDiscount.activeMembership.isExpired ||
                    membershipDiscount.activeMembership.isSuspended
                      ? 'text-xs text-red-600'
                      : 'text-xs text-green-600'
                  }
                >
                  {membershipDiscount.activeMembership.isExpired
                    ? 'Expired'
                    : membershipDiscount.activeMembership.isSuspended
                      ? 'Suspended'
                      : 'Active'}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-muted-foreground">Paket:</span>{' '}
                  <span className="font-medium">
                    {membershipDiscount.activeMembership.membership.name}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sisa Sesi:</span>{' '}
                  <span className="font-medium">{membershipDiscount.remainingSessions} sesi</span>
                </div>
                {membershipDiscount.canUseMembership && bookingItems.length > 0 && (
                  <div className="text-primary mt-1 font-medium">
                    {membershipDiscount.slotsToDeduct} slot akan gratis menggunakan membership
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-muted mb-5 rounded-lg border bg-white p-4">
            <h3 className="mb-3 text-base font-semibold">Ringkasan Pembayaran</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground font-medium">{formatCurrency(courtSubtotal)}</span>
              </div>
              {membershipDiscount.canUseMembership && membershipDiscount.slotsToDeduct > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span>
                    Membership Discount ({membershipDiscount.slotsToDeduct} slot
                    {membershipDiscount.slotsToDeduct > 1 ? 's' : ''})
                  </span>
                  <span className="font-medium">
                    - {formatCurrency(membershipDiscount.discountAmount)}
                  </span>
                </div>
              )}
              {addOnsTotal > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Add-ons Subtotal</span>
                  <span className="text-foreground font-medium">{formatCurrency(addOnsTotal)}</span>
                </div>
              )}
              {selectedPaymentMethod && paymentFeeBreakdown.totalFee > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Biaya Layanan</span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(paymentFeeBreakdown.totalFee)}
                  </span>
                </div>
              )}
              {promoDiscountAmount > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span>Promo {appliedPromoCode}</span>
                  <span className="font-medium">- {formatCurrency(promoDiscountAmount)}</span>
                </div>
              )}
              <div className="border-muted flex items-center justify-between border-t border-dashed pt-2 text-base font-semibold">
                <span>Total Pembayaran</span>
                <span className="text-primary">{formatCurrency(totalAfterPromo)}</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNavigationWrapper className="pb-4">
        <div className="mx-auto w-11/12 py-4 lg:max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs">Total Pembayaran</p>
              <p className="text-primary text-lg font-semibold">
                {formatCurrency(totalAfterPromo)}
              </p>
            </div>
            <Button
              size="lg"
              className="min-w-40"
              onClick={handleCheckout}
              disabled={
                ((!selectedPaymentMethod ||
                  checkoutMutation.isPending ||
                  isCollectingCard ||
                  (selectedPaymentMethod?.channel === 'CARDS' && !selectedCard && !newCardData) ||
                  (selectedPaymentMethod?.channel === 'CARDS' &&
                    !!selectedCard &&
                    !selectedCardCvv)) &&
                  isAuthenticated) ||
                false
              }
            >
              {isUserPending
                ? 'Memuat...'
                : !isAuthenticated
                  ? 'Login untuk Checkout'
                  : isCollectingCard
                    ? 'Memproses Kartu...'
                    : checkoutMutation.isPending
                      ? 'Memproses...'
                      : selectedPaymentMethod?.channel === 'CARDS' && !selectedCard && !newCardData
                        ? 'Pilih Kartu'
                        : selectedPaymentMethod
                          ? 'Bayar Sekarang'
                          : 'Pilih Metode'}
            </Button>
          </div>
        </div>
      </BottomNavigationWrapper>

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
                const feesValue = Math.round(baseFee + (grandTotal * percentage) / 100);
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

      {/* Add New Card Dialog */}
      <Dialog open={isAddCardModalOpen} onOpenChange={setAddCardModalOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">
              Tambah Kartu Baru
            </DialogTitle>
          </DialogHeader>

          <CreditCardForm
            onSubmit={handleNewCardSubmit}
            isLoading={checkoutMutation.isPending}
            showSaveOption={true}
            submitButtonText="Gunakan Kartu Ini"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
