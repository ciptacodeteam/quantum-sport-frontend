'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/utils';
import Image from 'next/image';

dayjs.locale('id');

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

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
      end: timeSlot,
    };
  }

  const start = parsed.format('HH:mm');
  const end = parsed.add(1, 'hour').format('HH:mm');

  return { start, end };
};

type CourtSlot = {
  courtId: string;
  courtName: string;
  timeSlot: string;
  date: string;
  price: number;
};

type CheckoutData = {
  bookingId?: string;
  invoiceId?: string;
  paymentMethod?: {
    id: string;
    name: string;
    channel?: string;
    logo?: string | null;
  };
  courtSlots?: CourtSlot[];
  breakdown?: {
    courtTotal?: number;
    addOnsTotal?: number;
    processingFee?: number;
    total?: number;
  };
  // Alternative naming conventions from backend
  booking?: any;
  invoice?: any;
  payment?: any;
  slots?: CourtSlot[];
  totalAmount?: number;
  subtotal?: number;
  processingFee?: number;
  paymentUrl?: string;
  expiresAt?: string;
};

const PaymentContent = () => {
  const router = useRouter();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Retrieve checkout data from sessionStorage
    const storedData = sessionStorage.getItem('checkoutData');
    
    if (!storedData) {
      // If no data, redirect back to checkout
      router.push('/checkout');
      return;
    }

    try {
      const data = JSON.parse(storedData);
      setCheckoutData(data);
    } catch (error) {
      console.error('Failed to parse checkout data:', error);
      router.push('/checkout');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader title="Detail Pembayaran" backHref="/checkout" withCartBadge withLogo={false} />
        <main className="flex min-h-[calc(100vh-96px)] flex-col items-center justify-center gap-4 px-6">
          <p className="text-sm text-muted-foreground">Memuat data pembayaran...</p>
        </main>
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader title="Detail Pembayaran" backHref="/checkout" withCartBadge withLogo={false} />
        <main className="flex min-h-[calc(100vh-96px)] flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-xl font-semibold">Data tidak ditemukan</h1>
          <p className="text-sm text-muted-foreground">
            Data pembayaran tidak ditemukan. Silakan kembali ke halaman checkout.
          </p>
          <Button onClick={() => router.push('/checkout')}>Kembali ke Checkout</Button>
        </main>
      </div>
    );
  }

  // Get court slots from various possible response structures
  const courtSlots = checkoutData.courtSlots || checkoutData.slots || [];
  
  // Group court slots by court and date
  const groupedCourts = courtSlots.reduce((acc, slot) => {
    const key = `${slot.courtId}-${slot.date}`;
    if (!acc[key]) {
      acc[key] = {
        courtName: slot.courtName,
        date: slot.date,
        slots: [],
      };
    }
    acc[key].slots.push(slot);
    return acc;
  }, {} as Record<string, { courtName: string; date: string; slots: CourtSlot[] }>);

  const courtGroups = Object.values(groupedCourts).sort(
    (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
  );

  // Calculate breakdown if not provided
  const breakdown = checkoutData.breakdown || {
    courtTotal: courtSlots.reduce((sum, slot) => sum + (slot.price || 0), 0),
    addOnsTotal: 0,
    processingFee: checkoutData.processingFee || 0,
    total: checkoutData.totalAmount || checkoutData.subtotal || 0,
  };

  // Get payment method info
  const paymentMethod = checkoutData.paymentMethod || {
    id: '',
    name: 'Metode Pembayaran',
    channel: '',
    logo: null,
  };

  const handleContinue = () => {
    // If there's a payment URL, redirect to it
    if (checkoutData.paymentUrl) {
      window.location.href = checkoutData.paymentUrl;
    } else {
      // Otherwise, redirect to booking history or home
      router.push('/booking');
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-28">
      <MainHeader title="Detail Pembayaran" backHref="/checkout" withCartBadge withLogo={false} />

      <main className="mx-auto flex w-11/12 max-w-4xl flex-col gap-6 pt-24 pb-28">
        {/* Court Bookings */}
        <section className="space-y-4 rounded-2xl border border-muted bg-white p-5 shadow-sm">
          {courtGroups.map((group, index) => (
            <div 
              key={`${group.courtName}-${group.date}`} 
              className={cn(
                'space-y-3', 
                index < courtGroups.length - 1 && 'pb-4 border-b border-dashed border-muted/80'
              )}
            >
              <header className="space-y-1">
                <h2 className="text-base font-semibold text-primary">{group.courtName}</h2>
                <p className="text-sm text-muted-foreground">
                  {dayjs(group.date).format('dddd, DD MMM YYYY')}
                </p>
              </header>

              <div className="space-y-2">
                {[...group.slots]
                  .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                  .map((slot, slotIndex) => {
                    const range = getSlotDisplayRange(slot.timeSlot);
                    return (
                      <div
                        key={`${slot.courtId}-${slot.timeSlot}-${slotIndex}`}
                        className="flex items-center justify-between rounded-xl border border-muted/60 bg-muted/15 px-4 py-3"
                      >
                        <span className="text-sm font-medium">
                          {range.start} - {range.end}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(slot.price)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </section>

        {/* Payment Method */}
        <section className="rounded-2xl border border-muted bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            {resolveMediaUrl(paymentMethod.logo) ? (
              <Image
                src={resolveMediaUrl(paymentMethod.logo)!}
                alt={paymentMethod.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-md object-contain"
                unoptimized
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
                {paymentMethod.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{paymentMethod.name}</p>
              {paymentMethod.channel && (
                <p className="text-xs text-muted-foreground uppercase">
                  {paymentMethod.channel}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Payment Summary */}
        <section className="rounded-2xl border border-muted bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold mb-3">Ringkasan Pembayaran</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Booking Court</span>
              <span className="font-medium text-foreground">
                {formatCurrency(breakdown.courtTotal || 0)}
              </span>
            </div>
            {(breakdown.addOnsTotal || 0) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Biaya Add Ons</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(breakdown.addOnsTotal || 0)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Biaya Proses</span>
              <span className="font-medium text-foreground">
                {formatCurrency(breakdown.processingFee || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-muted pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(breakdown.total || 0)}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with CTA */}
      <footer className="fixed inset-x-0 bottom-0 border-t border-muted bg-white shadow-lg">
        <div className="mx-auto w-11/12 max-w-4xl py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Sub total</p>
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(breakdown.total || 0)}
              </p>
            </div>
            <Button
              size="lg"
              className="min-w-[160px] bg-green-700 hover:bg-green-800"
              onClick={handleContinue}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PaymentContent;

