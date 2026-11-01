import { expect, it } from 'vitest';
import { isCourtSlotBookable, isCourtWallSlotBookable } from './booking-time-policy';

it.each([
  ['2026-10-28T14:59:59+07:00', true],
  ['2026-10-28T15:00:00+07:00', true],
  ['2026-10-28T15:14:59.999+07:00', true],
  ['2026-10-28T15:15:00+07:00', false],
  ['2026-10-28T15:16:00+07:00', false],
  ['2026-10-29T15:00:00+07:00', false]
])('keeps the 15:00 slot bookable until 15:15 WIB at %s', (now, allowed) => {
  expect(isCourtSlotBookable(Date.parse('2026-10-28T15:00:00+07:00'), Date.parse(now))).toBe(
    allowed
  );
});

it.each([
  ['2026-11-01T13:00:00+07:00', true],
  ['2026-11-01T13:14:59.999+07:00', true],
  ['2026-11-01T13:15:00+07:00', false],
  ['2026-11-01T13:30:00+07:00', false]
])('interprets API wall timestamps using the same grace period at %s', (now, allowed) => {
  for (const value of [
    '2026-11-01T13:00:00Z',
    '2026-11-01 13:00:00',
    new Date('2026-11-01T13:00:00Z')
  ]) {
    expect(isCourtWallSlotBookable(value, Date.parse(now))).toBe(allowed);
  }
});

it('closes the last evening slot using Jakarta time even after UTC and calendar dates differ', () => {
  expect(
    isCourtWallSlotBookable('2026-10-31T23:00:00Z', Date.parse('2026-10-31T23:14:59+07:00'))
  ).toBe(true);
  expect(
    isCourtWallSlotBookable('2026-10-31T23:00:00Z', Date.parse('2026-11-01T00:00:00+07:00'))
  ).toBe(false);
});
