import { getPaymentMethodsApi } from '@/api/paymentMethod';
import type { PaymentMethod } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

const samplePaymentMethods: PaymentMethod[] = [
  {
    id: 'cmhrf96er000472q8dh0mtok0',
    name: 'BCA',
    logo: 'http://localhost:8000/storage/uploads/payment-methods/bca-20251109075839-abe2ae5b396be55b.png',
    fees: 2000,
    percentage: '2',
    channel: 'CC',
    isActive: true,
    createdAt: new Date('2025-11-09T07:58:39.028Z'),
    updatedAt: new Date('2025-11-09T07:58:39.028Z'),
  },
  {
    id: 'cmhkus8q800u472v0dxpprzji',
    name: 'MANDIRI VA',
    logo: 'http://localhost:8000/storage/uploads/payment-methods/mandiri-20251104173859-34294cdb7633f34e.png',
    fees: 2000,
    percentage: '2',
    channel: 'VA',
    isActive: true,
    createdAt: new Date('2025-11-04T17:38:59.504Z'),
    updatedAt: new Date('2025-11-04T17:39:24.516Z'),
  },
  {
    id: 'cmhrf8b2p000372q8zc6k1dck',
    name: 'QRIS',
    logo: 'http://localhost:8000/storage/uploads/payment-methods/qris-20251109075758-073e917ff530ee45.png',
    fees: 2000,
    percentage: '2',
    channel: 'QRIS',
    isActive: true,
    createdAt: new Date('2025-11-09T07:57:58.417Z'),
    updatedAt: new Date('2025-11-09T07:57:58.417Z'),
  },
];

export const paymentMethodsQueryOptions = () =>
  queryOptions({
    queryKey: ['payment-methods'],
    queryFn: getPaymentMethodsApi,
    select: (res) => res.data as PaymentMethod[],
    placeholderData: samplePaymentMethods,
  });
