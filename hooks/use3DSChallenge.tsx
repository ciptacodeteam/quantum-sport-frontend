import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CheckoutResponse } from '@/types/model';
import { getInvoiceApi } from '@/api/booking';
import { toast } from 'sonner';

interface Use3DSChallengeResult {
  isLoading: boolean;
  error: string | null;
  status: 'pending' | 'success' | 'failed' | null;
  paymentData: CheckoutResponse | null;
  invoiceHref: string | null;
}

type InvoiceApiResponse = {
  success?: boolean;
  data?: {
    id: string;
    number: string;
    status: string;
  } | null;
};

const TERMINAL_FAILURE_STATUSES = new Set(['FAILED', 'EXPIRED', 'CANCELLED']);
const POLL_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 2000;

function buildInvoiceHref(invoiceId?: string | null, invoiceNumber?: string | null) {
  const lookup = invoiceNumber || invoiceId;
  return lookup ? `/invoice/${lookup}` : '/invoice';
}

function buildPaymentSuccessHref(invoiceId?: string | null, invoiceNumber?: string | null) {
  const params = new URLSearchParams();
  if (invoiceNumber) params.set('invoice_number', invoiceNumber);
  else if (invoiceId) params.set('invoice_id', invoiceId);
  const query = params.toString();
  return query ? `/payment/success?${query}` : '/payment/success';
}

/**
 * Hook to handle 3DS authentication challenge return flow.
 * Polls the real invoice API until PAID / failed / timeout, then routes to
 * the verified payment success page (or shows failure).
 */
export const use3DSChallenge = (): Use3DSChallengeResult => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [paymentData, setPaymentData] = useState<CheckoutResponse | null>(null);
  const [invoiceHref, setInvoiceHref] = useState<string | null>(null);
  const startedRef = useRef(false);

  const pollPaymentStatus = useCallback(
    async (invoiceLookup: string, maxAttempts = POLL_ATTEMPTS) => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const response = (await getInvoiceApi(invoiceLookup)) as InvoiceApiResponse;
          const invoice = response?.data;

          if (!invoice) {
            if (attempt === maxAttempts - 1) {
              return { status: 'failed' as const, data: null };
            }
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
            continue;
          }

          if (invoice.status === 'PAID') {
            return { status: 'success' as const, data: invoice };
          }

          if (TERMINAL_FAILURE_STATUSES.has(invoice.status)) {
            return { status: 'failed' as const, data: invoice };
          }

          if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
          }
        } catch (err) {
          console.error('Error polling payment status:', err);
          if (attempt === maxAttempts - 1) {
            throw err;
          }
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        }
      }

      return { status: 'pending' as const, data: null };
    },
    []
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const handle3DSFlow = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const queryInvoiceId = searchParams.get('invoice_id');
        const queryInvoiceNumber = searchParams.get('invoice_number');
        const queryStatus = searchParams.get('status');

        let stored: CheckoutResponse | null = null;
        const rawStored = sessionStorage.getItem('payment_3ds_data');
        if (rawStored) {
          try {
            stored = JSON.parse(rawStored) as CheckoutResponse;
            setPaymentData(stored);
          } catch {
            stored = null;
          }
        }

        const invoiceLookup =
          queryInvoiceNumber ||
          queryInvoiceId ||
          stored?.invoiceNumber ||
          stored?.invoiceId ||
          null;

        setInvoiceHref(buildInvoiceHref(stored?.invoiceId, stored?.invoiceNumber || invoiceLookup));

        if (!invoiceLookup) {
          setStatus('failed');
          setError('No payment information found. Please start checkout again.');
          setIsLoading(false);
          return;
        }

        if (queryStatus && ['FAILED', 'EXPIRED', 'CANCELLED'].includes(queryStatus.toUpperCase())) {
          setStatus('failed');
          setError('Payment was declined. Please try again with a different card.');
          setIsLoading(false);
          sessionStorage.removeItem('payment_3ds_data');
          return;
        }

        const pollResult = await pollPaymentStatus(invoiceLookup);

        if (pollResult.status === 'success') {
          setStatus('success');
          setIsLoading(false);
          sessionStorage.removeItem('payment_3ds_data');

          const successInvoiceNumber = pollResult.data?.number || stored?.invoiceNumber;
          const successInvoiceId = pollResult.data?.id || stored?.invoiceId || queryInvoiceId;

          setTimeout(() => {
            router.replace(buildPaymentSuccessHref(successInvoiceId, successInvoiceNumber));
          }, 1200);
          return;
        }

        if (pollResult.status === 'failed') {
          setStatus('failed');
          setError('Payment was declined. Please try again with a different card.');
          setIsLoading(false);
          sessionStorage.removeItem('payment_3ds_data');
          return;
        }

        setStatus('pending');
        setIsLoading(false);
        toast.info('Waiting for payment confirmation. Check your invoice status shortly.');
        sessionStorage.removeItem('payment_3ds_data');
      } catch (err) {
        console.error('3DS challenge error:', err);
        setStatus('failed');
        setError(
          err instanceof Error
            ? err.message
            : 'An error occurred during payment authentication. Please contact support.'
        );
        setIsLoading(false);
      }
    };

    void handle3DSFlow();
  }, [pollPaymentStatus, router, searchParams]);

  return {
    isLoading,
    error,
    status,
    paymentData,
    invoiceHref
  };
};
