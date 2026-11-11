import type { TariffRule } from './tariff-period';
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
const direct = (participants = 1): Extract<InHouseChoice, { planId: string }>[] =>
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

const rule = {
  id: 'rule',
  branchId: 'cemara',
  sport: 'PADEL',
  effectiveFrom: '2030-01-01',
  happyStart: 6,
  happyEnd: 15,
  peakStart: 15,
  peakEnd: 24,
  happyInHouseCoachDiscount: 20000,
  peakInHouseCoachDiscount: 10000,
  happyCoachDiscount: 999999
} as TariffRule;
const datedCourts = courts.map((court) => ({
  ...court,
  date: '2040-11-03',
  timeSlot: '10:00 - 11:00',
  sport: 'PADEL' as const
}));
it.each([0, 20000, 500000])(
  'ignores direct hourly discounts for prepaid package usage: %s',
  (discount) => {
    const choices = direct(1)
      .slice(0, 1)
      .map(({ planId: _, ...choice }) => ({ ...choice, walletId: 'wallet' }));
    const result = adminInHousePricing(
      datedCourts,
      choices,
      [],
      [wallet],
      [{ ...rule, happyInHouseCoachDiscount: discount }]
    );
    expect(result).toEqual({ coverage: 300000, singleTotal: 0, extras: 0 });
  }
);
it('adds only the coach share for direct coaching and caps the court discount', () => {
  const result = adminInHousePricing(datedCourts, direct(1).slice(0, 1), [plan], [], [rule]);
  expect(result).toEqual({ coverage: 20000, singleTotal: 750000, extras: 0 });
  expect(
    adminInHousePricing(
      datedCourts,
      direct(1).slice(0, 1),
      [plan],
      [],
      [{ ...rule, happyInHouseCoachDiscount: 500000 }]
    ).coverage
  ).toBe(300000);
});
it('uses Peak Hour and weekend overrides without applying future rules early', () => {
  const choices = direct(1).slice(0, 1);
  const evening = [{ ...datedCourts[0], timeSlot: '18:00 - 19:00' }];
  expect(adminInHousePricing(evening, choices, [plan], [], [rule]).coverage).toBe(10000);
  expect(
    adminInHousePricing(evening, choices, [plan], [], [{ ...rule, happyAllDayDays: [6] }]).coverage
  ).toBe(20000);
  expect(
    adminInHousePricing(evening, choices, [plan], [], [{ ...rule, effectiveFrom: '2041-01-01' }])
      .singleTotal
  ).toBe(1000000);
});

it.each([
  ['09:00 - 10:00', 150000],
  ['18:00 - 19:00', 300000]
])('uses the normal court price for %s without the fixed-price schema', (timeSlot, price) => {
  const session = {
    slotId: 'court',
    date: '2040-11-03',
    sport: 'PADEL',
    timeSlot,
    price
  } as BookingItem;
  const choices: InHouseChoice[] = [
    {
      staffId: 'andi',
      hourlyPrice: 400000,
      courtSlotId: 'court',
      coachSlotId: 'coach',
      participants: 1
    }
  ];
  const rules = [
    {
      id: 'fixed',
      branchId: 'cemara',
      sport: 'PADEL',
      effectiveFrom: '2030-01-01',
      happyStart: 6,
      happyEnd: 15,
      peakStart: 15,
      peakEnd: 24,
      happyInHouseCoachDiscount: 50000,
      peakInHouseCoachDiscount: 50000
    }
  ] as TariffRule[];
  const result = adminInHousePricing([session], choices, [], [], rules);
  expect(price - result.coverage).toBe(price);
  expect(price - result.coverage + result.singleTotal + result.extras).toBe(price + 400000);
});
it('keeps prepaid package coverage unchanged when court discounts are configured', () => {
  const result = adminInHousePricing(
    [{ ...courts[0], date: '2040-11-03', sport: 'PADEL', timeSlot: '18:00 - 19:00' }],
    [{ walletId: 'wallet', courtSlotId: courts[0].slotId, coachSlotId: 'coach', participants: 1 }],
    [],
    [wallet],
    [
      {
        id: 'fixed',
        branchId: 'cemara',
        sport: 'PADEL',
        effectiveFrom: '2030-01-01',
        happyStart: 6,
        happyEnd: 15,
        peakStart: 15,
        peakEnd: 24,
        happyInHouseCoachDiscount: 50000,
        peakInHouseCoachDiscount: 50000
      }
    ]
  );
  expect(result).toEqual({ coverage: courts[0].price, singleTotal: 0, extras: 0 });
});
