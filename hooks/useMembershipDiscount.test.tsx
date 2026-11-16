import { renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useMembershipDiscount, type ActiveMembership } from './useMembershipDiscount';
import type { BookingItem } from '@/stores/useBookingStore';
const mocks = vi.hoisted(() => ({
  admin: undefined as unknown,
  user: undefined as unknown,
  queries: [] as any[]
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: any) => {
    mocks.queries.push(options);
    return {
      data:
        options.queryKey[0] === 'memberships'
          ? mocks.user
          : options.queryKey.includes('membership')
            ? mocks.admin
            : undefined
    };
  },
  queryOptions: (options: unknown) => options
}));
beforeEach(() => {
  mocks.admin = undefined;
  mocks.user = undefined;
  mocks.queries = [];
});
const member: ActiveMembership = {
  id: 'wallet',
  startDate: '2026-10-01',
  endDate: '2026-12-01',
  remainingSessions: 0,
  remainingDuration: 30,
  isExpired: false,
  isSuspended: false,
  membership: { id: 'pack', name: 'Membership', price: 100, sport: 'PADEL', type: 'ALL_HOUR' }
};
const items: BookingItem[] = [
  {
    courtId: 'a',
    courtName: 'A',
    slotId: 's',
    date: '2026-11-01',
    timeSlot: '14:00',
    endTime: '15:00',
    price: 100,
    sport: 'PADEL'
  }
];
it('shows recurring sessions covered even when balance is zero', () => {
  const { result } = renderHook(() =>
    useMembershipDiscount(
      'customer',
      items,
      { activeMembership: member },
      false,
      'PADEL',
      true,
      undefined,
      true
    )
  );
  expect(result.current).toMatchObject({
    canUseMembership: true,
    deferredUsage: true,
    discountedTotal: 0,
    slotsToDeduct: 1
  });
});
it('keeps ordinary checkout balance requirements', () => {
  const { result } = renderHook(() =>
    useMembershipDiscount('customer', items, { activeMembership: member }, false, 'PADEL')
  );
  expect(result.current).toMatchObject({ canUseMembership: false, discountedTotal: 100 });
});
it('charges the regular price when a customer with sufficient membership quota opts out', () => {
  const { result } = renderHook(() =>
    useMembershipDiscount(
      'customer',
      items,
      { activeMembership: { ...member, remainingSessions: 50 } },
      false,
      'PADEL',
      false
    )
  );
  expect(result.current).toMatchObject({
    canUseMembership: false,
    discountAmount: 0,
    discountedTotal: 100
  });
});

it.each([
  ['PADEL', 'TENNIS'],
  ['TENNIS', 'PADEL']
] as const)(
  'does not show or apply a %s package to %s courts, including recurring bookings',
  (membershipSport, courtSport) => {
    const pack = {
      ...member,
      remainingSessions: 78,
      membership: { ...member.membership, sport: membershipSport }
    };
    const { result } = renderHook(() =>
      useMembershipDiscount(
        'customer',
        [{ ...items[0], sport: courtSport }],
        { activeMembership: pack },
        false,
        courtSport,
        true,
        undefined,
        true
      )
    );
    expect(result.current).toMatchObject({
      activeMembership: null,
      canUseMembership: false,
      discountAmount: 0,
      discountedTotal: 100
    });
    expect(mocks.queries.find((q) => q.queryKey.includes('membership'))).toMatchObject({
      enabled: true,
      queryKey: ['admin', 'customers', 'customer', 'membership', courtSport]
    });
  }
);
it('fetches the tennis package when customer search supplied the padel package', () => {
  const tennis = {
    ...member,
    id: 'tennis-wallet',
    remainingSessions: 10,
    membership: { ...member.membership, sport: 'TENNIS' as const }
  };
  mocks.admin = { activeMembership: tennis };
  const { result } = renderHook(() =>
    useMembershipDiscount(
      'customer',
      [{ ...items[0], sport: 'TENNIS' }],
      { activeMembership: member },
      false,
      'TENNIS'
    )
  );
  expect(result.current.activeMembership?.id).toBe('tennis-wallet');
  expect(result.current.canUseMembership).toBe(true);
});
it('does not use cached website membership data for an admin customer', () => {
  mocks.user = { activeMembership: { ...member, id: 'other-user', remainingSessions: 78 } };
  const { result } = renderHook(() =>
    useMembershipDiscount('customer', items, null, false, 'PADEL')
  );
  expect(result.current.activeMembership).toBeNull();
  expect(result.current.canUseMembership).toBe(false);
});
it('rejects mixed court sports and membership records with an unspecified category', () => {
  const { result } = renderHook(() =>
    useMembershipDiscount(
      'customer',
      [...items, { ...items[0], slotId: 'tennis-slot', sport: 'TENNIS' }],
      { activeMembership: { ...member, remainingSessions: 78 } },
      false,
      'PADEL'
    )
  );
  expect(result.current.canUseMembership).toBe(false);
  const missing = renderHook(() =>
    useMembershipDiscount(
      'customer',
      items,
      {
        activeMembership: {
          ...member,
          remainingSessions: 78,
          membership: { ...member.membership, sport: undefined }
        }
      },
      false,
      'PADEL'
    )
  );
  expect(missing.result.current.activeMembership).toBeNull();
});
