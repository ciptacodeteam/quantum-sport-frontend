import { expect, it } from 'vitest';
import type { TrackedPackage } from '@/types/membership-tracking';
import { membershipUsageBalance } from './membership-usage-balance';

const entry = (id: string, status: string, hours: number, day: number) => ({
  id,
  status,
  hours,
  createdAt: `2026-11-${day}T01:00:00Z`,
  invoiceNumber: null,
  details: []
});
const pack: TrackedPackage = {
  id: 'pack',
  name: 'Silver',
  sport: 'PADEL',
  type: 'ALL_HOUR',
  status: 'ACTIVE',
  totalHours: 10,
  remainingHours: 6,
  usedHours: 3,
  heldHours: 1,
  remainingDays: 10,
  startDate: '2026-11-01',
  endDate: '2026-12-01',
  purchaseInvoice: null,
  usage: [
    entry('used', 'CONFIRMED', 3, 15),
    entry('cancelled', 'CANCELLED', 2, 14),
    entry('held', 'HOLD', 1, 16),
    entry('expired', 'EXPIRED', 2, 13)
  ]
};

it('reconstructs available balances including holds without charging cancelled or expired bookings', () => {
  const result = membershipUsageBalance(pack);
  expect(
    result.rows.map(({ entry, outHours, balanceAfter }) => [entry.id, outHours, balanceAfter])
  ).toEqual([
    ['held', 1, 6],
    ['used', 3, 7],
    ['cancelled', 0, 10],
    ['expired', 0, 10]
  ]);
  expect(result.otherMutationHours).toBe(0);
  expect(pack.usage[0].id).toBe('used');
});

it('exposes differences from the package quota instead of inventing booking usage', () => {
  const result = membershipUsageBalance({ ...pack, totalHours: 100, remainingHours: 2 });
  expect(result.otherMutationHours).toBe(-94);
  expect(result.balanceBeforeUsage).toBe(6);
  expect(result.rows[0].balanceAfter).toBe(2);
});

it('preserves negative balances and credits outside booking history', () => {
  expect(membershipUsageBalance({ ...pack, remainingHours: -2 }).rows[0].balanceAfter).toBe(-2);
  expect(membershipUsageBalance({ ...pack, remainingHours: 12, usage: [] })).toMatchObject({
    rows: [],
    otherMutationHours: 2,
    balanceBeforeUsage: 12
  });
});
