import { expect, it } from 'vitest';
import { isCourtSlotBookable } from './booking-time-policy';

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
