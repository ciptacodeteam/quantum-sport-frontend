import { adminApi } from '@/lib/adminApi';

type AdminBallboyAvailabilityParams = {
  startAt: string;
  endAt: string;
  courtSport?: 'PADEL' | 'TENNIS';
};

export async function getAdminBallboyAvailabilityApi(params: AdminBallboyAvailabilityParams) {
  const { data } = await adminApi.get('/ballboy/availability', {
    params
  });

  return data;
}
