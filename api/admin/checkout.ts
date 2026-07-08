import { adminApi } from '@/lib/adminApi';

export type AdminCheckoutPayload = {
  userId?: string;
  name?: string;
  phone?: string;
  totalHours: number;
  courtSlots?: string[];
  coachSlots?: string[];
  ballboySlots?: string[];
  inventories?: { inventoryId: string; quantity: number }[];
  coachDescription?: string;
  adminNote?: string;
  useMembership?: boolean;
};

export async function adminCheckoutApi(payload: AdminCheckoutPayload) {
  const { data } = await adminApi.post('/checkout', payload);
  return data;
}
