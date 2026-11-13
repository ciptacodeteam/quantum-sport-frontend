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

it('exempts only super admin from the original deadline, until 30 minutes after the source booking starts', () => {
  const now = Date.parse('2026-11-10T18:00:00+07:00');
  for (const role of ['CASHIER', 'ADMIN', undefined])
    expect(canRescheduleAt('2026-11-10 17:00:00', now, role)).toBe(false);
  expect(canRescheduleAt('2026-11-10 17:00:00', now, 'SUPER_ADMIN')).toBe(false);
  expect(canRescheduleAt(undefined, now, 'SUPER_ADMIN')).toBe(false);
  expect(canRescheduleAt('invalid', now, 'SUPER_ADMIN')).toBe(false);
});

it('closes super-admin rescheduling exactly 30 minutes after the start in WIB', () => {
  const cutoff = Date.parse('2026-11-10T17:30:00+07:00');
  for (const start of ['2026-11-10 17:00:00', '2026-11-10T17:00:00Z', new Date('2026-11-10T17:00:00Z')]) {
    expect(canRescheduleAt(start, cutoff - 1, 'SUPER_ADMIN')).toBe(true);
    expect(canRescheduleAt(start, cutoff, 'SUPER_ADMIN')).toBe(false);
    expect(canRescheduleAt(start, cutoff + 1, 'SUPER_ADMIN')).toBe(false);
  }
});

it.each(['CASHIER', 'ADMIN', undefined])('uses WIB for the H-2 cutoff for %s across API date formats', (role) => {
  for (const wall of ['2026-10-30T15:00:00', '2026-11-01T00:10:00']) {
    const cutoff = Date.parse(`${wall}+07:00`) - 48 * 3_600_000;
    for (const start of [wall.replace('T', ' '), `${wall}Z`, `${wall}+07:00`, new Date(`${wall}Z`)]) {
      expect(canRescheduleAt(start, cutoff - 1, role)).toBe(true);
      expect(canRescheduleAt(start, cutoff, role)).toBe(true);
      expect(canRescheduleAt(start, cutoff + 1, role)).toBe(false);
      expect(canRescheduleAt(start, cutoff + 7 * 3_600_000, role)).toBe(false);
    }
  }
});
