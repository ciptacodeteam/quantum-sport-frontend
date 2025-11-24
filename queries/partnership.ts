import { getPartnershipsApi } from '@/api/partnership';
import { queryOptions } from '@tanstack/react-query';

export const partnershipsQueryOptions = () =>
  queryOptions({
    queryKey: ['partnerships'],
    queryFn: getPartnershipsApi,
    select: (res) => res.data as string[]
  });
