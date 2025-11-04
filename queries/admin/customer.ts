import { getCustomerApi, getCustomersApi } from '@/api/admin/customer';
import type { Customer } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminCustomersQueryOptions = queryOptions({
  queryKey: ['admin', 'customers'],
  queryFn: getCustomersApi,
  select: (res) => res.data as Customer[]
});

export const adminCustomerQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'customers', id],
    queryFn: () => getCustomerApi(id),
    select: (res) => res.data as Customer
  });
