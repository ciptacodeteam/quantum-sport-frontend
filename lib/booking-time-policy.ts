import { parseScheduleDatetime } from './admin-schedule-time';

export const COURT_BOOKING_GRACE_MINUTES = 15;

export function isCourtSlotBookable(startAt: number, now: number): boolean {
  return startAt + COURT_BOOKING_GRACE_MINUTES * 60_000 > now;
}

/** API slot timestamps carry Jakarta wall components, including those ending in Z. */
export function isCourtWallSlotBookable(startAt: Date | string, now: number): boolean {
  return isCourtSlotBookable(parseScheduleDatetime(startAt).valueOf(), now);
}

// Visibility is separate from whether a slot can still be booked.
export const SCHEDULE_SLOT_VISIBILITY_MINUTES = 30;

export function isScheduleSlotVisible(startAt: number, now: number): boolean {
  return startAt + SCHEDULE_SLOT_VISIBILITY_MINUTES * 60_000 > now;
}

export function isScheduleWallSlotVisible(startAt: Date | string, now: number): boolean {
  return isScheduleSlotVisible(parseScheduleDatetime(startAt).valueOf(), now);
}
