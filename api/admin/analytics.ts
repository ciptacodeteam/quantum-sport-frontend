import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { SearchParamsData } from '@/types';

export const getDashboardStatsApi = async () => {
  const { data } = await adminApi.get('/analytics/dashboard');
  return data;
};

export const getDailyTransactionsApi = async (queryParams: SearchParamsData = {}) => {
  const url = '/analytics/daily-transactions';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
};
