import { getUserNotificationsApi } from '@/api/notification';
import type { Notification } from '@/types/model';
import type { SearchParamsData } from '@/types';
import { queryOptions } from '@tanstack/react-query';

export const notificationsQueryOptions = (queryParams?: SearchParamsData) =>
  queryOptions({
    queryKey: ['notifications', queryParams],
    queryFn: () => getUserNotificationsApi(queryParams),
    select: (res) => {
      return (Array.isArray(res.data) ? res.data : res) as Notification[];
    }
  });
