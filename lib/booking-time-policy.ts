export const COURT_BOOKING_GRACE_MINUTES = 15;

export function isCourtSlotBookable(startAt: number, now: number): boolean {
  return startAt + COURT_BOOKING_GRACE_MINUTES * 60_000 > now;
}
