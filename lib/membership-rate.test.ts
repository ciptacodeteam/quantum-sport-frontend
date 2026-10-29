import { expect, it } from 'vitest';
import type { BookingItem } from '@/stores/useBookingStore';
import { cheaperRegularRate } from './membership-rate';
const slot = {
  price: 100000,
  timeSlot: '14:00',
  endTime: '15:00',
  date: '2026-10-28'
} as BookingItem;

it('compares the regular tariff against package price divided by original package hours', () => {
  expect(cheaperRegularRate(slot, { price: 1500000, sessions: 10 })).toEqual({
    regularPerHour: 100000,
    membershipPerHour: 150000
  });
});
it('uses the current regular discount when applicable', () => {
  expect(
    cheaperRegularRate(
      { ...slot, price: 200000, discountPrice: 120000 },
      { price: 1500000, sessions: 10 }
    )?.regularPerHour
  ).toBe(120000);
});
it('compares rates per hour rather than comparing the total for a longer slot', () => {
  expect(
    cheaperRegularRate(
      { ...slot, price: 200000, endTime: '16:00' },
      { price: 1500000, sessions: 10 }
    )?.regularPerHour
  ).toBe(100000);
});
it.each([150000, 200000])(
  'does not suggest regular payment when its rate is equal or higher at %s',
  (price) => {
    expect(cheaperRegularRate({ ...slot, price }, { price: 1500000, sessions: 10 })).toBeNull();
  }
);
it.each([undefined, { price: 1500000 }, { price: 1500000, sessions: 0 }])(
  'avoids misleading comparisons when package hours are unknown %j',
  (pack) => {
    expect(cheaperRegularRate(slot, pack)).toBeNull();
  }
);
