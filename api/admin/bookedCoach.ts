import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { SearchParamsData } from '@/types';

export async function getBookedCoachesApi(queryParams: SearchParamsData = {}) {
  const url = '/booked-coaches';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getBookedCoachApi(id: string) {
  const { data } = await adminApi.get(`/booked-coaches/${id}`);
  return data;
}

export async function cancelBookedCoachApi(id: string, reason?: string) {
  const { data } = await adminApi.put(`/booked-coaches/${id}/cancel`, { reason });
  return data;
}
