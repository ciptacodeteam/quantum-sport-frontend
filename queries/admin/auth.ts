import { checkAdminAccountApi, getProfileApi } from '@/api/admin/auth';
import type { AdminProfile } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminProfileQueryOptions = queryOptions({
  queryKey: ['admin', 'auth', 'profile'],
  queryFn: getProfileApi,
  staleTime: 5 * 60 * 1000, // 5 minutes
  select: (res) => res.data as AdminProfile
});

type CheckAdminAccountResponse = {
  hasAccount: boolean;
};

export const checkAdminAccountQueryOptions = queryOptions({
  queryKey: ['admin', 'auth', 'check-account'],
  queryFn: checkAdminAccountApi,
  staleTime: 5 * 60 * 1000, // 5 minutes
  select: (res) => res.data as CheckAdminAccountResponse
});
