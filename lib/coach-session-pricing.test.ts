import { expect, it } from 'vitest';
import { coachSessionsTotal, pricedCoaches } from './coach-session-pricing';
import type { SelectedCoach } from '@/stores/useBookingStore';
const coach = (hour: number, coachId = 'coach-a'): SelectedCoach => ({
  coachId,
  coachName: coachId,
  date: '2040-01-07',
  timeSlot: `${String(hour).padStart(2, '0')}:00 - ${String((hour + 1) % 24).padStart(2, '0')}:00`,
  price: 200000,
  additionalHourPrice: 100000
});
it.each([1, 2, 3, 4, 5])(
  'previews %i consecutive coach hours correctly regardless of selection order',
  (hours) => {
    const selected = Array.from({ length: hours }, (_, i) => coach(10 + i)).reverse();
    expect(coachSessionsTotal(selected)).toBe(200000 + (hours - 1) * 100000);
    expect(selected.every((item) => item.price === 200000)).toBe(true);
  }
);
it('recalculates the first hour after removal, gaps, coach changes and date changes', () => {
  expect(coachSessionsTotal([coach(10), coach(11), coach(12)])).toBe(400000);
  expect(coachSessionsTotal([coach(11), coach(12)])).toBe(300000);
  expect(coachSessionsTotal([coach(10), coach(12)])).toBe(400000);
  expect(coachSessionsTotal([coach(10), coach(11, 'coach-b')])).toBe(400000);
  expect(coachSessionsTotal([coach(10), { ...coach(11), date: '2040-01-08' }])).toBe(400000);
});
it('continues across midnight and allows flat or zero additional prices', () => {
  expect(coachSessionsTotal([coach(23), { ...coach(0), date: '2040-01-08' }])).toBe(300000);
  expect(coachSessionsTotal([coach(10), { ...coach(11), additionalHourPrice: null }])).toBe(400000);
  expect(coachSessionsTotal([coach(10), { ...coach(11), additionalHourPrice: 0 }])).toBe(200000);
  expect(pricedCoaches([coach(11), coach(10)]).map((c) => c.chargedPrice)).toEqual([
    100000, 200000
  ]);
});

it('adds the configured 50k for each extra club member and preserves consecutive hourly rates', () => {
  const club = { ...coach(10), coachingGroupId: 'club', price: 150000, additionalHourPrice: 50000 };
  expect(coachSessionsTotal([{ ...club, participants: 2 }])).toBe(200000);
  expect(coachSessionsTotal([{ ...club, participants: 3 }])).toBe(250000);
  expect(
    coachSessionsTotal([
      { ...club, participants: 2 },
      { ...club, timeSlot: '11:00 - 12:00', participants: 3 }
    ])
  ).toBe(350000);
  expect(coachSessionsTotal([{ ...club, participants: 2, additionalHourPrice: 0 }])).toBe(150000);
  expect(coachSessionsTotal([{ ...club, participants: 2, additionalHourPrice: null }])).toBe(
    300000
  );
  expect(coachSessionsTotal([{ ...club, coachingGroupId: undefined, participants: 2 }])).toBe(
    150000
  );
});
