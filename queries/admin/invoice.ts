import { getInvoiceApi, getInvoicesApi } from '@/api/admin/invoice';
import type { Invoice } from '@/types/model';
import type { SearchParamsData } from '@/types';
import { queryOptions } from '@tanstack/react-query';

export const adminInvoicesQueryOptions = (queryParams?: SearchParamsData) =>
  queryOptions({
    queryKey: ['admin', 'invoices', queryParams],
    queryFn: () => getInvoicesApi(queryParams),
    select: (res) =>
      res.data as any as Array<
        Pick<
          Invoice,
          | 'id'
          | 'number'
          | 'subtotal'
          | 'processingFee'
          | 'total'
          | 'issuedAt'
          | 'paidAt'
          | 'cancelledAt'
        > & {
          type: 'BOOKING' | 'CLASS_BOOKING' | 'MEMBERSHIP';
          status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
          paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
          user: { id: string; name: string; email: string; phone?: string | null };
        }
      >
  });

export const adminInvoiceQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'invoices', id],
    queryFn: () => getInvoiceApi(id),
    select: (res) => res.data as any
  });
