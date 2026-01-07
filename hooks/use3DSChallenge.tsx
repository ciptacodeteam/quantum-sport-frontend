import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CheckoutResponse } from '@/types/model';
import { toast } from 'sonner';

interface Use3DSChallengeResult {
  isLoading: boolean;
  error: string | null;
  status: 'pending' | 'success' | 'failed' | null;
  paymentData: CheckoutResponse | null;
}

/**
 * Hook to handle 3DS authentication challenge flow
 *
 * Usage:
 * - After redirect from 3DS challenge URL, this hook will:
 *   1. Check for authentication completion
 *   2. Verify payment status via webhook or polling
 *   3. Update booking/invoice status
 *   4. Redirect to success/failure pages
 */
export const use3DSChallenge = (): Use3DSChallengeResult => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [paymentData, setPaymentData] = useState<CheckoutResponse | null>(null);

  // Check if we're returning from 3DS challenge
  const isReturningFromChallenge = useCallback(() => {
    if (typeof window === 'undefined') return false;

    // Check for Xendit callback parameters
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');

    // Or check for stored 3DS data
    const storedData = sessionStorage.getItem('payment_3ds_data');

    return !!(paymentId || status || storedData);
  }, [searchParams]);

  // Poll for payment status (for webhook delays)
  const pollPaymentStatus = useCallback(async (invoiceId: string | undefined, maxAttempts = 10) => {
    if (!invoiceId) return null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // This would typically fetch invoice status from your API
        const response = await fetch(`/api/invoices/${invoiceId}`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          if (attempt === maxAttempts - 1) {
            throw new Error('Failed to fetch payment status');
          }
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        const data = await response.json();

        // Check if payment is confirmed
        if (data?.data?.paymentStatus === 'PAID' || data?.data?.status === 'CONFIRMED') {
          return { status: 'success', data: data?.data };
        }

        if (data?.data?.paymentStatus === 'FAILED') {
          return { status: 'failed', data: data?.data };
        }

        // Still pending, wait and retry
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
        if (attempt === maxAttempts - 1) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return null;
  }, []);

  // Main effect to handle 3DS flow
  useEffect(() => {
    const handle3DSFlow = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if we have stored 3DS data
        const storedData = sessionStorage.getItem('payment_3ds_data');
        if (storedData) {
          const data: CheckoutResponse = JSON.parse(storedData);
          setPaymentData(data);

          // Poll for payment completion
          const pollResult = await pollPaymentStatus(data.invoiceId);

          if (pollResult?.status === 'success') {
            setStatus('success');
            setIsLoading(false);

            // Redirect to success page after brief delay
            setTimeout(() => {
              const invoiceId = data.invoiceId || data.membershipUserId;
              router.push(`/checkout/success?invoiceId=${invoiceId}`);
            }, 2000);
          } else if (pollResult?.status === 'failed') {
            setStatus('failed');
            setError('Payment was declined. Please try again with a different card.');
            setIsLoading(false);
          } else {
            // Status still pending after polling
            setStatus('pending');
            setIsLoading(false);

            // Show message to user
            toast.info('Waiting for payment confirmation...');
          }

          // Clean up stored data
          sessionStorage.removeItem('payment_3ds_data');
        } else {
          // No 3DS data found - this shouldn't happen on the challenge page
          setStatus('failed');
          setError('No payment information found. Please start checkout again.');
          setIsLoading(false);
        }
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

    if (isReturningFromChallenge()) {
      handle3DSFlow();
    } else {
      setIsLoading(false);
    }
  }, [isReturningFromChallenge, pollPaymentStatus, router]);

  return {
    isLoading,
    error,
    status,
    paymentData
  };
};
