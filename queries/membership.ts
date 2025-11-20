import { getMembershipsApi, getMembershipApi, getMyMembershipsApi, getMyMembershipApi } from '@/api/membership';
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

export const myMembershipsQueryOptions = queryOptions({
  queryKey: ['memberships', 'my'],
  queryFn: getMyMembershipsApi,
  select: (res) => res.data as {
    active: Array<{
      id: string;
      userId: string;
      membershipId: string;
      startDate: string;
      endDate: string;
      remainingSessions: number;
      remainingDuration: number;
      isExpired: boolean;
      isSuspended: boolean;
      membership: Membership;
    }>;
    expired: Array<any>;
    suspended: Array<any>;
    total: number;
  }
});

export type UserMembershipResponse = {
  activeMembership: {
    id: string;
    startDate: string;
    endDate: string;
    remainingSessions: number;
    remainingDuration: number;
    isExpired: boolean;
    isSuspended: boolean;
    membership: {
      id: string;
      name: string;
      price: number;
    };
  } | null;
};

export const myMembershipQueryOptions = queryOptions({
  queryKey: ['memberships', 'my', 'active'],
  queryFn: getMyMembershipApi,
  select: (res) => res.data as UserMembershipResponse,
  enabled: true // Will be controlled by authentication status
});
