import { api } from '@/lib/api';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { SearchParamsData } from '@/types';

export async function getBannersApi(queryParams: SearchParamsData = {}, signal?: AbortSignal) {
  const url = '/banners';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await api.get(mergedUrl, { signal, timeout: 30000 });
  return res.data;
}

export async function getBannerApi(id: string) {
  const { data } = await api.get(`/banners/${id}`);
  return data;
}
