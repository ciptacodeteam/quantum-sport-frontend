import { getUserApi, getUsersApi } from '@/api/admin/user';
import type { UserProfile } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminUsersQueryOptions = queryOptions({
  queryKey: ['admin', 'users'],
  queryFn: getUsersApi,
  select: (res) => res.data as UserProfile[]
});

export const adminUserQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'users', id],
    queryFn: () => getUserApi(id),
    select: (res) => res.data as UserProfile
  });
