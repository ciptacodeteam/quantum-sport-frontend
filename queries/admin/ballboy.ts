import { getAdminBallboyAvailabilityApi } from '@/api/admin/ballboy';
import type { BallboyAvailability } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminBallboyAvailabilityQueryOptions = (
  startAt?: string,
  endAt?: string,
  courtSport?: 'PADEL' | 'TENNIS'
) =>
  queryOptions({
    queryKey: ['admin', 'ballboy', 'availability', startAt ?? 'all', endAt ?? 'all', courtSport],
    enabled: Boolean(startAt && endAt && courtSport === 'TENNIS'),
    queryFn: () => {
      if (!startAt || !endAt || courtSport !== 'TENNIS') {
        return Promise.resolve({ data: [] as BallboyAvailability[] });
      }

      return getAdminBallboyAvailabilityApi({ startAt, endAt, courtSport });
    },
    select: (res) => res.data as BallboyAvailability[]
  });
