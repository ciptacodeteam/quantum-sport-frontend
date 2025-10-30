import { getClassApi, getClassesApi } from '@/api/admin/class';
import type { Class } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminClassesQueryOptions = queryOptions({
  queryKey: ['admin', 'classes'],
  queryFn: getClassesApi,
  select: (res) => res.data as Class[]
});

export const adminClassQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'classes', id],
    queryFn: () => getClassApi(id),
    select: (res) => res.data as Class
  });
