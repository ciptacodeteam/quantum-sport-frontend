import { expect, it } from 'vitest';
import { managementCourtPricing, managementInHouseRate } from './management-pricing';
import type { BookingItem } from '@/stores/useBookingStore';
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
  managementCourtHourlyPrice: 100000,
  managementCoachHourlyPrice: 0
};
it('uses the account court price for every court and sport without requiring a coach or global tariff', () => {
  for (const sport of ['PADEL', 'TENNIS'] as const) {
    expect(managementCourtPricing([{ ...session, sport }], customer)).toEqual({
      courtPrices: { slot: 100000 },
      coverage: 200000
    });
  }
});
it.each([
  { ...customer, isManagement: false },
  { ...customer, managementValidUntil: '2026-11-15' },
  { ...customer, managementValidFrom: '2026-11-17' },
  { ...customer, managementCourtHourlyPrice: 0 }
])('keeps normal court pricing for %j', (account) => {
  expect(managementCourtPricing([session], account)).toEqual({ courtPrices: {}, coverage: 0 });
});
it('keeps membership and in-house selections under their existing pricing policy', () => {
  expect(managementCourtPricing([session], customer, ['slot']).coverage).toBe(0);
  expect(managementCourtPricing([session], customer, [], true).coverage).toBe(0);
});
it('uses slot duration and keeps account prices isolated', () => {
  expect(
    managementCourtPricing([{ ...session, timeSlot: '18:00 - 20:00', endTime: '20:00' }], customer)
      .courtPrices.slot
  ).toBe(200000);
  expect(
    managementCourtPricing([session], { ...customer, managementCourtHourlyPrice: 50000 })
      .courtPrices.slot
  ).toBe(50000);
  expect(managementInHouseRate(customer, session.date)).toEqual({ court: 100000, coach: null });
  expect(
    managementInHouseRate(
      { ...customer, managementCourtHourlyPrice: 0, managementCoachHourlyPrice: 50000 },
      session.date
    )
  ).toEqual({ court: null, coach: 50000 });
});
