import { expect, it } from 'vitest';
import { currentAdminBookingDate } from './admin-booking-date';

const now = new Date('2026-10-31T18:00:00Z'); // November 1, 01:00 WIB
it('replaces yesterday with November 1 even when the current UTC date is October 31', () => {
  const selected = currentAdminBookingDate(new Date(2026, 9, 31), now);
  expect([selected.getFullYear(), selected.getMonth(), selected.getDate()]).toEqual([2026, 10, 1]);
});
it('keeps today and future calendar selections', () => {
  for (const day of [1, 2, 15]) {
    const selected = new Date(2026, 10, day);
    expect(currentAdminBookingDate(selected, now)).toBe(selected);
  }
});
it('restores serialized dates and falls back to today for invalid saved dates', () => {
  expect(currentAdminBookingDate(new Date(2026, 10, 2).toISOString(), now)).toEqual(
    new Date(2026, 10, 2)
  );
  for (const saved of [null, undefined, 'invalid-date', new Date(NaN)]) {
    expect(currentAdminBookingDate(saved, now)).toEqual(new Date(2026, 10, 1));
  }
});
it('advances at Jakarta midnight, including the year boundary', () => {
  const saved = new Date(2026, 11, 31);
  expect(currentAdminBookingDate(saved, new Date('2026-12-31T16:59:59Z'))).toBe(saved);
  expect(currentAdminBookingDate(saved, new Date('2026-12-31T17:00:00Z'))).toEqual(
    new Date(2027, 0, 1)
  );
});
