import { api } from '@/lib/api';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { SearchParamsData } from '@/types';

export async function getBannersApi(queryParams: SearchParamsData = {}) {
  const url = '/banners';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await api.get(mergedUrl);
  return res.data;
}

export async function getBannerApi(id: string) {
  const { data } = await api.get(`/banners/${id}`);
  return data;
}

