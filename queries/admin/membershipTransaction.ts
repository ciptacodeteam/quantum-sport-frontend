import {
  getAdminMembershipTransactionsApi,
  getAdminMembershipTransactionDetailApi
} from '@/api/admin/membershipTransaction';
import type { SearchParamsData } from '@/types';
import type { MembershipUser } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminMembershipTransactionsQueryOptions = (queryParams?: SearchParamsData) =>
  queryOptions({
    queryKey: ['admin', 'membership-transactions', queryParams],
    queryFn: () => getAdminMembershipTransactionsApi(queryParams),
    select: (res) => res.data as MembershipUser[],
    staleTime: 1000 * 60 // 1 minute
  });

export const adminMembershipTransactionDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'membership-transactions', id],
    queryFn: () => getAdminMembershipTransactionDetailApi(id),
    select: (res) => res.data as MembershipUser,
    enabled: !!id
  });
