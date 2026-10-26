'use client';
import BranchLabel from '@/components/branches/BranchLabel';

import PaymentLoading, { PaymentProcessingOverlay } from '@/components/invoice/PaymentLoading';
import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useConfirm } from '@/components/ui/confirm-dialog';
import SavedCardSelector from '@/components/forms/payment/SavedCardSelector';
import CreditCardForm, { type CreditCardFormData } from '@/components/forms/payment/CreditCardForm';
import { useMembershipDiscount } from '@/hooks/useMembershipDiscount';
import { useXenditCardCollection } from '@/hooks/useXenditTokenization';
import { cn, resolveMediaUrl } from '@/lib/utils';
import { getCheckoutSelections } from '@/lib/checkout-selections';
import { applyPromoMutationOptions, checkoutMutationOptions } from '@/mutations/booking';
import { paymentMethodsQueryOptions } from '@/queries/paymentMethod';
import { profileQueryOptions } from '@/queries/profile';
import useAuthModalStore from '@/stores/useAuthModalStore';
import useAuthRedirectStore from '@/stores/useAuthRedirectStore';
import { useBookingStore } from '@/stores/useBookingStore';
import type { PaymentMethod, CreditCard } from '@/types/model';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { nowJakarta } from '@/lib/dayjs';
import 'dayjs/locale/id';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ArrowUpRight, ShoppingBag, X } from 'lucide-react';
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

const getBookingItemStart = (item: { date: string; timeSlot: string; startAt?: string }) => {
  const date = dayjs(item.date, 'YYYY-MM-DD', true);
  const time = parseSlotTime(item.timeSlot);

  if (date.isValid() && time) {
    return dayjs.tz(`${date.format('YYYY-MM-DD')}T${time.format('HH:mm')}:00`, 'Asia/Jakarta');
  }

  return item.startAt ? dayjs(item.startAt) : null;
};

