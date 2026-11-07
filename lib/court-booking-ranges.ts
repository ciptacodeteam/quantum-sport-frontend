import { parseScheduleDatetime } from './admin-schedule-time';
import type { BookingItem } from '@/stores/useBookingStore';

/** Display-only grouping: retain every source slot for checkout and removal. */
export function groupCourtBookingRanges(items: BookingItem[]) {
  const slots = items
    .map((item) => {
      const [startTime, rangeEnd] = item.timeSlot.split(' - ');
      const start = parseScheduleDatetime(item.startAt ?? `${item.date}T${startTime}:00`);
      const endTime = item.endTime || rangeEnd;
      let end = item.endAt
        ? parseScheduleDatetime(item.endAt)
        : endTime
          ? parseScheduleDatetime(`${item.date}T${endTime}:00`)
          : start.add(1, 'hour');
      if (end.valueOf() <= start.valueOf()) end = end.add(1, 'day');
      return {
        courtId: item.courtId,
        courtName: item.courtName,
        date: item.date,
        startAt: start.valueOf(),
        endAt: end.valueOf(),
        startTime: start.format('HH:mm'),
        endTime: end.format('HH:mm'),
        items: [item]
      };
    })
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.courtId.localeCompare(b.courtId) || a.startAt - b.startAt
    );
  const ranges: typeof slots = [];
  for (const slot of slots) {
    const last = ranges[ranges.length - 1];
    if (
      last &&
      last.courtId === slot.courtId &&
      last.date === slot.date &&
      last.endAt === slot.startAt
    ) {
      last.endAt = slot.endAt;
      last.endTime = slot.endTime;
      last.items.push(...slot.items);
    } else ranges.push({ ...slot, items: [...slot.items] });
  }
  return ranges;
}
