import { getInventoriesApi, getInventoryApi, getAdminInventoryAvailabilityApi } from '@/api/admin/inventory';
import type { Inventory, InventoryAvailability } from '@/types/model';
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

export const adminInventoryAvailabilityQueryOptions = (startAt?: string, endAt?: string) =>
  queryOptions({
    queryKey: ['admin', 'inventory', 'availability', startAt ?? 'all', endAt ?? 'all'],
    queryFn: () =>
      getAdminInventoryAvailabilityApi({
        ...(startAt ? { startAt } : {}),
        ...(endAt ? { endAt } : {})
      }),
    select: (res) => res.data as InventoryAvailability[]
  });
