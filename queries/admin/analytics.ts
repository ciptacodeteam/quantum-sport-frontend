import { getDashboardStatsApi, getDailyTransactionsApi } from '@/api/admin/analytics';
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
