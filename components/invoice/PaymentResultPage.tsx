'use client';

import { getInvoiceApi } from '@/api/booking';
import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import PaymentLoading from './PaymentLoading';
import PaymentOutcomeCard from './PaymentOutcomeCard';

type Response = { data?: { number: string; status: string } | null };
const terminal = ['PAID', 'FAILED', 'EXPIRED', 'CANCELLED'];

export default function PaymentResultPage() {
  const search = useSearchParams();
  const lookup = search.get('invoice_number') || search.get('invoice_id');
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    setTimedOut(false);
    if (!lookup) return;
    const timeout = window.setTimeout(() => setTimedOut(true), 30_000);
    return () => window.clearTimeout(timeout);
  }, [lookup]);
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ['payment-result-invoice', lookup],
    queryFn: () => getInvoiceApi(lookup!),
    enabled: !!lookup,
    refetchInterval: (query) =>
      terminal.includes((query.state.data as Response | undefined)?.data?.status || '') || timedOut
        ? false
        : 2000,
    refetchIntervalInBackground: true,
    retry: 1
  });
  const invoice = (data as Response | undefined)?.data;
  const confirmed = terminal.includes(invoice?.status || '');
  if (lookup && !confirmed && !isError && (isPending || !timedOut)) {
    return (
      <PaymentLoading
        title="Memeriksa pembayaran"
        description="Mohon tunggu, kami sedang memeriksa konfirmasi pembayaran Anda."
      />
    );
  }
  const status = !lookup
    ? 'MISSING'
    : confirmed
      ? invoice!.status
      : isError || !invoice
        ? 'UNKNOWN'
        : 'PENDING';
  const reference = invoice?.number || lookup;
  return (
    <>
      <MainHeader />
      <main className="invoice-page mx-auto flex min-h-dvh w-full max-w-2xl items-center px-5 pt-28 pb-12 sm:px-8">
        <div className="w-full">
          <PaymentOutcomeCard
            status={status}
            description={
              status === 'PAID'
                ? 'Pembayaran Anda telah dikonfirmasi. Terima kasih telah memilih Black Padel.'
                : undefined
            }
          >
            {reference && <p className="mb-6 text-xs break-all text-black/45">{reference}</p>}
            <div className="flex flex-col gap-3">
              {reference ? (
                <Button asChild className="h-12 rounded-full bg-[#111111] px-7">
                  <Link href={`/invoice/${encodeURIComponent(reference)}`}>
                    Lihat detail transaksi
                  </Link>
                </Button>
              ) : (
                <Button asChild className="h-12 rounded-full">
                  <Link href="/invoice">Riwayat pemesanan</Link>
                </Button>
              )}
              {lookup && !confirmed && (
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-black/20"
                  disabled={isFetching}
                  onClick={() => void refetch()}
                >
                  {isFetching ? 'Memeriksa…' : 'Periksa status kembali'}
                </Button>
              )}
              <Button asChild variant="ghost" className="h-12 rounded-full">
                <Link href="/">Kembali ke beranda</Link>
              </Button>
            </div>
          </PaymentOutcomeCard>
        </div>
      </main>
    </>
  );
}
