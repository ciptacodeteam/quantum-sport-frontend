import {
  getDashboardStatsApi,
  getDailyTransactionsApi,
  getIncomeBySourceApi,
  getPaymentMethodsAnalyticsApi,
  getBusinessInsightsApi
} from '@/api/admin/analytics';
import type { DailyTransactionsResponse, DashboardStats, TransactionPeriod } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const dashboardStatsQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'analytics', 'dashboard'],
    queryFn: getDashboardStatsApi,
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (res) => res.data as DashboardStats
  });

export const dailyTransactionsQueryOptions = (period?: TransactionPeriod) =>
  queryOptions({
    queryKey: ['admin', 'analytics', 'daily-transactions', period],
    queryFn: () => getDailyTransactionsApi({ period }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (res) => res.data as DailyTransactionsResponse
  });

export const incomeBySourceQueryOptions = (startDate?: string, endDate?: string) =>
  queryOptions({
    queryKey: ['admin', 'analytics', 'income-by-source', startDate, endDate],
    queryFn: () => getIncomeBySourceApi({ startDate, endDate }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (res) => res.data
  });

export const paymentMethodsAnalyticsQueryOptions = (startDate?: string, endDate?: string) =>
  queryOptions({
    queryKey: ['admin', 'analytics', 'payment-methods', startDate, endDate],
    queryFn: () => getPaymentMethodsAnalyticsApi({ startDate, endDate }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (res) => res.data
  });

export const businessInsightsQueryOptions = (startDate?: string, endDate?: string) =>
  queryOptions({
    queryKey: ['admin', 'analytics', 'business-insights', startDate, endDate],
    queryFn: () => getBusinessInsightsApi({ startDate, endDate }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (res) => res.data
  });
