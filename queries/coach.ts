import { getCoachAvailabilityApi, getCoachesApi } from '@/api/coach';
import type { Coach, CoachAvailability } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const coachesQueryOptions = queryOptions({
  queryKey: ['coaches'],
  queryFn: getCoachesApi,
  select: (res) => res.data as Coach[]
});

export const coachAvailabilityQueryOptions = (
  startAt?: string,
  endAt?: string,
  courtSport?: 'PADEL' | 'TENNIS'
) =>
  queryOptions({
    queryKey: ['coach', 'availability', startAt, endAt, courtSport],
    enabled: Boolean(startAt && endAt),
    queryFn: () => {
      if (!startAt || !endAt) {
        return Promise.resolve({ data: [] });
      }

      return getCoachAvailabilityApi({ startAt, endAt, courtSport });
    },
    select: (res) => res.data as CoachAvailability[]
  });
