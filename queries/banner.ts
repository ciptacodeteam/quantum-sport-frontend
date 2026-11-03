import { getBannersApi } from '@/api/banner';
import type { Banner } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const bannersQueryOptions = () =>
  queryOptions({
    queryKey: ['banners'],
    queryFn: ({ signal }) => getBannersApi({}, signal),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30000,
    select: (res) => res.data as Banner[]
  });
