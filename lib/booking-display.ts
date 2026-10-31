import dayjs from '@/lib/dayjs';
import { groupBookingSchedule, type BookingScheduleDetail } from '@/lib/booking-schedule';
import { parseScheduleDatetime } from '@/lib/admin-schedule-time';

/** True instants (createdAt, paidAt, holdExpiresAt) → Asia/Jakarta display. */
export function formatBookingDate(value: Date | string, pattern: string): string {
  try {
    const date =
      typeof value === 'string' && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
        ? dayjs.tz(value, 'Asia/Jakarta')
        : dayjs(value).tz('Asia/Jakarta');
    return date.isValid() ? date.format(pattern) : '-';
  } catch {
    return '-';
  }
}

/**
 * Slot startAt/endAt are Jakarta wall clock (timestamp without time zone).
 * Do not apply an extra +7 when the API labels wall components with Z.
 */
export function formatBookingSlotDate(
  value: Date | string,
  pattern: string
): string {
  try {
    const date = parseScheduleDatetime(value);
    return date.isValid() ? date.format(pattern) : '-';
  } catch {
    return '-';
  }
}

export function bookingScheduleInJakarta(details: BookingScheduleDetail[]) {
  return groupBookingSchedule(
    details.map((detail) => ({
      ...detail,
      slot: detail.slot
        ? {
            ...detail.slot,
            startAt: detail.slot.startAt
              ? formatBookingSlotDate(detail.slot.startAt, 'YYYY-MM-DDTHH:mm:ss')
              : undefined,
            endAt: detail.slot.endAt
              ? formatBookingSlotDate(detail.slot.endAt, 'YYYY-MM-DDTHH:mm:ss')
              : undefined
          }
        : undefined
    }))
  );
}
