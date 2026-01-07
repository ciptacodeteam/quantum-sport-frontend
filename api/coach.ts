import { api } from '@/lib/api';

type CoachAvailabilityParams = {
  startAt: string;
  endAt: string;
};

export async function getCoachAvailabilityApi(params: CoachAvailabilityParams) {
  const { data } = await api.get('/coaches/availability', {
    params
  });

  return data;
}
