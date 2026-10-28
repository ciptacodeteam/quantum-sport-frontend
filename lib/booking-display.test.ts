import { expect, it } from 'vitest';
import { bookingScheduleInJakarta, formatBookingDate } from './booking-display';

it('shows UTC instants in WIB and leaves timezone-free club times unchanged', () => {
  expect(formatBookingDate('2026-10-27T02:00:00Z', 'DD MMM YYYY HH:mm')).toBe('27 Okt 2026 09:00');
  expect(formatBookingDate('2026-10-27 09:00:00', 'HH:mm')).toBe('09:00');
  expect(formatBookingDate('invalid', 'HH:mm')).toBe('-');
});
it('merges consecutive slots into a complete range', () => {
  const slots = [3, 2].map((hour) => ({
    court: { id: 'court', name: 'Padel 1' },
    slot: { startAt: `2026-10-27T0${hour}:00:00Z`, endAt: `2026-10-27T0${hour + 1}:00:00Z` }
  }));
  expect(bookingScheduleInJakarta(slots)[0].courts[0].ranges).toMatchObject([
    { start: '2026-10-27 09:00', end: '2026-10-27 11:00' }
  ]);
});
it('keeps non-consecutive sessions separate and correctly shows the midnight close', () => {
  const ranges = bookingScheduleInJakarta(
    [2, 16].map((hour) => ({
      court: { id: 'court', name: 'Tennis 1' },
      slot: {
        startAt: `2026-10-27T${String(hour).padStart(2, '0')}:00:00Z`,
        endAt: `2026-10-27T${String(hour + 1).padStart(2, '0')}:00:00Z`
      }
    }))
  )[0].courts[0].ranges;
  expect(ranges).toHaveLength(2);
  expect(ranges[1]).toMatchObject({ start: '2026-10-27 23:00', end: '2026-10-28 00:00' });
});
