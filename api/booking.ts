import { api } from '@/lib/api';
import type { CreateMutationPayload } from '@/types';

export async function createBookingApi(payload: CreateMutationPayload) {
  const { data } = await api.post('/bookings', payload.data);
  return data;
}

export async function getBookingsApi(queryParams: Record<string, any> = {}) {
  const params = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const url = params.toString() ? `/bookings?${params.toString()}` : '/bookings';
  const { data } = await api.get(url);
  return data;
}

