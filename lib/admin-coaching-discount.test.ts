import { expect, it } from 'vitest';
import { calculateAdminCoachingDiscount } from './admin-coaching-discount';
import type { BookingItem, SelectedCoach } from '@/stores/useBookingStore';
import type { TariffRule } from './tariff-period';
const court: BookingItem = {
  slotId: 'court',
  courtId: 'court',
  courtName: 'Court',
  date: '2026-11-05',
  sport: 'PADEL',
  timeSlot: '10:00 - 11:00',
  endTime: '11:00',
  price: 150000
};
const coach: SelectedCoach = {
  coachId: 'coach',
  coachName: 'Coach',
  slotId: 'coach',
  courtSport: 'PADEL',
  date: court.date,
  timeSlot: court.timeSlot,
  price: 200000
};
const rule: TariffRule = {
  id: 'rule',
  branchId: 'cemara',
  sport: 'PADEL',
  effectiveFrom: '2026-11-05',
  happyStart: 6,
  happyEnd: 15,
  peakStart: 15,
  peakEnd: 24,
  happyCoachDiscount: 45000,
  peakCoachDiscount: 25000
};
it('previews configured discounts only for court sessions with a selected coach', () => {
  expect(calculateAdminCoachingDiscount([court], [coach], [rule])).toBe(45000);
  expect(calculateAdminCoachingDiscount([court], [], [rule])).toBe(0);
  expect(calculateAdminCoachingDiscount([court], [{ ...coach, date: '2026-11-06' }], [rule])).toBe(
    0
  );
  expect(
    calculateAdminCoachingDiscount([court], [{ ...coach, courtSport: 'TENNIS' }], [rule])
  ).toBe(0);
  expect(calculateAdminCoachingDiscount([court], [coach], [])).toBe(0);
});
it('caps discounts at the actual court price and supports disabling with zero', () => {
  expect(
    calculateAdminCoachingDiscount([{ ...court, discountPrice: 30000 }], [coach], [rule])
  ).toBe(30000);
  expect(
    calculateAdminCoachingDiscount([court], [coach], [{ ...rule, happyCoachDiscount: 0 }])
  ).toBe(0);
  const late = { ...court, timeSlot: '17:00 - 18:00', endTime: '18:00' };
  expect(
    calculateAdminCoachingDiscount([late], [{ ...coach, timeSlot: late.timeSlot }], [rule])
  ).toBe(25000);
});
it('previews the Happy Hour coaching amount on weekend evenings', () => {
  const rules = [
    { ...rule, happyAllDayDays: [6, 7], happyCoachDiscount: 50000, peakCoachDiscount: 100000 }
  ];
  for (const date of ['2026-11-07', '2026-11-08', '2026-11-09']) {
    const late = { ...court, date, timeSlot: '20:00 - 21:00', endTime: '21:00' };
    const selected = { ...coach, date, timeSlot: late.timeSlot };
    expect(calculateAdminCoachingDiscount([late], [selected], rules)).toBe(
      date === '2026-11-09' ? 100000 : 50000
    );
  }
});
