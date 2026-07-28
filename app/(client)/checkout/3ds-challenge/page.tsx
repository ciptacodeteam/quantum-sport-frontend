'use client';

import { Suspense } from 'react';
import { use3DSChallenge } from '@/hooks/use3DSChallenge';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

function Challenge3DSContent() {
  const router = useRouter();
  const { isLoading, error, status, paymentData, invoiceHref } = use3DSChallenge();

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
              Your payment has been authenticated and confirmed.
            </p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-700">
              Invoice #{paymentData?.invoiceNumber || paymentData?.invoiceId || 'N/A'}
            </p>
          </div>
          <div className="pt-4">
            <p className="text-sm text-slate-500">Redirecting to payment confirmation...</p>
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
              Your payment is still processing. Please check your invoice status shortly — do not
              pay again until it is confirmed.
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">
              Bank confirmation can take a short while after 3D Secure.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Button className="w-full" onClick={() => router.push(invoiceHref || '/invoice')}>
              Check Invoice Status
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push(invoiceHref || '/checkout')}
          >
            {invoiceHref ? 'View Invoice' : 'Back to Checkout'}
          </Button>
          <Button className="flex-1" onClick={() => router.push('/')}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

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
