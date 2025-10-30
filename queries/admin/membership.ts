import { getMembershipApi, getMembershipsApi } from '@/api/admin/membership';
import type { Membership } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminMembershipsQueryOptions = queryOptions({
  queryKey: ['admin', 'memberships'],
  queryFn: getMembershipsApi,
  select: (res) => res.data as Membership[]
});

export const adminMembershipQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'memberships', id],
    queryFn: () => getMembershipApi(id),
    select: (res) => res.data as Membership
  });
