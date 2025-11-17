import { getAdminNotificationsApi } from '@/api/admin/notification';
import type { SearchParamsData } from '@/types';
import type { AdminNotification } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminNotificationsQueryOptions = (queryParams?: SearchParamsData) =>
  queryOptions({
    queryKey: ['admin', 'notifications', queryParams],
    queryFn: () => getAdminNotificationsApi(queryParams),
    select: (res) => res.data as AdminNotification[],
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2 // Auto-refetch every 2 minutes
  });
