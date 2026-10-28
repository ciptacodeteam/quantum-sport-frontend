import { expect, it } from 'vitest';
import { countConcurrentSessions, getEquipmentDayRange } from './addon-equipment';

it('reuses the same equipment across consecutive booking sessions', () => {
  expect(
    countConcurrentSessions([
      { start: 19, end: 20 },
      { start: 20, end: 21 },
      { start: 21, end: 22 }
    ])
  ).toBe(1);
});
it('counts overlapping courts so the shared quantity cannot exceed stock', () => {
  const concurrent = countConcurrentSessions([
    { start: 19, end: 21 },
    { start: 20, end: 22 },
    { start: 20, end: 21 }
  ]);
  expect(concurrent).toBe(3);
  expect(Math.floor(10 / concurrent)).toBe(3);
});
it('uses peak overlap instead of adding every session together', () => {
  expect(
    countConcurrentSessions([
      { start: 20, end: 21 },
      { start: 10, end: 12 },
      { start: 11, end: 13 }
    ])
  ).toBe(2);
});

it('reserves the selected Jakarta date across a month boundary without a time choice', () => {
  expect(getEquipmentDayRange('2026-10-31')).toEqual({
    startAt: '2026-10-30T17:00:00.000Z',
    endAt: '2026-10-31T17:00:00.000Z'
  });
});
