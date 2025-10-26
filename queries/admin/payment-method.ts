import { getPaymentMethodApi, getPaymentMethodsApi } from '@/api/admin/payment-method';
import type { PaymentMethod } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminPaymentMethodsQueryOptions = queryOptions({
  queryKey: ['admin', 'payment-methods'],
  queryFn: getPaymentMethodsApi,
  select: (res) => res.data as PaymentMethod[]
});

export const adminPaymentMethodQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'payment-methods', id],
    queryFn: () => getPaymentMethodApi(id),
    select: (res) => res.data as PaymentMethod
  });
