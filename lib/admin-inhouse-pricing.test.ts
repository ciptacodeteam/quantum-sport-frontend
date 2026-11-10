import { expect, it } from 'vitest';
import { adminInHousePricing } from './admin-inhouse-pricing';
import type { InHousePlan, InHouseWallet, InHouseChoice } from '@/api/admin/inhouseCoaching';
import type { BookingItem } from '@/stores/useBookingStore';
const plan = {
  id: 'single',
  hourlyPrice: 1000000,
  courtHourlyShare: 250000,
  extraParticipantHourlyPrice: 100000
} as InHousePlan;
const wallet = { ...plan, id: 'wallet', hourlyPrice: 900000 } as unknown as InHouseWallet;
const courts = [300000, 300000].map((price, index) => ({
  slotId: `court-${index}`,
  price
})) as BookingItem[];
const direct = (participants = 1): InHouseChoice[] =>
  courts.map((court) => ({
    planId: 'single',
    courtSlotId: court.slotId,
    coachSlotId: `coach-${court.slotId}`,
    participants
  }));
it.each([1, 3])(
  'multiplies the single-hour tariff and extra participants by two hours for %s participants',
  (participants) => {
    const result = adminInHousePricing(courts, direct(participants), [plan], []);
    expect(result).toEqual({
      coverage: 600000,
      singleTotal: 2000000,
      extras: (participants - 1) * 200000
    });
    expect(600000 - result.coverage + result.singleTotal + result.extras).toBe(
      2000000 + (participants - 1) * 200000
    );
  }
);
it('charges only extra participants when two hours come from an existing prepaid package', () => {
  const choices = direct(3).map(({ planId: _, ...choice }) => ({ ...choice, walletId: 'wallet' }));
  expect(adminInHousePricing(courts, choices, [], [wallet])).toEqual({
    coverage: 600000,
    singleTotal: 0,
    extras: 400000
  });
});
it('replaces only coached court hours and uses the actual discounted court price', () => {
  const discounted = [{ ...courts[0], discountPrice: 150000 }, courts[1]];
  const result = adminInHousePricing(discounted, direct().slice(0, 1), [plan], []);
  expect(result.coverage).toBe(150000);
  expect(450000 - result.coverage + result.singleTotal).toBe(1300000);
});
it('ignores choices for removed court slots', () => {
  expect(adminInHousePricing([], direct(), [plan], [])).toEqual({
    coverage: 0,
    singleTotal: 0,
    extras: 0
  });
});
