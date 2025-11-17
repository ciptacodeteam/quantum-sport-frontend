import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { SearchParamsData } from '@/types';
import type { AdminNotification, CreateNotificationPayload } from '@/types/model';

export async function getAdminNotificationsApi(queryParams: SearchParamsData = {}) {
  const url = '/notifications';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function createAdminNotificationApi(payload: CreateNotificationPayload) {
  const { data } = await adminApi.post('/notifications', payload);
  return data;
}

export async function markAdminNotificationReadApi(notificationId: string) {
  const { data } = await adminApi.patch(`/notifications/${notificationId}/read`);
  return data;
}

export async function markAllNotificationsReadApi() {
  const { data } = await adminApi.post('/notifications/read-all');
  return data;
}
