import { formatSlotTime } from './time-utils';
export type BookingScheduleDetail = {
  id?: string;
  price?: number;
  discountPrice?: number | null;
  court?: { id?: string; name?: string } | null;
  slot?: {
    startAt?: string | Date;
    endAt?: string | Date;
    price?: number;
    discountPrice?: number | null;
    courtId?: string | null;
    court?: { id?: string; name?: string };
  };
};
type Range = { start: string; end: string; price: number };
type CourtGroup = { name: string; ranges: Range[] };

export function groupBookingSchedule(details: BookingScheduleDetail[]) {
  const dates = new Map<string, Map<string, CourtGroup>>();
  for (const detail of details) {
    if (!detail.slot?.startAt || !detail.slot?.endAt) continue;
    // Preserve the local slot times supplied by the booking API.
    const start = formatSlotTime(detail.slot.startAt, 'YYYY-MM-DD HH:mm');
    const end = formatSlotTime(detail.slot.endAt, 'YYYY-MM-DD HH:mm');
    if (start === '-' || end === '-') continue;
    const date = start.slice(0, 10);
    const name = detail.court?.name || detail.slot.court?.name || 'Lapangan';
    const courtKey = detail.court?.id || detail.slot.courtId || detail.slot.court?.id || name;
    if (!dates.has(date)) dates.set(date, new Map());
    const courts = dates.get(date)!;
    if (!courts.has(courtKey)) courts.set(courtKey, { name, ranges: [] });
    const discount = detail.discountPrice ?? detail.slot.discountPrice ?? 0;
    courts.get(courtKey)!.ranges.push({
      start,
      end,
      price: discount > 0 ? discount : detail.price || detail.slot.price || 0
    });
  }

  return [...dates.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, courts]) => ({
      date,
      courts: [...courts.entries()].map(([id, court]) => {
        const merged: Range[] = [];
        for (const range of [...court.ranges].sort((a, b) => a.start.localeCompare(b.start))) {
          const last = merged[merged.length - 1];
          if (last && last.end === range.start) {
            last.end = range.end;
            last.price += range.price;
          } else merged.push({ ...range });
        }
        return { id, name: court.name, ranges: merged };
      })
    }));
}
