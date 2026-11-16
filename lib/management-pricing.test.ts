import { expect, it } from 'vitest';
import { managementCourtPricing } from './management-pricing';
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
const rules: TariffRule[] = [
  {
    id: 'tariff',
    branchId: 'cemara',
    sport: 'PADEL',
    effectiveFrom: '2026-11-01',
    happyStart: 6,
    happyEnd: 15,
    peakStart: 15,
    peakEnd: 24,
    managementCourtHourlyPrice: 100000,
    managementCoachHourlyPrice: 0
  }
];
it('applies the management court rate without requiring a coach', () => {
  expect(managementCourtPricing([session], rules, { isManagement: true })).toEqual({
    courtPrices: { slot: 100000 },
    coverage: 200000
  });
});
it.each([
  { isManagement: false },
  { isManagement: true, managementValidUntil: '2026-11-15' },
  { isManagement: true, managementValidFrom: '2026-11-17' }
])('keeps normal pricing for an ineligible customer %j', (customer) => {
  expect(managementCourtPricing([session], rules, customer)).toEqual({
    courtPrices: {},
    coverage: 0
  });
});
it('keeps membership and in-house selections under their existing pricing policy', () => {
  expect(managementCourtPricing([session], rules, { isManagement: true }, ['slot']).coverage).toBe(
    0
  );
  expect(managementCourtPricing([session], rules, { isManagement: true }, [], true).coverage).toBe(
    0
  );
});
it('respects sport and tariff effective date and supports zero tariffs and multi-hour slots', () => {
  expect(
    managementCourtPricing([{ ...session, sport: 'TENNIS' }], rules, { isManagement: true })
      .courtPrices
  ).toEqual({});
  expect(
    managementCourtPricing([{ ...session, date: '2026-10-31' }], rules, { isManagement: true })
      .courtPrices
  ).toEqual({});
  expect(
    managementCourtPricing([session], [{ ...rules[0], managementCourtHourlyPrice: 0 }], {
      isManagement: true
    }).courtPrices.slot
  ).toBe(0);
  expect(
    managementCourtPricing([{ ...session, timeSlot: '18:00 - 20:00', endTime: '20:00' }], rules, {
      isManagement: true
    }).courtPrices.slot
  ).toBe(200000);
});
