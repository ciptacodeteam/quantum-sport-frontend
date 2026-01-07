import { api } from '@/lib/api';

export async function getInventoryAvailabilityApi() {
  const { data } = await api.get('/inventories/availability');
  return data;
}
