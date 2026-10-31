import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ courts: vi.fn(), slots: vi.fn() }));
vi.mock('@/api/admin/court', () => ({
  getCourtsApi: mocks.courts,
  getCourtsSlotsApi: mocks.slots,
  getCourtSlotsApi: vi.fn(),
  getCourtApi: vi.fn(),
  getCourtCostingApi: vi.fn()
}));
import { adminCourtsWithSlotsQueryOptions } from './court';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.courts.mockResolvedValue({
    data: [
      { id: 'padel', sport: 'PADEL' },
      { id: 'tennis', sport: 'TENNIS' }
    ]
  });
  mocks.slots.mockResolvedValue({
    data: [
      { id: 'booked', courtId: 'padel', isAvailable: false },
      { id: 'other-sport', courtId: 'tennis', isAvailable: true }
    ]
  });
});
it('requests unavailable slots for rescheduling and retains booked slots of the matching sport', async () => {
  const options = adminCourtsWithSlotsQueryOptions('2040-01-05', undefined, 'PADEL', true);
  if (typeof options.queryFn !== 'function') throw new Error('Missing query function');
  const result = await options.queryFn({} as never);
  expect(mocks.slots).toHaveBeenCalledWith(
    expect.objectContaining({ includeUnavailable: 'true', courtSport: 'PADEL' })
  );
  expect(result.slots).toEqual([{ id: 'booked', courtId: 'padel', isAvailable: false }]);
});
it('keeps available-only requests and cache entries separate for other consumers', async () => {
  const options = adminCourtsWithSlotsQueryOptions('2040-01-05', undefined, 'PADEL');
  if (typeof options.queryFn !== 'function') throw new Error('Missing query function');
  await options.queryFn({} as never);
  expect(mocks.slots.mock.calls[0][0]).not.toHaveProperty('includeUnavailable');
  expect(options.queryKey).not.toEqual(
    adminCourtsWithSlotsQueryOptions('2040-01-05', undefined, 'PADEL', true).queryKey
  );
});

it('requests the full day including the 23:00–24:00 slot', async () => {
  const options = adminCourtsWithSlotsQueryOptions('2040-01-05', undefined, 'PADEL');
  if (typeof options.queryFn !== 'function') throw new Error('Missing query function');
  await options.queryFn({} as never);
  const { startAt, endAt } = mocks.slots.mock.calls[0][0];
  expect(new Date(endAt).getTime() - new Date(startAt).getTime()).toBe(86_399_999);
});
