import { api } from '@/lib/api';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { SearchParamsData } from '@/types';

export async function getInventoryAvailabilityApi(queryParams: SearchParamsData = {}) {
  const url = '/inventories/availability';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const { data } = await api.get(mergedUrl);
  return data;
}