export default function CheckoutPage() {
  const router = useRouter();
  // const pathname = usePathname();
  // const searchParams = useSearchParams();
  const bookingItems = useBookingStore((state) => state.bookingItems);
  const coachTotal = useBookingStore((state) => state.coachTotal);
  const ballboyTotal = useBookingStore((state) => state.ballboyTotal);
  const inventoryTotal = useBookingStore((state) => state.inventoryTotal);
  const selectedCoaches = useBookingStore((state) => state.selectedCoaches);
  const selectedBallboys = useBookingStore((state) => state.selectedBallboys);
  const selectedInventories = useBookingStore((state) => state.selectedInventories);
  // const removeCoach = useBookingStore((state) => state.removeCoach);
  const removeBallboy = useBookingStore((state) => state.removeBallboy);
  const removeInventory = useBookingStore((state) => state.removeInventory);

  const addOnsTotal = coachTotal + ballboyTotal + inventoryTotal;
  const hasCheckoutItems =
    bookingItems.length > 0 ||
    selectedInventories.some((item) => item.inventoryId && item.quantity > 0);

  // Authentication check
  const { data: user, isPending: isUserPending } = useQuery(profileQueryOptions);
  const isAuthenticated = !!user?.id;
  const openAuthModal = useAuthModalStore((state) => state.open);
  const setRedirectPath = useAuthRedirectStore((state) => state.setRedirectPath);
  const [useMembership, setUseMembership] = useState(true);
  const courtSport = useMemo(
    () => bookingItems.find((item) => item.sport)?.sport ?? 'PADEL',
    [bookingItems]
  );
  const bookingHref = courtSport === 'TENNIS' ? '/booking/tennis' : '/booking';

  // Calculate membership discount for court bookings (only if user is authenticated)
  const membershipDiscount = useMembershipDiscount(
    user?.id || null,
    bookingItems,
    undefined,
    true, // isUser = true, so it fetches membership for current logged-in user
    courtSport,
    useMembership
  );

  // Apply membership discount to court total
  const courtSubtotal = membershipDiscount.originalTotal;
  const discountedCourtTotal = membershipDiscount.discountedTotal;
  const grandTotal = discountedCourtTotal + addOnsTotal;
  const isCoveredByMembership =
    useMembership &&
    bookingItems.length > 0 &&
    membershipDiscount.canUseMembership &&
    membershipDiscount.slotsToDeduct > 0 &&
    grandTotal === 0;

  const { data: paymentMethods = [], isPending: isLoadingPaymentMethods } = useQuery(
    paymentMethodsQueryOptions()
  );

  const [isNavigatingToPayment, setNavigatingToPayment] = useState(false);
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
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const checkoutMutation = useMutation(
    checkoutMutationOptions({
      onSuccess: (data) => {
        void queryClient.invalidateQueries({ queryKey: ['memberships', 'my'] });
        void queryClient.invalidateQueries({ queryKey: ['courts', 'slots'] });
        // For card payments, don't redirect to invoice yet
        // Redirect will happen after 3DS authentication completes
        if (selectedPaymentMethod?.channel === 'CARDS' && data?.data?.paymentStatus !== 'PAID') {
          return; // Skip invoice redirect for card payments
        }

        setNavigatingToPayment(true);
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
            inventories: selectedInventories.map((item) => ({
              inventoryId: item.inventoryId,
              inventoryName: item.inventoryName,
              quantity: item.quantity,
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
      },
      onError: () => {
        void queryClient.invalidateQueries({ queryKey: ['memberships', 'my'] });
        void queryClient.invalidateQueries({ queryKey: ['courts', 'slots'] });
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
    if (!isUserPending && !isAuthenticated && hasCheckoutItems) {
      // setRedirectPath(currentPath);
      openAuthModal();
    }
  }, [
    isUserPending,
    isAuthenticated,
    hasCheckoutItems,
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
    if (isCoveredByMembership || !selectedPaymentMethod) {
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

  const buildCheckoutSelections = useCallback(
    () =>
      getCheckoutSelections({
        bookingItems,
        selectedCoaches,
        selectedBallboys,
        selectedInventories
      }),
    [bookingItems, selectedBallboys, selectedCoaches, selectedInventories]
  );

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

  if (isNavigatingToPayment)
    return (
      <PaymentLoading
        title="Menyiapkan pesanan"
        description="Mohon tunggu, pesanan Anda sedang dimuat."
      />
    );

  if (!hasCheckoutItems) {
    return (
      <div className="min-h-dvh">
        <MainHeader
          title="Detail Pembayaran"
          backHref={bookingHref}
          withCartBadge
          withLogo={false}
        />
        <main className="checkout-page mx-auto flex min-h-[calc(100dvh-76px)] w-full max-w-7xl flex-col items-center justify-center gap-3 px-6 pt-28 pb-12 text-center">
          <ShoppingBag className="mb-2 size-10 text-black/25" strokeWidth={1} aria-hidden="true" />
          <h1 className="text-2xl font-medium tracking-tight text-[#171717]">Belum ada pesanan</h1>
          <p className="text-muted-foreground text-sm">
            Pilih jadwal lapangan atau peralatan tambahan untuk melanjutkan.
          </p>
          <Button
            className="mt-3 h-12 gap-3 rounded-full bg-[#111111] px-7 text-sm text-white hover:bg-black/80 has-[>svg]:px-7"
            onClick={() => router.push(bookingHref)}
          >
            Pilih jadwal <ArrowUpRight className="size-4" aria-hidden="true" />
          </Button>
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

    if (!isCoveredByMembership && !selectedPaymentMethod) {
      return;
    }

    // For CARDS channel, check if card is selected or new card data is provided
    if (
      !isCoveredByMembership &&
      selectedPaymentMethod?.channel === 'CARDS' &&
      !selectedCard &&
      !newCardData
    ) {
      return;
    }

    if (
      !isCoveredByMembership &&
      selectedPaymentMethod?.channel === 'CARDS' &&
      selectedCard &&
      !selectedCardCvv
    ) {
      return;
    }

    const checkoutTime = nowJakarta();
    const hasExpiredCourtSlot = bookingItems.some((item) => {
      const slotStart = getBookingItemStart(item);
      return !slotStart || !slotStart.isAfter(checkoutTime);
    });

    if (hasExpiredCourtSlot) {
      useBookingStore.getState().clearAll();
      toast.error('Salah satu slot sudah lewat. Silakan pilih ulang jadwal booking.');
      router.push(bookingHref);
      return;
    }

    const { courtSlots, coachSlots, ballboySlots, inventories } = buildCheckoutSelections();

    const payload: any = {
      ...(!isCoveredByMembership && selectedPaymentMethod
        ? { paymentMethodId: selectedPaymentMethod.id }
        : {}),
      useMembership: bookingItems.length > 0 && useMembership
    };

    if (appliedPromoCode && !isCoveredByMembership) {
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
    if (!isCoveredByMembership && selectedPaymentMethod?.channel === 'CARDS') {
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

    const checkoutConfirmationDescription =
      courtSport === 'TENNIS' ? (
        <div className="space-y-2">
          <p>
            Khusus booking tennis, ballboy dari luar tidak diperkenankan. Jika membutuhkan layanan
            ballboy, silakan gunakan ballboy resmi yang tersedia di Black Padel.
          </p>
          <p>Reschedule berlaku H-3. Pastikan pesanan Anda sudah sesuai.</p>
        </div>
      ) : (
        'Reschedule berlaku H-3. Pastikan pesanan Anda sudah sesuai.'
      );

    // Ask for user confirmation before sending to backend to create Payment Session
    try {
      const ok = await confirm({
        title: 'Konfirmasi Pemesanan',
        description: isCoveredByMembership ? (
          <div className="space-y-2">
            <p>
              {membershipDiscount.slotsToDeduct} jam akan dipotong dari Value Pack. Tidak ada
              pembayaran tambahan.
            </p>
            {checkoutConfirmationDescription}
          </div>
        ) : (
          checkoutConfirmationDescription
        ),
        confirmText: isCoveredByMembership ? 'Konfirmasi booking' : 'Bayar Sekarang',
        cancelText: 'Cek Lagi',
        dismissible: true
      });

      if (!ok) return;
    } catch (e) {
      // If confirm throws or is rejected, bail out
      return;
    }

    // Send to backend to create Payment Session
    checkoutMutation.mutate(payload, {
      onSuccess: (response) => {
        // If card payment and payment session created, collect card data
        if (
          !isCoveredByMembership &&
          selectedPaymentMethod?.channel === 'CARDS' &&
          newCardData &&
          response.data.paymentSessionId
        ) {
          void (async () => {
            try {
              console.log('Payment Session created:', response.data.paymentSessionId);

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

              sessionStorage.setItem(
                'payment_3ds_data',
                JSON.stringify({
                  invoiceId: response.data?.invoiceId,
                  invoiceNumber: response.data?.invoiceNumber,
                  bookingId: response.data?.bookingId,
                  paymentStatus: 'REQUIRES_ACTION',
                  paymentUrl: cardResult.actionUrl
                })
              );

              // External bank/Xendit URL — full navigation, not Next router
              setNavigatingToPayment(true);
              window.location.href = cardResult.actionUrl;
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
        }
      }
    });
  };

  const checkoutAction = (
    <Button
      size="lg"
      className="h-12 w-full min-w-0 rounded-full bg-[#111111] px-3 text-xs font-medium text-white hover:bg-black/80 disabled:bg-black/15 disabled:text-black/40 disabled:opacity-100"
      onClick={handleCheckout}
      disabled={
        isAuthenticated &&
        (checkoutMutation.isPending ||
          isCollectingCard ||
          (!isCoveredByMembership &&
            (!selectedPaymentMethod ||
              (selectedPaymentMethod.channel === 'CARDS' && !selectedCard && !newCardData) ||
              (selectedPaymentMethod.channel === 'CARDS' && !!selectedCard && !selectedCardCvv))))
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
              : isCoveredByMembership
                ? 'Konfirmasi booking'
                : selectedPaymentMethod?.channel === 'CARDS' && !selectedCard && !newCardData
                  ? 'Pilih Kartu'
                  : selectedPaymentMethod
                    ? 'Bayar Sekarang'
                    : 'Pilih Metode'}
    </Button>
  );

  return (
    <div className="min-h-dvh">
      {(checkoutMutation.isPending || isCollectingCard) && (
        <PaymentProcessingOverlay
          title={isCoveredByMembership ? 'Mengonfirmasi pesanan' : undefined}
          description={
            isCoveredByMembership
              ? 'Mohon tunggu, jadwal dan penggunaan Value Pack sedang dikonfirmasi.'
              : undefined
          }
        />
      )}
      <MainHeader
        title="Detail Pembayaran"
        backHref={bookingHref}
        withCartBadge
        withLogo={false}
        withBorder
      />

      <main className="checkout-page mx-auto w-full max-w-7xl px-5 pt-24 pb-[calc(8rem+env(safe-area-inset-bottom))] text-[#171717] sm:px-8 lg:pb-16 xl:pt-32">
        <header className="mb-6 flex items-center justify-between gap-4 border-b border-black/15 pb-5">
          <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">Checkout</h1>
        </header>
        <BranchLabel detailed />
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
          <div className="min-w-0 space-y-4">
            {groupedCourts.length > 0 && (
              <section className="space-y-4 border border-black/15 bg-[#f8f8f6] p-5 sm:p-6">
                {groupedCourts.map((group, index) => (
                  <div
                    key={`${group.courtName}-${group.date}`}
                    className={cn(
                      'space-y-3',
                      index < groupedCourts.length - 1 &&
                        'border-b border-dashed border-black/10 pb-4'
                    )}
                  >
                    <header className="space-y-1">
                      <h2 className="text-base font-medium text-[#171717]">{group.courtName}</h2>
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
                          const isFree = membershipDiscount.canUseMembership && bookingIndex >= 0;

                          return (
                            <div
                              key={`${slot.courtId}-${slot.timeSlot}-${slotIndex}`}
                              className={cn(
                                'flex items-center justify-between rounded-none border border-black/10 px-4 py-3',
                                isFree ? 'border-[#ad422b]/25 bg-[#ad422b]/5' : 'bg-muted/50'
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
                                        <span className="text-xs font-medium text-[#ad422b]">
                                          (Gratis)
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                              <span
                                className={cn('text-sm font-semibold', isFree && 'text-[#ad422b]')}
                              >
                                {isFree ? (
                                  <>
                                    <span className="text-muted-foreground line-through">
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
            )}
            {/* Coach section - commented out as not in use */}
            {/* {selectedCoaches.length > 0 && (
          <section className="space-y-3 border border-black/15 bg-[#f8f8f6] p-5 sm:p-6">
            <header className="space-y-1">
              <h3 className="text-base font-semibold">Coach</h3>
              <p className="text-muted-foreground text-sm">{selectedCoaches.length} sesi dipilih</p>
            </header>
            <div className="space-y-2">
              {selectedCoaches.map((coach, index) => (
                <div
                  key={`${coach.coachId}-${coach.slotId ?? coach.timeSlot}-${index}`}
                  className="border-black/10 flex items-center justify-between rounded-none border px-4 py-3"
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

            {selectedBallboys.length > 0 && (
              <section className="space-y-3 border border-black/15 bg-[#f8f8f6] p-5 sm:p-6">
                <header className="space-y-1">
                  <h3 className="text-base font-semibold">Ballboy</h3>
                  <p className="text-muted-foreground text-sm">
                    {selectedBallboys.length} sesi dipilih
                  </p>
                </header>
                <div className="space-y-2">
                  {selectedBallboys.map((ballboy, index) => (
                    <div
                      key={`${ballboy.ballboyId}-${ballboy.slotId ?? ballboy.timeSlot}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-none border border-black/10 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm leading-snug font-medium break-words">
                          {ballboy.ballboyName}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-medium whitespace-nowrap">
                          {formatCurrency(ballboy.price)}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                          aria-label="Hapus ballboy"
                          onClick={() =>
                            removeBallboy(ballboy.ballboyId, ballboy.timeSlot, ballboy.slotId)
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

            {selectedInventories.length > 0 && (
              <section className="space-y-3 border border-black/15 bg-[#f8f8f6] p-5 sm:p-6">
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
                      className="flex items-center justify-between gap-3 rounded-none border border-black/10 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm leading-snug font-medium break-words">
                          {inventory.inventoryName}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-medium whitespace-nowrap">
                          {formatCurrency(inventory.price)}
                        </span>
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

            <section className="grid min-w-0 gap-4">
              <Button
                variant="outline"
                className="h-12 w-full rounded-full border-black/20 bg-transparent text-xs font-medium text-[#171717] shadow-none hover:bg-black/5"
                onClick={() => router.push('/add-ons')}
              >
                Tambah Add-Ons
              </Button>

              {!isCoveredByMembership && (
                <div className="min-w-0 border border-black/15 bg-[#f8f8f6] p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {selectedPaymentMethod ? (
                        resolveMediaUrl(selectedPaymentMethod.logo) ? (
                          <Image
                            src={resolveMediaUrl(selectedPaymentMethod.logo)!}
                            alt={selectedPaymentMethod.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-none object-contain"
                            unoptimized
                          />
                        ) : (
                          <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-none text-sm font-semibold">
                            {selectedPaymentMethod.name.slice(0, 2).toUpperCase()}
                          </div>
                        )
                      ) : null}
                      <div>
                        <p className="text-sm font-medium">
                          {selectedPaymentMethod
                            ? selectedPaymentMethod.name
                            : 'Pilih Metode Pembayaran'}
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
                      className="h-10 rounded-full border border-black/15 px-4 text-xs text-[#ad422b] no-underline hover:bg-black/5"
                      onClick={handlePaymentMethodClick}
                    >
                      Ganti Metode
                    </Button>
                  </div>
                </div>
              )}

              {/* Card Payment Selection - Show only if CARDS channel is selected */}
              {!isCoveredByMembership && selectedPaymentMethod?.channel === 'CARDS' && (
                <div className="min-w-0 border border-black/15 bg-[#f8f8f6] p-5 sm:p-6">
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
                          <p className="text-muted-foreground text-xs">
                            {newCardData.cardholderName}
                          </p>
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

              {!isCoveredByMembership && (
                <div className="space-y-3 border border-black/15 bg-[#f8f8f6] p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Kode Promo</p>
                      <p className="text-muted-foreground text-xs">
                        Masukkan kode promo untuk mendapatkan diskon
                      </p>
                    </div>
                    {appliedPromoCode && promoDiscountAmount > 0 && (
                      <span className="text-xs font-semibold text-[#ad422b]">Terpasang</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      aria-label="Kode promo"
                      placeholder="Masukkan kode promo"
                      value={promoCode}
                      onChange={(event) => handlePromoInputChange(event.target.value)}
                      className="h-11 min-w-0 flex-1 border border-black/15 bg-white px-3 text-base transition outline-none placeholder:text-sm placeholder:font-normal placeholder:text-black/40 focus:border-[#ad422b] focus:ring-2 focus:ring-[#ad422b]/10 sm:text-sm"
                    />
                    <Button
                      type="button"
                      className="h-11 shrink-0 rounded-full bg-[#111111] px-5 text-xs text-white hover:bg-black/80"
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
                    <p className="text-xs text-[#ad422b]">
                      Diskon {formatCurrency(promoDiscountAmount)} diterapkan
                    </p>
                  )}
                </div>
              )}

              {/* Membership Information */}
              {isAuthenticated &&
                bookingItems.length > 0 &&
                membershipDiscount.activeMembership && (
                  <div className="rounded-none border border-black/15 bg-[#ad422b]/5 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-[#ad422b]">Membership Aktif</span>
                      <span
                        className={
                          membershipDiscount.activeMembership.isExpired ||
                          membershipDiscount.activeMembership.isSuspended
                            ? 'text-xs text-red-600'
                            : 'text-xs text-[#ad422b]'
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
                        <span className="font-medium">
                          {membershipDiscount.remainingSessions} sesi
                        </span>
                      </div>
                      <label className="bg-background mt-2 flex items-center justify-between gap-3 rounded-none border border-[#ad422b]/20 px-3 py-2">
                        <span className="text-foreground font-medium">Gunakan Value Pack</span>
                        <input
                          type="checkbox"
                          checked={useMembership}
                          onChange={(event) => setUseMembership(event.target.checked)}
                          className="h-4 w-4 accent-[#ad422b]"
                        />
                      </label>
                      {membershipDiscount.canUseMembership && bookingItems.length > 0 && (
                        <div className="mt-1 font-medium text-[#ad422b]">
                          {membershipDiscount.slotsToDeduct} jam akan dipotong dari membership
                        </div>
                      )}
                      {!useMembership && (
                        <div className="text-muted-foreground mt-1">
                          Paket tidak dipakai untuk booking ini.
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </section>
          </div>
          <aside
            aria-label="Ringkasan pembayaran"
            className="min-w-0 border border-black/15 bg-[#f8f8f6] p-5 sm:p-6 lg:sticky lg:top-28"
          >
            <div className="space-y-4">
              <h3 className="mb-4 text-lg font-medium tracking-tight">Ringkasan pembayaran</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(courtSubtotal)}
                  </span>
                </div>
                {membershipDiscount.canUseMembership && membershipDiscount.slotsToDeduct > 0 && (
                  <div className="flex items-start justify-between gap-3 text-[#ad422b]">
                    <span>Potongan Value Pack ({membershipDiscount.slotsToDeduct} jam)</span>
                    <span className="font-medium">
                      - {formatCurrency(membershipDiscount.discountAmount)}
                    </span>
                  </div>
                )}
                {addOnsTotal > 0 && (
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Subtotal add-ons</span>
                    <span className="text-foreground font-medium">
                      {formatCurrency(addOnsTotal)}
                    </span>
                  </div>
                )}
                {selectedPaymentMethod && paymentFeeBreakdown.totalFee > 0 && (
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Biaya Layanan</span>
                    <span className="text-foreground font-medium">
                      {formatCurrency(paymentFeeBreakdown.totalFee)}
                    </span>
                  </div>
                )}
                {!isCoveredByMembership && promoDiscountAmount > 0 && (
                  <div className="flex items-start justify-between gap-3 text-[#ad422b]">
                    <span>Promo {appliedPromoCode}</span>
                    <span className="font-medium">- {formatCurrency(promoDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex items-end justify-between gap-4 border-t border-black/15 pt-4 text-sm font-medium">
                  <span>Total Pembayaran</span>
                  <span className="text-[#ad422b]">{formatCurrency(totalAfterPromo)}</span>
                </div>
              </div>
            </div>
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
              {formatCurrency(totalAfterPromo)}
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
                      'flex w-full items-center justify-between gap-3 border p-4 text-left transition-colors',
                      isSelected
                        ? 'border-[#ad422b] bg-[#ad422b]/5'
                        : 'hover:bg-muted/10 border-black/15 hover:border-[#ad422b]/40'
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
                          className="h-12 w-12 rounded-none bg-white object-contain p-1"
                          unoptimized
                        />
                      ) : (
                        <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-none text-sm font-semibold">
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
        </DialogContent>
      </Dialog>

      {/* Add New Card Dialog */}
      <Dialog open={isAddCardModalOpen} onOpenChange={setAddCardModalOpen}>
        <DialogContent className="auth-dialog max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-none border-black/15 bg-[#f8f8f6] p-5 text-[#171717] sm:max-w-lg sm:p-7">
          <DialogHeader>
            <DialogTitle className="pr-6 text-left text-xl font-medium tracking-tight text-[#171717]">
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
