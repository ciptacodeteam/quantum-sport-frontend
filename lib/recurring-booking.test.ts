import { describe, expect, it } from 'vitest';
import {
  recurringPreviewEnd,
  mergeBookingItems,
  previewRecurringBooking,
  recurringDates
} from './recurring-booking';
import type { BookingItem } from '@/stores/useBookingStore';
import type { Slot } from '@/types/model';

const template: BookingItem = {
  slotId: 'original',
  courtId: 'court',
  courtName: 'Court A',
  timeSlot: '19:00',
  endTime: '20:00',
  price: 100,
  date: '2026-11-03',
  sport: 'PADEL'
};
function slot(date: string, time = '19', overrides = {}): Slot {
  return {
    id: `${date}-${time}`,
    courtId: 'court',
    startAt: `${date} ${time}:00:00`,
    endAt: `${date} ${Number(time) + 1}:00:00`,
    price: 200,
    isAvailable: true,
    ...overrides
  } as unknown as Slot;
}
const now = new Date('2026-10-01T00:00:00Z').valueOf();

describe('recurring booking', () => {
  it('includes the end date and supports multiple weekdays across a year boundary', () => {
    expect(recurringDates('2026-12-29', '2027-01-05', [2, 4])).toEqual([
      '2026-12-29',
      '2026-12-31',
      '2027-01-05'
    ]);
  });
  it('expands six calendar months without dropping the last session', () => {
    const dates = recurringDates('2026-11-03', '2027-05-03', [2]);
    expect(dates).toHaveLength(26);
    expect(dates.at(-1)).toBe('2027-04-27');
  });
  it('rejects reversed or unbounded periods', () => {
    expect(() => recurringDates('2026-11-03', '2026-10-03', [2])).toThrow();
    expect(() => recurringDates('2026-11-03', '2030-10-03', [2])).toThrow();
    expect(recurringDates('2026-11-03', '2026-11-03', [])).toEqual([]);
  });
  it('uses actual slot IDs and prices, and flags booked or missing dates', () => {
    const sessions = previewRecurringBooking(
      [template],
      ['2026-11-03', '2026-11-10', '2026-11-17'],
      [
        slot('2026-11-03', '19', { discountPrice: 150 }),
        slot('2026-11-10', '19', { isAvailable: false })
      ],
      now
    );
    expect(sessions[0].items[0]).toMatchObject({
      slotId: '2026-11-03-19',
      price: 150,
      normalPrice: 200
    });
    expect(sessions[1].items).toEqual([]);
    expect(sessions[1].conflicts).toHaveLength(1);
    expect(sessions[2].conflicts).toHaveLength(1);
  });
  it('skips the entire session if one hour conflicts', () => {
    const second = { ...template, timeSlot: '20:00', endTime: '21:00' };
    const sessions = previewRecurringBooking(
      [template, second],
      ['2026-11-03'],
      [slot('2026-11-03')],
      now
    );
    expect(sessions[0].items).toEqual([]);
    expect(sessions[0].conflicts).toHaveLength(1);
  });
  it('rejects past slots and changed slot duration', () => {
    expect(
      previewRecurringBooking(
        [template],
        ['2026-11-03'],
        [slot('2026-11-03')],
        now + 366 * 86400000
      )[0].items
    ).toEqual([]);
    expect(
      previewRecurringBooking(
        [template],
        ['2026-11-03'],
        [slot('2026-11-03', '19', { endAt: '2026-11-03 19:30:00' })],
        now
      )[0].items
    ).toEqual([]);
  });
  it('does not duplicate slots already in the cart', () => {
    const incoming = { ...template, price: 250 };
    expect(mergeBookingItems([template], [incoming])).toEqual([incoming]);
  });
});

it('uses the selected court horizon for rolling and caps month previews without changing the requested duration', () => {
  expect(recurringPreviewEnd('2026-11-03', '2027-01-29', 'ROLLING', 6)).toBe('2027-01-29');
  expect(recurringPreviewEnd('2026-11-03', '2027-01-29', 'MONTHS', 6)).toBe('2027-01-29');
  expect(recurringPreviewEnd('2026-11-03', '2027-01-29', 'MONTHS', 1)).toBe('2026-12-03');
});
