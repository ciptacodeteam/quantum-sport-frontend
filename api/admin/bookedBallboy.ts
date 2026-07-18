import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { SearchParamsData } from '@/types';

export async function getBookedBallboysApi(queryParams: SearchParamsData = {}) {
  const url = '/booked-ballboys';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getBookedBallboyApi(id: string) {
  const { data } = await adminApi.get(`/booked-ballboys/${id}`);
  return data;
}

export async function cancelBookedBallboyApi(id: string, reason?: string) {
  const { data } = await adminApi.put(`/booked-ballboys/${id}/cancel`, { reason });
  return data;
}
