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

it('exempts only super admin from the original deadline, including past source bookings', () => {
  const now = Date.parse('2026-11-10T18:00:00+07:00');
  for (const role of ['CASHIER', 'ADMIN', undefined])
    expect(canRescheduleAt('2026-11-10 17:00:00', now, role)).toBe(false);
  expect(canRescheduleAt('2026-11-10 17:00:00', now, 'SUPER_ADMIN')).toBe(true);
  expect(canRescheduleAt(undefined, now, 'SUPER_ADMIN')).toBe(false);
  expect(canRescheduleAt('invalid', now, 'SUPER_ADMIN')).toBe(false);
});
