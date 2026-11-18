import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CoachingPackage } from '@/types/coaching-tracking';

export const myCoachingPackagesQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['memberships', 'my', 'coaching-tracking', userId],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<{ data: { packages: CoachingPackage[] } }>(
        '/memberships/my/coaching/tracking',
        { signal }
      );
      return data.data;
    }
  });
