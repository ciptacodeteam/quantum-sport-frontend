import { getPromoCodeApi, getPromoCodesApi } from '@/api/admin/promo-code';
import type { PromoCode } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminPromoCodesQueryOptions = queryOptions({
  queryKey: ['admin', 'promo-codes'],
  queryFn: getPromoCodesApi,
  select: (res) => res.data as PromoCode[]
});

export const adminPromoCodeQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'promo-codes', id],
    queryFn: () => getPromoCodeApi(id),
    select: (res) => res.data as PromoCode
  });
