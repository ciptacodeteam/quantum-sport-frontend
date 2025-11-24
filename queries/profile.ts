import { getProfileApiSmart } from '@/api/auth';
import type { AdminProfile, UserProfile } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const profileQueryOptions = queryOptions({
  queryKey: ['profile'],
  queryFn: getProfileApiSmart,
  select: (res) => res.data as UserProfile | AdminProfile
});
