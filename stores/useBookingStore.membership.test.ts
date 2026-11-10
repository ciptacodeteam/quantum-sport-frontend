import { beforeEach, expect, it } from 'vitest';
import { useBookingStore } from './useBookingStore';
beforeEach(() => {
  sessionStorage.clear();
  useBookingStore.getState().clearAll();
});
it('keeps the regular payment choice when continuing for the same customer and persists it for add-ons', () => {
  const store = useBookingStore.getState();
  store.setSelectedCustomerId('customer');
  store.setMembershipDiscount(100000);
  store.setUseMembership(false);
  store.setSelectedCustomerId('customer');
  expect(useBookingStore.getState()).toMatchObject({
    useMembership: false,
    membershipDiscount: 0,
    selectedCustomerId: 'customer'
  });
  expect(JSON.parse(sessionStorage.getItem('booking-storage')!).state.useMembership).toBe(false);
  store.setSelectedCustomerId('different-customer');
  expect(useBookingStore.getState().useMembership).toBe(true);
});
it('requires membership for a recurring rule until the rule is removed', () => {
  const store = useBookingStore.getState();
  store.setRecurringBooking({
    mode: 'ROLLING',
    weekdays: [2],
    startDate: '2026-11-03',
    previewThrough: '2026-12-03',
    sourceSlotIds: ['slot']
  });
  store.setUseMembership(false);
  expect(useBookingStore.getState().useMembership).toBe(true);
  store.setRecurringBooking(null);
  store.setUseMembership(false);
  expect(useBookingStore.getState().useMembership).toBe(false);
});
it('retains coaching choices only for the same customer and clears them on customer changes', () => {
  const store = useBookingStore.getState();
  store.setSelectedCustomerId('budi');
  store.setSelectedInHouse([
    { walletId: 'wallet', courtSlotId: 'court', coachSlotId: 'coach', participants: 1 }
  ]);
  store.setSelectedCustomerId('budi');
  expect(useBookingStore.getState().selectedInHouse).toHaveLength(1);
  store.setSelectedCustomerId('elvi');
  expect(useBookingStore.getState().selectedInHouse).toEqual([]);
});
it('removes prepaid selections when their court is removed or booking becomes recurring', () => {
  const store = useBookingStore.getState();
  store.setSelectedInHouse([
    { walletId: 'wallet', courtSlotId: 'court', coachSlotId: 'coach', participants: 1 }
  ]);
  store.setBookingItems([]);
  expect(useBookingStore.getState().selectedInHouse).toEqual([]);
  store.setSelectedInHouse([
    { walletId: 'wallet', courtSlotId: 'court', coachSlotId: 'coach', participants: 1 }
  ]);
  store.setRecurringBooking({
    mode: 'ROLLING',
    weekdays: [2],
    startDate: '2026-11-03',
    previewThrough: '2026-12-03',
    sourceSlotIds: ['court']
  });
  expect(useBookingStore.getState().selectedInHouse).toEqual([]);
});
