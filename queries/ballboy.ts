import { getBallboyAvailabilityApi } from '@/api/ballboy';
import type { BallboyAvailability } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const ballboyAvailabilityQueryOptions = (
  startAt?: string,
  endAt?: string,
  courtSport?: 'PADEL' | 'TENNIS'
) =>
  queryOptions({
    queryKey: ['ballboy', 'availability', startAt, endAt, courtSport],
    enabled: Boolean(startAt && endAt && courtSport === 'TENNIS'),
    queryFn: () => {
      if (!startAt || !endAt || courtSport !== 'TENNIS') {
        return Promise.resolve({ data: [] });
      }

      return getBallboyAvailabilityApi({ startAt, endAt, courtSport });
    },
    select: (res) => res.data as BallboyAvailability[]
  });
