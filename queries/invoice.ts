import { getAllInvoicesApi, getInvoiceApi } from '@/api/booking';
import { queryOptions } from '@tanstack/react-query';
import type { SearchParamsData } from '@/types';

export const invoiceQueryOptions = (invoiceId: string) =>
  queryOptions({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoiceApi(invoiceId),
    enabled: !!invoiceId
  });

export const invoicesQueryOptions = (queryParams: SearchParamsData = {}) =>
  queryOptions({
    queryKey: ['invoices', queryParams],
    queryFn: () => getAllInvoicesApi(queryParams)
  });
