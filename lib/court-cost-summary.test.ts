import { expect, it } from 'vitest';
import { summarizeCourtCostSchedule } from './court-cost-summary';

function slot(hour: number, overrides = {}) {
  return {
    startAt: `2026-12-01T${String(hour).padStart(2, '0')}:00:00.000Z`,
    endAt:
      hour === 23
        ? '2026-12-02T00:00:00.000Z'
        : `2026-12-01T${String(hour + 1).padStart(2, '0')}:00:00.000Z`,
    price: 150000,
    discountPrice: 0,
    scheduleClosed: false,
    isAvailable: true,
    ...overrides
  };
}

it('summarizes 06:00–24:00 operating hours and prices, excluding six closed legacy slots', () => {
  const slots = Array.from({ length: 24 }, (_, hour) =>
    slot(hour, {
      scheduleClosed: hour < 6,
      price: hour < 6 ? 999999 : hour < 15 ? 150000 : 300000
    })
  );
  expect(summarizeCourtCostSchedule(slots.reverse())).toEqual({
    hours: '06:00 - 24:00',
    minPrice: 150000,
    maxPrice: 300000
  });
});

it('retains booked and manually unavailable operating slots and their prices', () => {
  expect(
    summarizeCourtCostSchedule([slot(18), slot(19, { isAvailable: false, price: 300000 })])
  ).toEqual({ hours: '18:00 - 20:00', minPrice: 150000, maxPrice: 300000 });
});

it('applies valid discounts only to scheduled slots', () => {
  expect(
    summarizeCourtCostSchedule([
      slot(5, { scheduleClosed: true, price: 500000, discountPrice: 10000 }),
      slot(6, { price: 300000, discountPrice: 150000 }),
      slot(7, { price: 250000, discountPrice: 0 }),
      slot(8, { price: 200000, discountPrice: 300000 })
    ])
  ).toEqual({ hours: '06:00 - 09:00', minPrice: 150000, maxPrice: 250000 });
});

it('shows gaps when some hours are closed rather than implying continuous operation', () => {
  expect(
    summarizeCourtCostSchedule([slot(6), slot(7), slot(8, { scheduleClosed: true }), slot(9)]).hours
  ).toBe('06:00 - 08:00, 09:00 - 10:00');
});

it('handles empty and fully closed schedules without exposing stale prices', () => {
  for (const slots of [[], [slot(0, { scheduleClosed: true })]]) {
    expect(summarizeCourtCostSchedule(slots)).toEqual({
      hours: '-',
      minPrice: null,
      maxPrice: null
    });
  }
});

it('supports 24-hour schedules and missing legacy scheduleClosed flags', () => {
  expect(
    summarizeCourtCostSchedule(Array.from({ length: 24 }, (_, hour) => slot(hour))).hours
  ).toBe('00:00 - 24:00');
  expect(summarizeCourtCostSchedule([slot(6, { scheduleClosed: undefined })]).hours).toBe(
    '06:00 - 07:00'
  );
});

it('also supports Date objects and missing discounts without shifting their wall hours', () => {
  const item = slot(23);
  expect(
    summarizeCourtCostSchedule([
      {
        ...item,
        startAt: new Date(item.startAt),
        endAt: new Date(item.endAt),
        discountPrice: null
      }
    ])
  ).toEqual({ hours: '23:00 - 24:00', minPrice: 150000, maxPrice: 150000 });
});
