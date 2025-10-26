import { getBannerApi, getBannersApi } from '@/api/admin/banner';
import type { Banner } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminBannersQueryOptions = queryOptions({
  queryKey: ['admin', 'banners'],
  queryFn: getBannersApi,
  select: (res) => res.data as Banner[]
});

export const adminBannerQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'banners', id],
    queryFn: () => getBannerApi(id),
    select: (res) => res.data as Banner
  });
