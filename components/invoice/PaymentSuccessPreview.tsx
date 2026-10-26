'use client';

import { useState } from 'react';
import Link from 'next/link';
import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import PaymentOutcomeCard from './PaymentOutcomeCard';
import PaymentSummaryCard from './PaymentSummaryCard';
import BookingDetailsCard from './BookingDetailsCard';

export default function PaymentSuccessPreview() {
  const [replay, setReplay] = useState(0);
  return (
    <>
      <MainHeader />
      <main className="invoice-page mx-auto w-full max-w-7xl px-5 pt-24 pb-12 text-[#171717] sm:px-8 xl:pt-32">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-[#ad422b]/20 bg-[#ad422b]/5 p-4 text-xs text-[#ad422b]">
          <p>Preview lokal · Data contoh. Tidak ada pembayaran atau perubahan status transaksi.</p>
          <Button
            variant="outline"
            className="h-10 rounded-full border-[#ad422b]/25 bg-transparent px-4 text-xs shadow-none"
            onClick={() => setReplay((value) => value + 1)}
          >
            Ulangi animasi
          </Button>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            <PaymentOutcomeCard key={replay} status="PAID" />
            <details className="border border-black/15 bg-white">
              <summary className="cursor-pointer px-5 py-4 text-sm font-medium marker:text-[#ad422b] sm:px-6">
                Detail pesanan
              </summary>
              <div className="border-t border-black/10 p-5">
                <BookingDetailsCard
                  details={[
                    {
                      price: 150000,
                      court: { id: 'preview-court', name: 'Court 2' },
                      slot: { startAt: '2026-10-23T00:00:00Z', endAt: '2026-10-23T01:00:00Z' }
                    },
                    {
                      price: 150000,
                      court: { id: 'preview-court', name: 'Court 2' },
                      slot: { startAt: '2026-10-23T01:00:00Z', endAt: '2026-10-23T02:00:00Z' }
                    }
                  ]}
                />
              </div>
            </details>
          </div>
          <aside className="space-y-4 lg:sticky lg:top-28">
            <PaymentSummaryCard
              subtotal={300000}
              processingFee={2331}
              total={302331}
              method={{ name: 'QRIS' }}
            />
            <Button asChild variant="outline" className="h-12 w-full rounded-full border-black/20">
              <Link href="/">Kembali ke beranda</Link>
            </Button>
          </aside>
        </div>
      </main>
    </>
  );
}
