import { notFound } from 'next/navigation';
import PaymentSuccessPreview from '@/components/invoice/PaymentSuccessPreview';

export default function Page() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <PaymentSuccessPreview />;
}
