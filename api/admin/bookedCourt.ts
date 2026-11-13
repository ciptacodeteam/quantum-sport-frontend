import { adminApi } from '@/lib/adminApi';

export async function rescheduleBookedCourtApi(
  id: string,
  slotId: string,
  options: { expectedDifference?: number; paymentMethodId?: string } = {}
) {
  const { data } = await adminApi.put(`/booked-courts/${id}/reschedule`, {
    newSlotId: slotId,
    ...options
  });
  return data;
}

export type AdminCourtChangeOption = { slotId: string; courtId: string; courtName: string };
export async function getAdminCourtChangeOptionsApi(
  id: string,
  signal?: AbortSignal
): Promise<AdminCourtChangeOption[]> {
  const { data } = await adminApi.get(
    `/booked-courts/${encodeURIComponent(id)}/change-court-options`,
    { signal, timeout: 15000 }
  );
  return data.data;
}
export async function changeAdminCourtApi(id: string, sourceSlotId: string, newSlotId: string) {
  const { data } = await adminApi.put(`/booked-courts/${encodeURIComponent(id)}/change-court`, {
    sourceSlotId,
    newSlotId
  });
  return data.data;
}

export type RescheduleCourtQuote = {
  priceDifference: number;
  courtDifference: number;
  serviceDifference: number;
  previousCourtPrice: number;
  targetCourtPrice: number;
  retainedCourtPrice: number;
};
export async function getRescheduleCourtQuoteApi(
  id: string,
  slotId: string
): Promise<RescheduleCourtQuote> {
  const { data } = await adminApi.put(`/booked-courts/${id}/reschedule`, {
    newSlotId: slotId,
    preview: true
  });
  return data.data;
}
