import { getInventoriesApi, getInventoryApi } from '@/api/admin/inventory';
import type { Inventory } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminInventoriesQueryOptions = queryOptions({
  queryKey: ['admin', 'inventories'],
  queryFn: getInventoriesApi,
  select: (res) => res.data as Inventory[]
});

export const adminInventoryQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'inventory', id],
    queryFn: () => getInventoryApi(id),
    select: (res) => res.data as Inventory
  });
