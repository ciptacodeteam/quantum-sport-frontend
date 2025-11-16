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

export type AdminCoachMyScheduleParams = {
  startAt?: string;
  endAt?: string;
};

export async function getMyCoachScheduleApi(params: AdminCoachMyScheduleParams = {}) {
  const { data } = await adminApi.get('/coach/me/schedule', {
    params
  });
  return data;
}

