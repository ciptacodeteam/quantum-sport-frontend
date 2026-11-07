import dayjs from '@/lib/dayjs';
import { isScheduleWallSlotVisible } from '@/lib/booking-time-policy';

/** Advance only today's elapsed timetable, never a fully booked or manually selected future day. */
export function nextScheduleDateAfterClose(
  date: string,
  endDate: string,
  scheduledHours: string[],
  now: number
): string | null {
  const today = dayjs(now).tz('Asia/Jakarta').format('YYYY-MM-DD');
  if (date < today) return today <= endDate ? today : null;
  if (date !== today || scheduledHours.length === 0) return null;
  if (scheduledHours.some((hour) => isScheduleWallSlotVisible(`${date}T${hour}:00`, now)))
    return null;
  const next = dayjs(date).add(1, 'day').format('YYYY-MM-DD');
  return next <= endDate ? next : null;
}
