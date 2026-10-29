import { expect, it } from 'vitest';
import { selectMembershipSlots } from './membership-slot-selection';
import type { BookingItem } from '@/stores/useBookingStore';
const now = Date.parse('2026-10-28T12:00:00+07:00');
const membership = {
  isExpired: false,
  isSuspended: false,
  remainingSessions: 2,
  startDate: '2026-10-01',
  endDate: '2026-11-01',
  membership: { sport: 'PADEL' as const, type: 'ALL_HOUR' as const }
};
const items: BookingItem[] = [14, 15, 16].map((hour, i) => ({
  slotId: `slot-${i}`,
  courtId: 'court',
  courtName: 'Court 1',
  sport: 'PADEL',
  date: '2026-10-28',
  timeSlot: `${hour}:00`,
  endTime: `${hour + 1}:00`,
  startAt: `2026-10-28T${hour}:00:00+07:00`,
  endAt: `2026-10-28T${hour + 1}:00:00+07:00`,
  price: 200000,
  normalPrice: 200000,
  discountPrice: i === 1 ? 150000 : 0
}));
it('defaults to eligible slots within the available quota', () => {
  const result = selectMembershipSlots(items, membership, null, 'PADEL', now);
  expect(result.membershipSlotIds).toEqual(['slot-0', 'slot-1']);
  expect(result.slotsToDeduct).toBe(2);
  expect(result.discountedTotal).toBe(200000);
  expect(result.membershipSlotReasons['slot-2']).toBe('Sisa sesi tidak mencukupi');
});
it('only discounts explicit selections, retaining cash discounts for other slots', () => {
  const result = selectMembershipSlots(items, membership, ['slot-0', 'slot-2'], 'PADEL', now);
  expect(result.slotsToDeduct).toBe(2);
  expect(result.discountAmount).toBe(400000);
  expect(result.discountedTotal).toBe(150000);
});
it('allows paying cash for every hour with no membership quota used', () => {
  const result = selectMembershipSlots(items, membership, [], 'PADEL', now);
  expect(result.membershipSlotIds).toEqual([]);
  expect(result.discountedTotal).toBe(550000);
  expect(result.slotsToDeduct).toBe(0);
});
it('keeps out-of-hours slots cash payable while applying eligible membership hours', () => {
  const result = selectMembershipSlots(
    items,
    { ...membership, membership: { ...membership.membership, type: 'HAPPY_HOUR' } },
    null,
    'PADEL',
    now
  );
  expect(result.membershipSlotIds).toEqual(['slot-0']);
  expect(result.membershipSlotReasons['slot-1']).toBe('Jam di luar ketentuan paket');
  expect(result.discountedTotal).toBe(350000);
});
it.each([
  null,
  { ...membership, isSuspended: true },
  { ...membership, endDate: '2026-10-27' },
  { ...membership, remainingSessions: 0 },
  { ...membership, membership: { ...membership.membership, sport: 'TENNIS' as const } }
])('does not use an unavailable or mismatched membership %j', (pack) => {
  expect(selectMembershipSlots(items, pack, null, 'PADEL', now).membershipSlotIds).toEqual([]);
});
it('enables another eligible hour after a selected hour is deselected', () => {
  const result = selectMembershipSlots(items, membership, ['slot-0'], 'PADEL', now);
  expect(result.membershipSlotReasons['slot-2']).toBeUndefined();
});
