import { expect, it } from 'vitest';
import {
  resolveTariffPeriod,
  tariffBand,
  defaultTariffPeriod,
  type TariffRule
} from './tariff-period';
import { isTimeAllowedForMembershipType, describeMembershipHours } from './membership-hours';
import { selectMembershipSlots } from './membership-slot-selection';
import type { BookingItem } from '@/stores/useBookingStore';
const rule: TariffRule = {
  id: 'rule',
  branchId: 'cemara',
  sport: 'PADEL',
  effectiveFrom: '2026-11-01T00:00:00Z',
  happyStart: 6,
  happyEnd: 17,
  peakStart: 17,
  peakEnd: 24
};
it('uses the selected sport and playing date rather than today', () => {
  expect(resolveTariffPeriod([rule], '2026-10-31', 'PADEL')).toEqual(defaultTariffPeriod);
  expect(resolveTariffPeriod([rule], '2026-11-01', 'PADEL').happyEnd).toBe(17);
  expect(resolveTariffPeriod([rule], '2026-11-01', 'TENNIS')).toEqual(defaultTariffPeriod);
  expect(describeMembershipHours('AFTER_HOUR', [rule], '2026-11-01', 'PADEL')).toBe(
    '17:00 – 24:00'
  );
});
it('handles midnight and canonical UTC times consistently with Jakarta policy', () => {
  expect(tariffBand('16:00 - 17:00', rule)).toBe('happyHour');
  expect(tariffBand('23:00 - 00:00', rule)).toBe('peakHour');
  expect(tariffBand('16:30 - 17:30', rule)).toBeNull();
  expect(tariffBand('2026-11-01T09:00:00Z', rule, '2026-11-01T10:00:00Z')).toBe('happyHour');
});
it('evaluates Happy Hour membership and discount selections for each cart date', () => {
  const membership = {
    isExpired: false,
    isSuspended: false,
    remainingSessions: 10,
    startDate: '2026-10-01',
    endDate: '2027-01-01',
    membership: { sport: 'PADEL' as const, type: 'HAPPY_HOUR' as const }
  };
  const items: BookingItem[] = ['2026-10-31', '2026-11-01'].map((date) => ({
    courtId: 'court',
    courtName: 'Court',
    slotId: date,
    date,
    timeSlot: '16:00',
    endTime: '17:00',
    price: 100,
    sport: 'PADEL'
  }));
  const result = selectMembershipSlots(items, membership, null, 'PADEL', Date.parse('2026-10-30'), [
    rule
  ]);
  expect(result.membershipSlotIds).toEqual(['2026-11-01']);
  expect(result.discountedTotal).toBe(100);
  expect(
    isTimeAllowedForMembershipType('AFTER_HOUR', '16:00', {
      rules: [rule],
      date: '2026-11-01',
      sport: 'PADEL'
    })
  ).toBe(false);
});

it('uses the same weekend category for time-only slots, midnight, membership and weekday prices', () => {
  const rules = [{ ...rule, happyAllDayDays: [6, 7] }];
  for (const date of ['2026-11-07', '2026-11-08']) {
    const bands = resolveTariffPeriod(rules, date, 'PADEL');
    expect(tariffBand('20:00 - 21:00', bands)).toBe('happyHour');
    expect(tariffBand('23:00 - 00:00', bands)).toBe('happyHour');
    expect(tariffBand('05:00 - 06:00', bands)).toBeNull();
    expect(isTimeAllowedForMembershipType('HAPPY_HOUR', '20:00 - 21:00', { rules, date })).toBe(
      true
    );
    expect(isTimeAllowedForMembershipType('AFTER_HOUR', '20:00 - 21:00', { rules, date })).toBe(
      false
    );
    expect(describeMembershipHours('AFTER_HOUR', rules, date)).toBe(
      'Tidak ada Peak Hour pada tanggal ini'
    );
    expect(resolveTariffPeriod(rules, date, 'PADEL', false).happyEnd).toBe(17);
  }
  expect(tariffBand('20:00 - 21:00', resolveTariffPeriod(rules, '2026-11-09'))).toBe('peakHour');
  expect(tariffBand('20:00 - 21:00', resolveTariffPeriod(rules, '2026-11-07', 'TENNIS'))).toBe(
    'peakHour'
  );
});
