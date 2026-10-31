import dayjs from './dayjs';

// API values with offsets are instants; unqualified values are Jakarta wall time.
// Use the same interpretation for row labels, date filters, and booking placement.
export function parseScheduleDatetime(value: string | Date): dayjs.Dayjs {
  if (typeof value === 'string' && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) {
    return dayjs.tz(value, 'Asia/Jakarta');
  }
  return dayjs(value).tz('Asia/Jakarta');
}

export function formatScheduleSlotTime(
  value: string | Date | null | undefined,
  format = 'HH:mm'
): string {
  if (!value) return '-';
  const parsed = parseScheduleDatetime(value);
  return parsed.isValid() ? parsed.format(format) : '-';
}
