import { expect, it } from 'vitest';
import { parseScheduleDatetime, formatScheduleSlotTime } from './admin-schedule-time';

it('treats Z, offset and unqualified API slots as the same Jakarta wall', () => {
  const values = [
    '2026-11-01T09:00:00.000Z',
    '2026-11-01T09:00:00+07:00',
    '2026-11-01 09:00:00',
    new Date('2026-11-01T09:00:00Z')
  ];
  const row = parseScheduleDatetime('2026-11-01 09:00:00');
  for (const value of values) {
    expect(formatScheduleSlotTime(value)).toBe('09:00');
    expect(parseScheduleDatetime(value).format('YYYY-MM-DD HH:mm')).toBe(
      row.format('YYYY-MM-DD HH:mm')
    );
  }
});

it('keeps opening time on the same calendar day without +7 shift', () => {
  const opening = '2026-11-01T06:00:00Z';
  expect(formatScheduleSlotTime(opening)).toBe('06:00');
  expect(formatScheduleSlotTime(opening, 'YYYY-MM-DD')).toBe('2026-11-01');
  expect(formatScheduleSlotTime('2026-11-01T00:00:00Z')).toBe('00:00');
  expect(formatScheduleSlotTime(null)).toBe('-');
});
