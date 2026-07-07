import { getInventoryAvailabilityApi } from '@/api/inventory';
import type { SearchParamsData } from '@/types';
import type { InventoryAvailability } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const inventoryAvailabilityQueryOptions = (queryParams: SearchParamsData = {}) =>
  queryOptions({
    queryKey: ['inventory', 'availability', queryParams],
    queryFn: () => getInventoryAvailabilityApi(queryParams),
    select: (res) => res.data as InventoryAvailability[]
  });
