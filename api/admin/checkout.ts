import type { RecurringBookingRule } from '@/lib/recurring-booking';
import { adminApi } from '@/lib/adminApi';

export type AdminCheckoutPayload = {
  recurringBooking?: RecurringBookingRule;
  userId?: string;
  name?: string;
  phone?: string;
  totalHours: number;
  courtSlots?: string[];
  coachSlots?: string[];
  ballboySlots?: Array<string | { slotId: string; courtSlotId: string }>;
  inventories?: {
    inventoryId: string;
    quantity: number;
    courtSlotId?: string;
    startAt?: string;
    endAt?: string;
    courtSport?: 'PADEL' | 'TENNIS';
  }[];
  coachDescription?: string;
  adminNote?: string;
  useMembership?: boolean;
};

export async function adminCheckoutApi(payload: AdminCheckoutPayload) {
  const { data } = await adminApi.post('/checkout', payload);
  return data;
}
