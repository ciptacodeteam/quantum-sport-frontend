import { parseScheduleDatetime } from './admin-schedule-time';

export const COURT_BOOKING_GRACE_MINUTES = 15;

export function isCourtSlotBookable(startAt: number, now: number): boolean {
  return startAt + COURT_BOOKING_GRACE_MINUTES * 60_000 > now;
}

/** API slot timestamps carry Jakarta wall components, including those ending in Z. */
export function isCourtWallSlotBookable(startAt: Date | string, now: number): boolean {
  return isCourtSlotBookable(parseScheduleDatetime(startAt).valueOf(), now);
}
