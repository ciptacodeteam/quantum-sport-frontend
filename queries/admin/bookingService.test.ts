import { QueryClient } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import {
  coachAvailabilityOptions,
  ballboyAvailabilityOptions,
  serviceSessionRange
} from './bookingService';
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/adminApi', () => ({ adminApi: { get: mocks.get } }));
const session = { date: '2040-11-03', timeSlot: '23:00 - 00:00' };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockResolvedValue({ data: { data: [] } });
});
it('shares one coach request across courts, packages and legacy wall timestamp formats', async () => {
  const client = new QueryClient();
  const first = coachAvailabilityOptions('cemara', session, 'PADEL');
  const sameHour = coachAvailabilityOptions(
    'cemara',
    { ...session, startAt: '2040-11-03 23:00:00', endAt: '2040-11-04T00:00:00Z' },
    'PADEL'
  );
  await Promise.all([client.fetchQuery(first), client.fetchQuery(sameHour)]);
  await client.fetchQuery(first);
  expect(mocks.get).toHaveBeenCalledTimes(1);
  expect(mocks.get).toHaveBeenCalledWith(
    '/coach/availability',
    expect.objectContaining({
      params: { startAt: '2040-11-03T23:00:00', endAt: '2040-11-04T00:00:00', courtSport: 'PADEL' },
      signal: expect.any(AbortSignal)
    })
  );
  client.clear();
});
it('isolates coach and ballboy availability by branch and sport', async () => {
  const client = new QueryClient();
  await Promise.all([
    client.fetchQuery(coachAvailabilityOptions('cemara', session, 'PADEL')),
    client.fetchQuery(coachAvailabilityOptions('other', session, 'PADEL')),
    client.fetchQuery(coachAvailabilityOptions('cemara', session, 'TENNIS')),
    client.fetchQuery(ballboyAvailabilityOptions('cemara', session, 'PADEL'))
  ]);
  expect(mocks.get).toHaveBeenCalledTimes(4);
  client.clear();
});
it('preserves Jakarta midnight rollover without converting legacy Z wall values', () => {
  expect(serviceSessionRange({ ...session, startAt: '2040-11-03T23:00:00Z' })).toEqual({
    startAt: '2040-11-03T23:00:00',
    endAt: '2040-11-04T00:00:00'
  });
});
