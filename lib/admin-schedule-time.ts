import dayjs from './dayjs';

/**
 * Slot times from the API are Asia/Jakarta wall clock. Values with a Z/offset
 * still carry wall components (timestamp without time zone exposed as UTC), so
 * do not shift them again with `.tz('Asia/Jakarta')`.
 */
export function parseScheduleDatetime(value: string | Date): dayjs.Dayjs {
  if (value instanceof Date) {
    const wall = dayjs
      .utc(value)
      .format('YYYY-MM-DD HH:mm:ss.SSS');
    return dayjs.tz(wall, 'Asia/Jakarta');
  }

  if (typeof value === 'string') {
    const match = value.match(
      /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/i
    );
    if (match) {
      return dayjs.tz(`${match[1]} ${match[2]}`, 'Asia/Jakarta');
    }
    if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) {
      return dayjs.tz(value, 'Asia/Jakarta');
    }
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
