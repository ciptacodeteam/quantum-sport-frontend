import { getProfileApi } from '@/api/auth';
import type { UserProfile } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const profileQueryOptions = queryOptions({
  queryKey: ['profile'],
  queryFn: getProfileApi,
  select: (res) => res.data as UserProfile
});
