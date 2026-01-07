import { getCoachAvailabilityApi } from '@/api/coach';
import type { CoachAvailability } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const coachAvailabilityQueryOptions = (startAt?: string, endAt?: string) =>
  queryOptions({
    queryKey: ['coach', 'availability', startAt, endAt],
    enabled: Boolean(startAt && endAt),
    queryFn: () => {
      if (!startAt || !endAt) {
        return Promise.resolve({ data: [] });
      }

      return getCoachAvailabilityApi({ startAt, endAt });
    },
    select: (res) => res.data as CoachAvailability[]
  });
