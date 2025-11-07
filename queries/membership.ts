import { getMembershipsApi } from '@/api/membership';
import type { Membership } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const membershipsQueryOptions = () =>
  queryOptions({
    queryKey: ['memberships'],
    queryFn: getMembershipsApi,
    select: (res) => res.data as Membership[]
  });

