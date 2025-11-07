import { api } from '@/lib/api';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { SearchParamsData } from '@/types';

export async function getMembershipsApi(queryParams: SearchParamsData = {}) {
  const url = '/memberships';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await api.get(mergedUrl);
  return res.data;
}

export async function getMembershipApi(id: string) {
  const { data } = await api.get(`/memberships/${id}`);
  return data;
}

