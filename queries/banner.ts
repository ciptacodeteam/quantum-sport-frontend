import { getBannersApi } from '@/api/banner';
import type { Banner } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const bannersQueryOptions = () =>
  queryOptions({
    queryKey: ['banners'],
    queryFn: getBannersApi,
    select: (res) => res.data as Banner[]
  });

