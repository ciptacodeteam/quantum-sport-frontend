import dayjs from '@/lib/dayjs';

export const RESCHEDULE_NOTICE = 'Reschedule maksimal H-2 (minimal 48 jam sebelum jadwal asal).';

export function canRescheduleAt(startAt: string | Date | undefined, now = Date.now()): boolean {
  if (!startAt) return false;
  const start =
    typeof startAt === 'string' && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(startAt)
      ? dayjs.tz(startAt, 'Asia/Jakarta')
      : dayjs(startAt);
  return start.valueOf() - now >= 48 * 3_600_000;
}
