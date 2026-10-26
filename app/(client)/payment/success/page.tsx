import { Suspense } from 'react';
import PaymentResultPage from '@/components/invoice/PaymentResultPage';
import PaymentLoading from '@/components/invoice/PaymentLoading';
export default function Page() {
  return (
    <Suspense fallback={<PaymentLoading title="Memeriksa pembayaran" />}>
      <PaymentResultPage />
    </Suspense>
  );
}
