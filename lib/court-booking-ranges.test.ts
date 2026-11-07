import { expect, it } from 'vitest';
import { groupCourtBookingRanges } from './court-booking-ranges';
import type { BookingItem } from '@/stores/useBookingStore';
const slot = (hour: number, courtId = 'court-1', date = '2040-01-02'): BookingItem => ({
  slotId: `${date}-${courtId}-${hour}`,
  courtId,
  courtName: courtId,
  date,
  timeSlot: `${String(hour).padStart(2, '0')}:00 - ${String((hour + 1) % 24).padStart(2, '0')}:00`,
  endTime: `${String((hour + 1) % 24).padStart(2, '0')}:00`,
  price: 100000
});
it('combines consecutive slots in order without changing source items', () => {
  const items = [slot(8), slot(6), slot(7)];
  const groups = groupCourtBookingRanges(items);
  expect(groups).toHaveLength(1);
  expect(groups[0]).toMatchObject({ startTime: '06:00', endTime: '09:00' });
  expect(groups[0].items.map((item) => item.slotId)).toEqual([
    slot(6).slotId,
    slot(7).slotId,
    slot(8).slotId
  ]);
  expect(items.map((item) => item.timeSlot)).toEqual([
    slot(8).timeSlot,
    slot(6).timeSlot,
    slot(7).timeSlot
  ]);
});
it('keeps gaps, different courts and different dates separate', () => {
  const groups = groupCourtBookingRanges([
    slot(6),
    slot(8),
    slot(7, 'court-2'),
    slot(7, 'court-1', '2040-01-03')
  ]);
  expect(groups).toHaveLength(4);
});
it('handles midnight endings and wall timestamps without a timezone shift', () => {
  const groups = groupCourtBookingRanges([
    slot(23),
    { ...slot(22), startAt: '2040-01-02T22:00:00Z', endAt: '2040-01-02T23:00:00Z' }
  ]);
  expect(groups).toHaveLength(1);
  expect(groups[0]).toMatchObject({ startTime: '22:00', endTime: '00:00' });
  expect(groups[0].endAt - groups[0].startAt).toBe(2 * 3600000);
});
