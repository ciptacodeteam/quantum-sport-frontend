import dayjs from '@/lib/dayjs';
import { groupBookingSchedule, type BookingScheduleDetail } from '@/lib/booking-schedule';

/** Offset-bearing values are instants; timezone-free API strings are already club local time. */
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

export function bookingScheduleInJakarta(details: BookingScheduleDetail[]) {
  return groupBookingSchedule(
    details.map((detail) => ({
      ...detail,
      slot: detail.slot
        ? {
            ...detail.slot,
            startAt: detail.slot.startAt
              ? formatBookingDate(detail.slot.startAt, 'YYYY-MM-DDTHH:mm:ss')
              : undefined,
            endAt: detail.slot.endAt
              ? formatBookingDate(detail.slot.endAt, 'YYYY-MM-DDTHH:mm:ss')
              : undefined
          }
        : undefined
    }))
  );
}
