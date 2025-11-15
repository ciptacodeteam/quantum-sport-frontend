import { getAdminCoachAvailabilityApi } from '@/api/admin/coach';
import type { CoachAvailability } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminCoachAvailabilityQueryOptions = (startAt?: string, endAt?: string) =>
  queryOptions({
    queryKey: ['admin', 'coach', 'availability', startAt ?? 'all', endAt ?? 'all'],
    enabled: Boolean(startAt && endAt),
    queryFn: () => {
      if (!startAt || !endAt) {
        return Promise.resolve({ data: [] as CoachAvailability[] });
      }
      return getAdminCoachAvailabilityApi({ startAt, endAt });
    },
    select: (res) => res.data as CoachAvailability[]
  });

