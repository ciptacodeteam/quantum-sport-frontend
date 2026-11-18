import { expect, it } from 'vitest';
import { managementCourtPricing, managementInHouseRate } from './management-pricing';
import type { BookingItem } from '@/stores/useBookingStore';
import type { TariffRule } from './tariff-period';
const session: BookingItem = {
  slotId: 'slot',
  courtId: 'court',
  courtName: 'Court 2',
  date: '2026-11-16',
  timeSlot: '18:00 - 19:00',
  endTime: '19:00',
  sport: 'PADEL',
  price: 300000
};
const customer = {
  isManagement: true,
  managementCourtHourlyPrice: 50000,
  managementCoachHourlyPrice: 500000,
  managementPadelHappyHourlyPrice: 100000,
  managementPadelPeakHourlyPrice: 150000,
  managementTennisHappyHourlyPrice: 80000,
  managementTennisPeakHourlyPrice: 120000
};
it.each([
  ['PADEL', '10:00 - 11:00', 100000],
  ['PADEL', '18:00 - 19:00', 150000],
  ['TENNIS', '10:00 - 11:00', 80000],
  ['TENNIS', '18:00 - 19:00', 120000]
] as const)(
  'quotes %s %s with the account court rate, independently of coaching',
  (sport, timeSlot, price) => {
    expect(managementCourtPricing([{ ...session, sport, timeSlot }], customer)).toEqual({
      courtPrices: { slot: price },
      coverage: 300000 - price
    });
    expect(managementInHouseRate(customer, session.date)).toEqual({ court: 50000, coach: 500000 });
  }
);
it.each([
  { ...customer, isManagement: false },
  { ...customer, managementValidFrom: '2026-11-17' },
  { ...customer, managementPadelPeakHourlyPrice: 0 },
  { isManagement: true, managementCourtHourlyPrice: 1 }
])('keeps normal court pricing for %j', (account) => {
  expect(managementCourtPricing([session], account)).toEqual({ courtPrices: {}, coverage: 0 });
});
it('ignores old end dates and keeps membership and in-house exclusions', () => {
  expect(
    managementCourtPricing([session], { ...customer, managementValidUntil: '2020-01-01' })
      .courtPrices.slot
  ).toBe(150000);
  expect(managementCourtPricing([session], customer, ['slot']).coverage).toBe(0);
  expect(managementCourtPricing([session], customer, [], true).coverage).toBe(0);
});
it('uses slot duration and keeps account prices isolated', () => {
  expect(
    managementCourtPricing([{ ...session, timeSlot: '18:00 - 20:00', endTime: '20:00' }], customer)
      .courtPrices.slot
  ).toBe(300000);
  expect(
    managementCourtPricing([{ ...session, timeSlot: '18:00 - 18:30', endTime: '18:30' }], customer)
      .courtPrices.slot
  ).toBe(75000);
  expect(
    managementCourtPricing([session], { ...customer, managementPadelPeakHourlyPrice: 50000 })
      .courtPrices.slot
  ).toBe(50000);
});
it('uses effective tariff hours and Happy Hour full-day rules, and treats the Peak boundary correctly', () => {
  const rule: TariffRule = {
    id: 'rule',
    branchId: 'cemara',
    sport: 'PADEL',
    effectiveFrom: '2026-11-01',
    happyStart: 6,
    happyEnd: 16,
    peakStart: 16,
    peakEnd: 24
  };
  expect(
    managementCourtPricing([{ ...session, timeSlot: '15:00 - 16:00' }], customer, [], false, [rule])
      .courtPrices.slot
  ).toBe(100000);
  expect(
    managementCourtPricing([{ ...session, timeSlot: '16:00 - 17:00' }], customer, [], false, [rule])
      .courtPrices.slot
  ).toBe(150000);
  expect(
    managementCourtPricing([session], customer, [], false, [{ ...rule, happyAllDayDays: [1] }])
      .courtPrices.slot
  ).toBe(100000);
  expect(
    managementCourtPricing([{ ...session, timeSlot: '15:00 - 16:00' }], customer, [], false, [
      { ...rule, effectiveFrom: '2026-12-01' }
    ]).courtPrices.slot
  ).toBe(150000);
});
