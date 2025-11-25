import { adminApi } from '@/lib/adminApi';

type ReschedulePayload = {
  courtSlotId: string;
};

export async function rescheduleBookedCourtApi(id: string, payload: ReschedulePayload) {
  const { data } = await adminApi.put(`/booked-courts/${id}/reschedule`, payload);
  return data;
}

