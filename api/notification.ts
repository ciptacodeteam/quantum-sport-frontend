import { api } from '@/lib/api';
import type { SearchParamsData } from '@/types';
import { mergedQueryParamUrl } from '@/lib/utils';

export async function getUserNotificationsApi(queryParams: SearchParamsData = {}) {
  const url = '/notifications';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await api.get(mergedUrl);
  return res.data;
}

export async function markNotificationReadApi(notificationId: string) {
  const { data } = await api.post(`/notifications/${notificationId}/read`);
  return data;
}
