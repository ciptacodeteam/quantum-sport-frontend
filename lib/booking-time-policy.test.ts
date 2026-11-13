import { expect, it } from 'vitest';
import {
  isCourtSlotBookable,
  isCourtWallSlotBookable,
  isScheduleSlotVisible,
  isScheduleWallSlotVisible
} from './booking-time-policy';

it.each([
  ['2026-10-28T14:59:59+07:00', true],
  ['2026-10-28T15:00:00+07:00', true],
  ['2026-10-28T15:14:59.999+07:00', true],
  ['2026-10-28T15:15:00+07:00', true],
  ['2026-10-28T15:22:00+07:00', true],
  ['2026-10-28T15:29:59.999+07:00', true],
  ['2026-10-28T15:30:00+07:00', false],
  ['2026-10-28T15:31:00+07:00', false],
  ['2026-10-29T15:00:00+07:00', false]
])('keeps the 15:00 slot bookable until 15:30 WIB at %s', (now, allowed) => {
  expect(isCourtSlotBookable(Date.parse('2026-10-28T15:00:00+07:00'), Date.parse(now))).toBe(
    allowed
  );
});

it.each([
  ['2026-11-01T13:00:00+07:00', true],
  ['2026-11-01T13:14:59.999+07:00', true],
  ['2026-11-01T13:15:00+07:00', true],
  ['2026-11-01T13:22:00+07:00', true],
  ['2026-11-01T13:29:59.999+07:00', true],
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

it.each([
  ['2026-11-01T12:59:59+07:00', true],
  ['2026-11-01T13:00:00+07:00', true],
  ['2026-11-01T13:15:00+07:00', true],
  ['2026-11-01T13:29:59.999+07:00', true],
  ['2026-11-01T13:30:00+07:00', false],
  ['2026-11-01T13:31:00+07:00', false],
  ['2026-11-02T00:00:00+07:00', false]
])('hides user schedule rows exactly 30 minutes after start at %s', (now, visible) => {
  const clock = Date.parse(now);
  expect(isScheduleSlotVisible(Date.parse('2026-11-01T13:00:00+07:00'), clock)).toBe(visible);
  for (const start of [
    '2026-11-01 13:00:00',
    '2026-11-01T13:00:00Z',
    new Date('2026-11-01T13:00:00Z')
  ]) {
    expect(isScheduleWallSlotVisible(start, clock)).toBe(visible);
  }
});
it('keeps tomorrow visible and hides yesterday across Jakarta midnight', () => {
  const now = Date.parse('2026-11-02T00:00:00+07:00');
  expect(isScheduleWallSlotVisible('2026-11-01 23:00:00', now)).toBe(false);
  expect(isScheduleWallSlotVisible('2026-11-02 00:00:00', now)).toBe(true);
  expect(isScheduleWallSlotVisible('2026-11-03 06:00:00', now)).toBe(true);
});
