/** Classifies the booking's actual payment source, including future recurring reservations. */
export function isMembershipBooking(booking: {
  membershipUserId?: string | null;
  membershipSessionsUsed?: number;
}) {
  return !!booking.membershipUserId || (booking.membershipSessionsUsed ?? 0) > 0;
}
