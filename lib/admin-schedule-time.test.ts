import { expect, it } from 'vitest';
import { parseScheduleDatetime, formatScheduleSlotTime } from './admin-schedule-time';

it('places UTC, offset and local API slots in the same WIB row', () => {
  const values = [
    '2026-11-01T02:00:00.000Z',
    '2026-11-01T09:00:00+07:00',
    '2026-11-01 09:00:00',
    new Date('2026-11-01T02:00:00Z')
  ];
  const row = parseScheduleDatetime('2026-11-01 09:00:00');
  for (const value of values) {
    expect(formatScheduleSlotTime(value)).toBe('09:00');
    expect(parseScheduleDatetime(value).isSame(row)).toBe(true);
  }
});

it('keeps opening time and the booking date correct across UTC midnight', () => {
  const opening = '2026-10-31T23:00:00Z';
  expect(formatScheduleSlotTime(opening)).toBe('06:00');
  expect(formatScheduleSlotTime(opening, 'YYYY-MM-DD')).toBe('2026-11-01');
  expect(formatScheduleSlotTime('2026-11-01T17:00:00Z')).toBe('00:00');
  expect(formatScheduleSlotTime(null)).toBe('-');
});
