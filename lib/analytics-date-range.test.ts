import { afterEach, expect, it } from 'vitest';
import { getAnalyticsDateRange } from './analytics-date-range';

const originalTZ = process.env.TZ;
afterEach(() => {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

it('serializes Jakarta local days as UTC instants without shifting the report end date', () => {
  process.env.TZ = 'Asia/Jakarta';
  const result = getAnalyticsDateRange({ from: new Date(2026, 8, 26), to: new Date(2026, 9, 26) });
  expect(result).toEqual({
    startDate: '2026-09-25T17:00:00.000Z',
    endDate: '2026-10-26T16:59:59.999Z'
  });
  expect(new Date(result.endDate!).getDate()).toBe(26);
});

it('includes the full final day across a daylight-saving change', () => {
  process.env.TZ = 'America/New_York';
  expect(getAnalyticsDateRange({ from: new Date(2026, 2, 8), to: new Date(2026, 2, 8) })).toEqual({
    startDate: '2026-03-08T05:00:00.000Z',
    endDate: '2026-03-09T03:59:59.999Z'
  });
});

it('supports an unset filter', () => {
  expect(getAnalyticsDateRange(undefined)).toEqual({ startDate: undefined, endDate: undefined });
});
