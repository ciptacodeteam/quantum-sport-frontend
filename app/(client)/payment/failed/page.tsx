'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, AlertTriangle } from 'lucide-react';

export default function PaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const invoiceId = searchParams.get('invoice_id');
  const errorMessage = searchParams.get('error_message');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-16">
      <MainHeader
        title="Payment Failed"
        backHref="/checkout"
        withCartBadge={false}
        withLogo={false}
        withBorder
      />

      <main className="mx-auto flex w-11/12 max-w-2xl flex-col items-center gap-6 pt-32">
        <div className="w-full space-y-6 rounded-2xl bg-white p-8 shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-red-100 p-4">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
            <h1 className="text-center text-3xl font-bold text-gray-800">Payment Failed</h1>
            <p className="text-center text-lg text-gray-600">
              We were unable to process your payment. Please try again.
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">Error Details:</p>
                  <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {invoiceId && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Invoice ID:</span> {invoiceId}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                You can retry payment for this invoice or create a new booking.
              </p>
            </div>
          )}

          {bookingId && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Booking ID:</span> {bookingId}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Your booking is on hold. Please complete payment to confirm.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            {invoiceId && (
              <Button
                size="lg"
                className="w-full"
                onClick={() => router.push(`/invoice/${invoiceId}`)}
              >
                View Invoice & Retry Payment
              </Button>
            )}
            <Button
              size="lg"
              variant={invoiceId ? 'outline' : 'default'}
              className="w-full"
              onClick={() => router.push('/checkout')}
            >
              {invoiceId ? 'Create New Booking' : 'Try Again'}
            </Button>
            <Button size="lg" variant="outline" className="w-full" onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </div>
        </div>

        <div className="w-full space-y-4 rounded-lg border border-orange-200 bg-orange-50 p-6">
          <h3 className="font-semibold text-orange-900">Common Issues:</h3>
          <ul className="space-y-2 text-sm text-orange-800">
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Insufficient funds in your card</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Incorrect card details or CVV</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Card expired or blocked</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>3D Secure verification failed or timed out</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Bank declined the transaction</span>
            </li>
          </ul>
          <p className="pt-2 text-sm text-orange-700">
            If the issue persists, please contact your bank or try a different payment method.
          </p>
        </div>
      </main>
    </div>
  );
}
