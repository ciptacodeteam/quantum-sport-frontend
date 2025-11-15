import { adminApi } from '@/lib/adminApi';

type AdminCoachAvailabilityParams = {
  startAt: string;
  endAt: string;
};

export async function getAdminCoachAvailabilityApi(params: AdminCoachAvailabilityParams) {
  const { data } = await adminApi.get('/coach/availability', {
    params
  });

  return data;
}

