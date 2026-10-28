'use client';

import MainHeader from '@/components/headers/MainHeader';
import { LoaderCircle } from 'lucide-react';

export function PaymentLoadingContent({
  title = 'Menyiapkan pembayaran',
  description = 'Mohon tunggu, informasi pembayaran sedang dimuat.'
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex w-full max-w-md flex-col items-center border border-black/15 bg-[#f8f8f6] px-6 py-12 text-center sm:p-12"
    >
      <div className="mb-6 flex size-14 items-center justify-center border border-[#ad422b]/20 bg-[#ad422b]/5 text-[#ad422b]">
        <LoaderCircle
          className="size-6 animate-spin motion-reduce:animate-none"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>
      <h1 className="text-xl font-medium tracking-tight text-[#171717]">{title}</h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-black/50">{description}</p>
    </div>
  );
}

export default function PaymentLoading({
  title,
  description
}: {
  title?: string;
  description?: string;
}) {
  return (
    <>
      <MainHeader />
      <main className="invoice-page mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center px-5 pt-24 pb-12 sm:px-8">
        <PaymentLoadingContent title={title} description={description} />
      </main>
    </>
  );
}

export function PaymentProcessingOverlay({
  title,
  description
}: { title?: string; description?: string } = {}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-5 backdrop-blur-sm"
      aria-busy="true"
    >
      <PaymentLoadingContent
        title={title ?? 'Memproses pembayaran'}
        description={
          description ?? 'Mohon tunggu hingga halaman pembayaran siap. Jangan tutup halaman ini.'
        }
      />
    </div>
  );
}
