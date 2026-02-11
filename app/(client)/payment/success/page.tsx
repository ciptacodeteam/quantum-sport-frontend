'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const [isChecking, setIsChecking] = useState(true);
  const [checkCount, setCheckCount] = useState(0);
  const maxChecks = 10; // Max 20 seconds (10 checks * 2 seconds)

  // Poll booking status to confirm payment
  useEffect(() => {
    if (!bookingId) {
      setIsChecking(false);
      return;
    }

    const checkInterval = setInterval(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/bookings/${bookingId}`);
          const booking = await response.json();

          if (booking.status === 'CONFIRMED' || booking.paymentStatus === 'PAID') {
            clearInterval(checkInterval);
            setIsChecking(false);
          } else if (checkCount >= maxChecks) {
            // Stop checking after max attempts
            clearInterval(checkInterval);
            setIsChecking(false);
          } else {
            setCheckCount((prev) => prev + 1);
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      })();
    }, 2000); // Check every 2 seconds

    return () => clearInterval(checkInterval);
  }, [bookingId, checkCount, maxChecks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-16">
      <MainHeader
        title="Payment Success"
        backHref="/booking"
        withCartBadge={false}
        withLogo={false}
        withBorder
      />

      <main className="mx-auto flex w-11/12 max-w-2xl flex-col items-center gap-6 pt-32">
        <div className="w-full space-y-6 rounded-2xl bg-white p-8 shadow-lg">
          {isChecking ? (
            <>
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="text-primary h-16 w-16 animate-spin" />
                <h1 className="text-center text-2xl font-bold text-gray-800">
                  Verifying Your Payment...
                </h1>
                <p className="text-center text-gray-600">
                  Please wait while we confirm your payment with the bank.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <h1 className="text-center text-3xl font-bold text-gray-800">
                  Payment Successful!
                </h1>
                <p className="text-center text-lg text-gray-600">
                  Your booking has been confirmed. Thank you for your payment!
                </p>
              </div>

              {bookingId && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Booking ID:</span> {bookingId}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    A confirmation email has been sent to your registered email address.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <Button size="lg" className="w-full" onClick={() => router.push('/bookings')}>
                  View My Bookings
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/')}
                >
                  Back to Home
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-center text-sm text-blue-700">
            <strong>✓ Secure Payment Completed</strong>
            <br />
            Your payment was processed securely through Xendit with 3D Secure authentication.
          </p>
        </div>
      </main>
    </div>
  );
}
