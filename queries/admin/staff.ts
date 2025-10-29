import { getStaffApi, getStaffsApi } from '@/api/admin/staff';
import type { Staff } from '@/types/model';
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
