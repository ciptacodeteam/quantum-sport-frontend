import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/adminApi', () => ({ adminApi: { get: mocks.get } }));
import { coachingApi } from './coaching';
it('limits availability requests to 15 seconds and supports cancellation', async () => {
  const controller = new AbortController();
  mocks.get.mockResolvedValue({ data: { data: [] } });
  expect(
    await coachingApi.available(
      'detail',
      '2030-01-02 10:00:00',
      '2030-01-02 11:00:00',
      controller.signal
    )
  ).toEqual([]);
  expect(mocks.get).toHaveBeenCalledWith('/coaching/booking-details/detail/availability', {
    params: { startAt: '2030-01-02 10:00:00', endAt: '2030-01-02 11:00:00' },
    signal: controller.signal,
    timeout: 15000
  });
});
