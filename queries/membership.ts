import { getMembershipsApi, getMembershipApi } from '@/api/membership';
import type { Membership } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const membershipsQueryOptions = () =>
  queryOptions({
    queryKey: ['memberships'],
    queryFn: getMembershipsApi,
    select: (res) => res.data as Membership[]
  });

export const membershipQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['memberships', id],
    queryFn: () => getMembershipApi(id),
    select: (res) => res.data as Membership
  });
