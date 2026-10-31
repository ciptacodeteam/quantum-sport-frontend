import { renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useMembershipDiscount, type ActiveMembership } from './useMembershipDiscount';
import type { BookingItem } from '@/stores/useBookingStore';
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: undefined }), queryOptions: (options: unknown) => options }));
const member: ActiveMembership = {
  id: 'wallet', startDate: '2026-10-01', endDate: '2026-12-01', remainingSessions: 0, remainingDuration: 30, isExpired: false, isSuspended: false,
  membership: { id: 'pack', name: 'Membership', price: 100, sport: 'PADEL', type: 'ALL_HOUR' }
};
const items: BookingItem[] = [{ courtId: 'a', courtName: 'A', slotId: 's', date: '2026-11-01', timeSlot: '14:00', endTime: '15:00', price: 100, sport: 'PADEL' }];
it('shows recurring sessions covered even when balance is zero', () => {
  const { result } = renderHook(() => useMembershipDiscount('customer', items, { activeMembership: member }, false, 'PADEL', true, undefined, true));
  expect(result.current).toMatchObject({ canUseMembership: true, deferredUsage: true, discountedTotal: 0, slotsToDeduct: 1 });
});
it('keeps ordinary checkout balance requirements', () => {
  const { result } = renderHook(() => useMembershipDiscount('customer', items, { activeMembership: member }, false, 'PADEL'));
  expect(result.current).toMatchObject({ canUseMembership: false, discountedTotal: 100 });
});
