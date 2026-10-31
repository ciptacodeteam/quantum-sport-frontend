import { expect, it } from 'vitest';
import { canRescheduleAt } from './reschedule-policy';

it('uses an exact 48-hour cutoff, not a calendar-day comparison', () => {
  const now = Date.parse('2026-10-28T15:00:00+07:00');
  expect(canRescheduleAt('2026-10-30T15:00:00+07:00', now)).toBe(true);
  expect(canRescheduleAt('2026-10-30T14:59:59+07:00', now)).toBe(false);
  expect(canRescheduleAt('2026-10-30T15:00:01+07:00', now)).toBe(true);
});
it('interprets timezone-free API times as WIB and refuses missing dates', () => {
  const now = Date.parse('2026-10-28T15:00:00+07:00');
  expect(canRescheduleAt('2026-10-30 15:00:00', now)).toBe(true);
  expect(canRescheduleAt(undefined, now)).toBe(false);
});
