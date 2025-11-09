import { getCoachCostingApi, getStaffApi, getStaffsApi } from '@/api/admin/staff';
import type { Staff, Slot } from '@/types/model';
import type { SearchParamsData } from '@/types';
import { queryOptions } from '@tanstack/react-query';

export const adminStaffsQueryOptions = queryOptions({
  queryKey: ['admin', 'staffs'],
  queryFn: getStaffsApi,
  select: (res) => res.data as Staff[]
});

export const adminStaffQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'staffs', id],
    queryFn: () => getStaffApi(id),
    select: (res) => res.data as Staff
  });

export const adminCoachCostingQueryOptions = (id: string, queryParams?: SearchParamsData) =>
  queryOptions({
    queryKey: ['admin', 'staffs', id, 'costing', queryParams],
    queryFn: () => getCoachCostingApi(id, queryParams),
    select: (res) => res.data as { date: string; slots: Slot[] }[]
  });
