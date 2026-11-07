import { api } from '@/lib/api';

export type MyCourtBooking = {
  detailId: string;
  slotId: string;
  courtId: string;
  courtName: string;
  startAt: string;
  endAt: string;
};
export type CourtChangeOption = { slotId: string; courtId: string; courtName: string };

export async function getMyCourtScheduleApi(
  date: string,
  courtSport: 'TENNIS' | 'PADEL'
): Promise<MyCourtBooking[]> {
  const { data } = await api.get('/courts/my-schedule', { params: { date, courtSport } });
  return data.data;
}
export async function getCourtChangeOptionsApi(detailId: string): Promise<CourtChangeOption[]> {
  const { data } = await api.get(`/courts/my-schedule/${encodeURIComponent(detailId)}/courts`);
  return data.data;
}
export async function changeCourtApi(detailId: string, sourceSlotId: string, newSlotId: string) {
  const { data } = await api.put(`/courts/my-schedule/${encodeURIComponent(detailId)}/court`, {
    sourceSlotId,
    newSlotId
  });
  return data.data;
}
