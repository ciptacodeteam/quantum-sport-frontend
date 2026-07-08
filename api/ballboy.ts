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
