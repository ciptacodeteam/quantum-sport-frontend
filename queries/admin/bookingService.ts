import dayjs from 'dayjs';
import { queryOptions } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import type { CoachAvailability, BallboyAvailability } from '@/types/model';

export type ServiceSession = { date: string; timeSlot: string; startAt?: string; endAt?: string };
export function serviceSessionRange(session: ServiceSession) {
  const [start, end] = session.timeSlot.split(' - ');
  const endDate =
    end <= start ? dayjs(session.date).add(1, 'day').format('YYYY-MM-DD') : session.date;
  // API timestamps use Jakarta wall-clock components, including legacy Z-suffixed values.
  const wall = (value: string) => value.slice(0, 19).replace(' ', 'T');
  return {
    startAt: wall(session.startAt ?? `${session.date}T${start}:00`),
    endAt: wall(session.endAt ?? `${endDate}T${end}:00`)
  };
}
export function coachAvailabilityOptions(
  branchId: string | null | undefined,
  session: ServiceSession,
  sport: 'PADEL' | 'TENNIS',
  enabled = true
) {
  const { startAt, endAt } = serviceSessionRange(session);
  return queryOptions({
    queryKey: ['admin', 'booking-coaches', branchId, startAt, endAt, sport],
    queryFn: async ({ signal }) =>
      (
        await adminApi.get('/coach/availability', {
          params: { startAt, endAt, courtSport: sport },
          signal,
          timeout: 15000
        })
      ).data.data as CoachAvailability[],
    enabled: enabled && !!branchId && branchId !== 'all',
    staleTime: 15000,
    gcTime: 5 * 60000,
    refetchInterval: enabled ? 30000 : false,
    refetchOnWindowFocus: true,
    retry: false
  });
}
export function ballboyAvailabilityOptions(
  branchId: string | null | undefined,
  session: ServiceSession,
  sport: 'PADEL' | 'TENNIS',
  enabled = true
) {
  const { startAt, endAt } = serviceSessionRange(session);
  return queryOptions({
    queryKey: ['admin', 'booking-ballboys', branchId, startAt, endAt, sport],
    queryFn: async ({ signal }) =>
      (
        await adminApi.get('/ballboy/availability', {
          params: { startAt, endAt, courtSport: sport },
          signal,
          timeout: 15000
        })
      ).data.data as BallboyAvailability[],
    enabled: enabled && !!branchId && branchId !== 'all',
    staleTime: 15000,
    gcTime: 5 * 60000,
    refetchInterval: enabled ? 30000 : false,
    refetchOnWindowFocus: true,
    retry: false
  });
}
