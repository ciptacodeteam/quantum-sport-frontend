import dayjs from '@/lib/dayjs';
import { isCourtSlotBookable } from '@/lib/booking-time-policy';
import { formatSlotTime } from '@/lib/time-utils';
import type { BookingItem } from '@/stores/useBookingStore';
import type { Court, Slot } from '@/types/model';

export type RecurringBookingRule = {
  mode: 'ROLLING' | 'MONTHS' | 'DATES';
  endDate?: string;
  skipConflicts?: boolean;
  months?: number;
  weekdays: number[];
  startDate: string;
  previewThrough: string;
  sourceSlotIds: string[];
};

export function recurringPreviewEnd(
  start: string,
  maximum: string,
  mode: 'ROLLING' | 'MONTHS' | 'DATES',
  months: number,
  endDate?: string
) {
  const durationEnd = dayjs(start).add(months, 'month').format('YYYY-MM-DD');
  return mode === 'ROLLING' ? maximum : mode === 'DATES' ? (endDate ?? start) : durationEnd;
}

export type RecurringSession = {
  date: string;
  items: BookingItem[];
  conflicts: string[];
};

export function recurringDates(start: string, end: string, weekdays: number[]): string[] {
  const first = dayjs(start);
  const last = dayjs(end);
  if (
    !first.isValid() ||
    !last.isValid() ||
    last.isBefore(first, 'day') ||
    last.diff(first, 'day') > 366
  ) {
    throw new Error('Pilih periode yang valid, maksimal 12 bulan.');
  }
  const dates: string[] = [];
  for (let date = first; !date.isAfter(last, 'day'); date = date.add(1, 'day')) {
    if (weekdays.includes(date.day())) dates.push(date.format('YYYY-MM-DD'));
  }
  return dates;
}

export function previewRecurringBooking(
  templates: BookingItem[],
  dates: string[],
  slots: (Slot & { court?: Court })[],
  now: number
): RecurringSession[] {
  const byTime = new Map(
    slots.map((slot) => [
      `${slot.courtId || slot.court?.id}|${String(slot.startAt).slice(0, 10)}|${formatSlotTime(slot.startAt)}`,
      slot
    ])
  );
  return dates.map((date) => {
    const items: BookingItem[] = [];
    const conflicts: string[] = [];
    for (const template of templates) {
      const time = template.timeSlot.slice(0, 5);
      const slot = byTime.get(`${template.courtId}|${date}|${time}`);
      const expectedEnd =
        template.endTime || (template.endAt ? formatSlotTime(template.endAt) : '');
      if (
        !slot ||
        !slot.isAvailable ||
        !isCourtSlotBookable(dayjs.tz(String(slot.startAt), 'Asia/Jakarta').valueOf(), now) ||
        (expectedEnd && formatSlotTime(slot.endAt) !== expectedEnd)
      ) {
        conflicts.push(
          `${template.courtName} ${time}: tidak tersedia atau di luar periode booking`
        );
        continue;
      }
      const normalPrice = slot.normalPrice ?? slot.price ?? 0;
      const discountPrice = slot.discountPrice ?? 0;
      items.push({
        ...template,
        slotId: slot.id,
        date,
        price: discountPrice > 0 ? discountPrice : normalPrice,
        normalPrice,
        discountPrice,
        startAt: String(slot.startAt),
        endAt: String(slot.endAt),
        endTime: formatSlotTime(slot.endAt)
      });
    }
    // Keep a session complete: never silently shorten the selected playing time.
    return { date, items: conflicts.length ? [] : items, conflicts };
  });
}

export function mergeBookingItems(existing: BookingItem[], incoming: BookingItem[]): BookingItem[] {
  return Array.from(
    new Map([...existing, ...incoming].map((item) => [item.slotId, item])).values()
  );
}
