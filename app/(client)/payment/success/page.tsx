'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { getInvoiceApi } from '@/api/booking';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type InvoiceApiResponse = {
  success?: boolean;
  data?: {
    id: string;
    number: string;
    status: string;
    bookingId?: string | null;
    booking?: { id: string; status: string } | null;
  } | null;
  msg?: string;
};

type PaymentViewState = 'verifying' | 'paid' | 'failed' | 'pending' | 'missing';

const TERMINAL_FAILURE_STATUSES = new Set(['FAILED', 'EXPIRED', 'CANCELLED']);
const PAID_STATUS = 'PAID';
const MAX_POLL_MS = 30_000;
const POLL_INTERVAL_MS = 2_000;

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoice_id');
  const invoiceNumber = searchParams.get('invoice_number');
  const bookingId = searchParams.get('booking_id');

  const invoiceLookup = invoiceNumber || invoiceId;
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setTimedOut(false);
    if (!invoiceLookup) return;

    const timeoutId = window.setTimeout(() => {
      setTimedOut(true);
    }, MAX_POLL_MS);

    return () => window.clearTimeout(timeoutId);
  }, [invoiceLookup]);

  const {
    data: response,
    isError,
    isPending,
    isFetching
  } = useQuery({
    queryKey: ['payment-success-invoice', invoiceLookup],
    queryFn: () => getInvoiceApi(invoiceLookup!),
    enabled: !!invoiceLookup,
    refetchInterval: (query) => {
      const typed = query.state.data as InvoiceApiResponse | undefined;
      const status = typed?.data?.status;
      if (status === PAID_STATUS || TERMINAL_FAILURE_STATUSES.has(status || '')) {
        return false;
      }
      if (timedOut) {
        return false;
      }
      return POLL_INTERVAL_MS;
    },
    refetchIntervalInBackground: true,
    retry: 1
  });

  const typedResponse = response as InvoiceApiResponse | undefined;
  const invoice = typedResponse?.data ?? null;
  const status = invoice?.status;
  const resolvedInvoiceNumber = invoice?.number || invoiceNumber || invoiceId;

  const viewState: PaymentViewState = (() => {
    if (!invoiceLookup) return 'missing';
    if (status === PAID_STATUS) return 'paid';
    if (TERMINAL_FAILURE_STATUSES.has(status || '')) return 'failed';
    if (timedOut || isError) return 'pending';
    if (isPending || isFetching || !status) return 'verifying';
    return 'verifying';
  })();

  const invoiceHref = resolvedInvoiceNumber
    ? `/invoice/${resolvedInvoiceNumber}`
    : '/invoice';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-16">
      <MainHeader
        title={
          viewState === 'paid'
            ? 'Payment Success'
            : viewState === 'failed'
              ? 'Payment Failed'
              : 'Payment Status'
        }
        backHref="/booking"
        withCartBadge={false}
        withLogo={false}
        withBorder
      />

      <main className="mx-auto flex w-11/12 max-w-2xl flex-col items-center gap-6 pt-32">
        <div className="w-full space-y-6 rounded-2xl bg-white p-8 shadow-lg">
          {viewState === 'verifying' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="text-primary h-16 w-16 animate-spin" />
              <h1 className="text-center text-2xl font-bold text-gray-800">
                Verifying Your Payment...
              </h1>
              <p className="text-center text-gray-600">
                Please wait while we confirm your payment. Do not close this page.
              </p>
            </div>
          )}

          {viewState === 'paid' && (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <h1 className="text-center text-3xl font-bold text-gray-800">Payment Successful!</h1>
                <p className="text-center text-lg text-gray-600">
                  Your payment has been confirmed. Thank you!
                </p>
              </div>

              {resolvedInvoiceNumber && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Invoice:</span> {resolvedInvoiceNumber}
                  </p>
                  {(invoice?.bookingId || bookingId) && (
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-semibold">Booking:</span>{' '}
                      {invoice?.bookingId || bookingId}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    A confirmation email has been sent to your registered email address.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <Button size="lg" className="w-full" onClick={() => router.push(invoiceHref)}>
                  View Invoice
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

          {viewState === 'pending' && (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-amber-100 p-4">
                  <Clock className="h-16 w-16 text-amber-600" />
                </div>
                <h1 className="text-center text-3xl font-bold text-gray-800">
                  Payment Still Processing
                </h1>
                <p className="text-center text-lg text-gray-600">
                  We have not confirmed your payment yet. It may take a moment for the bank to
                  notify us.
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    Please check your invoice shortly. Do not pay again until you confirm the
                    status.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button size="lg" className="w-full" onClick={() => router.push(invoiceHref)}>
                  Check Invoice Status
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

          {viewState === 'failed' && (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-red-100 p-4">
                  <XCircle className="h-16 w-16 text-red-600" />
                </div>
                <h1 className="text-center text-3xl font-bold text-gray-800">Payment Not Completed</h1>
                <p className="text-center text-lg text-gray-600">
                  Your payment was {status?.toLowerCase() || 'unsuccessful'}. Please try again from
                  your invoice.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button size="lg" className="w-full" onClick={() => router.push(invoiceHref)}>
                  View Invoice & Retry
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

          {viewState === 'missing' && (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-amber-100 p-4">
                  <AlertTriangle className="h-16 w-16 text-amber-600" />
                </div>
                <h1 className="text-center text-3xl font-bold text-gray-800">
                  Missing Payment Reference
                </h1>
                <p className="text-center text-lg text-gray-600">
                  We could not find an invoice to verify. Please open your invoice from history.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button size="lg" className="w-full" onClick={() => router.push('/invoice')}>
                  Go to Invoices
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

        {viewState === 'paid' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-center text-sm text-blue-700">
              <strong>Secure Payment Completed</strong>
              <br />
              Your payment was processed securely through Xendit.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-16">
          <MainHeader
            title="Payment Status"
            backHref="/booking"
            withCartBadge={false}
            withLogo={false}
            withBorder
          />
          <main className="mx-auto flex w-11/12 max-w-2xl flex-col items-center gap-6 pt-32">
            <div className="w-full space-y-6 rounded-2xl bg-white p-8 shadow-lg">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="text-primary h-16 w-16 animate-spin" />
                <h1 className="text-center text-2xl font-bold text-gray-800">Loading...</h1>
              </div>
            </div>
          </main>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
