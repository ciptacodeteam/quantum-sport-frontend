import { api } from '@/lib/api';

type BallboyAvailabilityParams = {
  startAt: string;
  endAt: string;
  courtSport?: 'PADEL' | 'TENNIS';
};

export async function getBallboyAvailabilityApi(params: BallboyAvailabilityParams) {
  const { data } = await api.get('/ballboys/availability', {
    params
  });

  return data;
}

export type BallboySummary = { id: string; name: string };
export async function getBallboysApi(): Promise<BallboySummary[]> {
  const { data } = await api.get('/ballboys');
  return data.data;
}
