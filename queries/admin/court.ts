import { getCourtApi, getCourtCostingApi, getCourtsApi } from '@/api/admin/court';
import type { Court, Slot } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminCourtsQueryOptions = queryOptions({
  queryKey: ['admin', 'courts'],
  queryFn: getCourtsApi,
  select: (res) => res.data as Court[]
});

export const adminCourtQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'courts', id],
    queryFn: () => getCourtApi(id),
    select: (res) => res.data as Court
  });

export const adminCourtCostingQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'courts', id, 'costing'],
    queryFn: () => getCourtCostingApi(id),
    select: (res) => res.data as { date: string; slots: Slot[] }[]
  });
