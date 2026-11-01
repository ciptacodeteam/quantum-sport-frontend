import type { Slot } from '@/types/model';
import { parseScheduleDatetime } from './admin-schedule-time';

type SummarySlot = Pick<Slot, 'price' | 'discountPrice' | 'scheduleClosed'> & {
  startAt: Date | string;
  endAt: Date | string;
};

export function summarizeCourtCostSchedule(slots: SummarySlot[]) {
  // isAvailable=false can mean booked or temporarily unavailable. It does not
  // remove a slot from operating hours; scheduleClosed marks the excluded hours.
  const scheduled = slots.filter((slot) => !slot.scheduleClosed);
  const prices = scheduled.map((slot) => {
    const discount = slot.discountPrice ?? 0;
    return discount > 0 && discount < slot.price ? discount : slot.price;
  });
  const intervals = scheduled
    .map((slot) => ({
      start: parseScheduleDatetime(slot.startAt),
      end: parseScheduleDatetime(slot.endAt)
    }))
    .filter(({ start, end }) => start.isValid() && end.isValid() && end.isAfter(start))
    .sort((a, b) => a.start.valueOf() - b.start.valueOf());
  const ranges: typeof intervals = [];
  for (const interval of intervals) {
    const previous = ranges.at(-1);
    if (previous && !interval.start.isAfter(previous.end)) {
      if (interval.end.isAfter(previous.end)) previous.end = interval.end;
    } else ranges.push({ ...interval });
  }
  const hours = ranges
    .map(({ start, end }) => {
      const closing =
        end.format('HH:mm') === '00:00' && !end.isSame(start, 'day')
          ? '24:00'
          : end.format('HH:mm');
      return `${start.format('HH:mm')} - ${closing}`;
    })
    .join(', ');
  return {
    hours: hours || '-',
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null
  };
}
