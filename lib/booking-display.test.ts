import { expect, it } from 'vitest';
import {
  bookingScheduleInJakarta,
  formatBookingDate,
  formatBookingSlotDate
} from './booking-display';

it('shows true UTC instants in WIB for createdAt-style values', () => {
  expect(formatBookingDate('2026-10-27T02:00:00Z', 'DD MMM YYYY HH:mm')).toBe(
    '27 Okt 2026 09:00'
  );
  expect(formatBookingDate('2026-10-27 09:00:00', 'HH:mm')).toBe('09:00');
  expect(formatBookingDate('invalid', 'HH:mm')).toBe('-');
});

it('keeps wall-stored slot times without a +7 shift', () => {
  expect(formatBookingSlotDate('2026-11-01T19:00:00.000Z', 'HH:mm')).toBe('19:00');
  expect(formatBookingSlotDate('2026-11-01 19:00:00', 'HH:mm')).toBe('19:00');
  expect(formatBookingSlotDate(new Date('2026-11-01T19:00:00Z'), 'DD MMM YYYY')).toBe(
    '01 Nov 2026'
  );
  expect(formatBookingSlotDate('2026-10-31T19:00:00Z', 'DD MMM YYYY HH:mm')).toBe(
    '31 Okt 2026 19:00'
  );
});

it('merges consecutive wall slots into a complete range', () => {
  const slots = [9, 10].map((hour) => ({
    court: { id: 'court', name: 'Padel 1' },
    slot: {
      startAt: `2026-10-27T${String(hour).padStart(2, '0')}:00:00Z`,
      endAt: `2026-10-27T${String(hour + 1).padStart(2, '0')}:00:00Z`
    }
  }));
  expect(bookingScheduleInJakarta(slots)[0].courts[0].ranges).toMatchObject([
    { start: '2026-10-27 09:00', end: '2026-10-27 11:00' }
  ]);
});

it('keeps non-consecutive sessions separate and correctly shows the midnight close', () => {
  const ranges = bookingScheduleInJakarta(
    [9, 23].map((hour) => ({
      court: { id: 'court', name: 'Tennis 1' },
      slot: {
        startAt: `2026-10-27T${String(hour).padStart(2, '0')}:00:00Z`,
        endAt:
          hour === 23
            ? '2026-10-28T00:00:00Z'
            : `2026-10-27T${String(hour + 1).padStart(2, '0')}:00:00Z`
      }
    }))
  )[0].courts[0].ranges;
  expect(ranges).toHaveLength(2);
  expect(ranges[0]).toMatchObject({ start: '2026-10-27 09:00', end: '2026-10-27 10:00' });
  expect(ranges[1]).toMatchObject({ start: '2026-10-27 23:00', end: '2026-10-28 00:00' });
});
