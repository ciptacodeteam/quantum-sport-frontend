import { getPartnershipApi, getPartnershipsApi } from '@/api/admin/partnership';
import type { Partnership } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminPartnershipsQueryOptions = queryOptions({
  queryKey: ['admin', 'partnerships'],
  queryFn: getPartnershipsApi,
  select: (res) => res.data as Partnership[]
});

export const adminPartnershipQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'partnerships', id],
    queryFn: () => getPartnershipApi(id),
    select: (res) => res.data as Partnership
  });

