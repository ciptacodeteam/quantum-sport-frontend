import { getInventoryAvailabilityApi } from '@/api/inventory';
import type { InventoryAvailability } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const inventoryAvailabilityQueryOptions = queryOptions({
  queryKey: ['inventory', 'availability'],
  queryFn: getInventoryAvailabilityApi,
  select: (res) => res.data as InventoryAvailability[]
});

