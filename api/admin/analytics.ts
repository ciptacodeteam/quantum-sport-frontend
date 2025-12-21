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

// New Analytics Endpoints

export const getIncomeBySourceApi = async (queryParams: SearchParamsData = {}) => {
  const url = '/analytics/income-by-source';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
};

export const getPaymentMethodsAnalyticsApi = async (queryParams: SearchParamsData = {}) => {
  const url = '/analytics/payment-methods';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
};

export const getBusinessInsightsApi = async (queryParams: SearchParamsData = {}) => {
  const url = '/analytics/business-insights';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
};

export const exportBulkDataApi = async (
  type: 'courts' | 'inventory' | 'coach-bookings',
  queryParams: SearchParamsData = {}
) => {
  const url = '/analytics/export/bulk-data';
  const mergedUrl = mergedQueryParamUrl(url, { ...queryParams, type });
  const res = await adminApi.get(mergedUrl, {
    responseType: 'blob'
  });
  return res.data;
};
