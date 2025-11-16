import { adminApi } from '@/lib/adminApi';

export type AdminCheckoutPayload = {
  userId: string;
  courtSlots?: string[];
  coachSlots?: string[];
  ballboySlots?: string[];
  inventories?: { inventoryId: string; quantity: number }[];
};

export async function adminCheckoutApi(payload: AdminCheckoutPayload) {
  const { data } = await adminApi.post('/checkout', payload);
  return data;
}


