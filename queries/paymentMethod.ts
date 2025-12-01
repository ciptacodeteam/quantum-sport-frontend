import { getPaymentMethodsApi } from '@/api/paymentMethod';
import type { PaymentMethod } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const paymentMethodsQueryOptions = () =>
  queryOptions({
    queryKey: ['payment-methods'],
    queryFn: getPaymentMethodsApi,
    select: (res) => res.data as PaymentMethod[]
  });
