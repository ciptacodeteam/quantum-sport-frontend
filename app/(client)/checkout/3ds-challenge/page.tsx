'use client';

import { Suspense } from 'react';
import { use3DSChallenge } from '@/hooks/use3DSChallenge';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

/**
 * 3DS Challenge Loading Content
 */
function Challenge3DSContent() {
  const { isLoading, error, status, paymentData } = use3DSChallenge();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="mx-4 w-full max-w-md space-y-6 rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="flex justify-center">
            <Spinner className="text-primary h-12 w-12" />
          </div>
          <div>
            <h1 className="mb-2 text-2xl font-bold text-slate-900">Authenticating Payment</h1>
            <p className="text-slate-600">
              Please wait while we verify your card with your bank. This process is secure and may
              take a few moments.
            </p>
          </div>
          <div className="pt-4">
            <p className="text-sm text-slate-500">Do not close this window or go back</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="mx-4 w-full max-w-md space-y-6 rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <div>
            <h1 className="mb-2 text-2xl font-bold text-slate-900">Payment Successful!</h1>
            <p className="text-slate-600">
              Your payment has been authenticated and your booking is confirmed.
            </p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-700">Invoice #{paymentData?.invoiceNumber || 'N/A'}</p>
          </div>
          <div className="pt-4">
            <p className="text-sm text-slate-500">Redirecting to your booking...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="mx-4 w-full max-w-md space-y-6 rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="flex justify-center">
            <Clock className="h-16 w-16 text-amber-500" />
          </div>
          <div>
            <h1 className="mb-2 text-2xl font-bold text-slate-900">Confirming Payment</h1>
            <p className="text-slate-600">
              Your payment is being processed. Please wait while we confirm the transaction with
              your bank.
            </p>
          </div>
          <div className="space-y-3">
            <div className="animate-pulse">
              <div className="h-2 rounded-full bg-slate-200"></div>
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">
              This may take up to 2 minutes. Please do not close this window.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-4 w-full max-w-md space-y-6 rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        <div>
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Payment Authentication Failed</h1>
          <p className="text-slate-600">
            {error ||
              'We encountered an issue while authenticating your payment. Please try again.'}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            If you continue to experience issues, please contact our support team.
          </p>
        </div>
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => (window.location.href = '/checkout')}
            className="flex-1 rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-900 transition-colors hover:bg-slate-200"
          >
            Back to Checkout
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="bg-primary hover:bg-primary/90 flex-1 rounded-lg px-4 py-2 font-medium text-white transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 3DS Challenge Page
 * Handles user redirect from Xendit 3DS authentication
 */
export default function ThreeDSChallengePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="h-12 w-12" />
        </div>
      }
    >
      <Challenge3DSContent />
    </Suspense>
  );
}
