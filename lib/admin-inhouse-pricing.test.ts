import type { TariffRule } from './tariff-period';
import { expect, it } from 'vitest';
import { adminInHouseCourtPrices, adminInHousePricing } from './admin-inhouse-pricing';
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
])('uses the fixed court price for %s without a prepaid package', (timeSlot, price) => {
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
      inHouseCourtHourlyPrice: 250000
    }
  ] as TariffRule[];
  const result = adminInHousePricing([session], choices, [], [], rules);
  expect(price - result.coverage).toBe(250000);
  expect(price - result.coverage + result.singleTotal + result.extras).toBe(650000);
});
it('keeps prepaid package coverage unchanged when a fixed court tariff is configured', () => {
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
        inHouseCourtHourlyPrice: 999999
      }
    ]
  );
  expect(result).toEqual({ coverage: courts[0].price, singleTotal: 0, extras: 0 });
});

it('exposes final court prices only for applied sessions and restores regular pricing on removal', () => {
  const fixed = { ...rule, inHouseCourtHourlyPrice: 250000 };
  const choices: InHouseChoice[] = [
    {
      staffId: 'andi',
      courtSlotId: datedCourts[0].slotId,
      coachSlotId: 'coach-1',
      hourlyPrice: 750000,
      participants: 1
    }
  ];
  expect(adminInHouseCourtPrices(datedCourts, choices, [], [], [fixed])).toEqual({
    'court-0': 250000
  });
  expect(adminInHouseCourtPrices(datedCourts, [], [], [], [fixed])).toEqual({});
  expect(adminInHouseCourtPrices([], choices, [], [], [fixed])).toEqual({});
  expect(datedCourts[0].price).toBe(300000);
});
it('keeps prepaid court sessions included in the customer package', () => {
  const choices = direct().map(({ planId: _, ...choice }) => ({ ...choice, walletId: 'wallet' }));
  expect(
    adminInHouseCourtPrices(
      datedCourts,
      choices,
      [],
      [wallet],
      [{ ...rule, inHouseCourtHourlyPrice: 250000 }]
    )
  ).toEqual({ 'court-0': 0, 'court-1': 0 });
});

it.each([1, 2, 3])(
  'charges two full hourly coach rates and extra participants separately for %s participants',
  (participants) => {
    const sessions = [12, 13].map((hour) => ({
      ...datedCourts[0],
      slotId: `court-${hour}`,
      price: 150000,
      timeSlot: `${hour}:00 - ${hour + 1}:00`
    }));
    const choices: InHouseChoice[] = sessions.map((session) => ({
      staffId: 'andi',
      courtSlotId: session.slotId,
      coachSlotId: `coach-${session.slotId}`,
      hourlyPrice: 750000,
      additionalHourPrice: 100000,
      participants
    }));
    for (const selections of [choices, [...choices].reverse()]) {
      const result = adminInHousePricing(
        sessions,
        selections,
        [],
        [],
        [{ ...rule, inHouseCourtHourlyPrice: 250000 }]
      );
      expect(result).toEqual({
        coverage: -200000,
        singleTotal: 1500000,
        extras: (participants - 1) * 100000 * 2
      });
      expect(300000 - result.coverage + result.singleTotal + result.extras).toBe(
        2000000 + (participants - 1) * 200000
      );
    }
  }
);

it('applies approved Management prices per hour only to direct dashboard selections', () => {
  const session = { ...datedCourts[0], slotId: 'court', timeSlot: '12:00 - 13:00' };
  const choice: InHouseChoice = {
    staffId: 'andi',
    hourlyPrice: 750000,
    courtSlotId: 'court',
    coachSlotId: 'coach',
    participants: 2
  };
  const rules = [
    {
      ...rule,
      inHouseCourtHourlyPrice: 250000,
      managementCourtHourlyPrice: 200000,
      managementCoachHourlyPrice: 600000
    }
  ];
  expect(adminInHousePricing([session], [choice], [], [], rules, { isManagement: true })).toEqual({
    coverage: 100000,
    singleTotal: 600000,
    extras: 100000
  });
  expect(
    adminInHouseCourtPrices([session], [choice], [], [], rules, { isManagement: true })
  ).toEqual({ court: 200000 });
  for (const customer of [
    undefined,
    { isManagement: false },
    { isManagement: true, managementValidUntil: '2030-01-01' }
  ])
    expect(adminInHousePricing([session], [choice], [], [], rules, customer)).toEqual({
      coverage: 50000,
      singleTotal: 750000,
      extras: 100000
    });
});
