import { expect, it } from 'vitest';
import { isMembershipBooking } from './booking-membership';
it('badges actual membership use, including future recurring bookings and legacy debits', () => {
  expect(
    isMembershipBooking({ membershipUserId: 'shared-wallet', membershipSessionsUsed: 0 })
  ).toBe(true);
  expect(isMembershipBooking({ membershipUserId: null, membershipSessionsUsed: 2 })).toBe(true);
  expect(isMembershipBooking({ membershipUserId: null, membershipSessionsUsed: 0 })).toBe(false);
});
