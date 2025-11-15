import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Formats a slot time (startAt or endAt) from UTC to Asia/Jakarta timezone
 * Handles various input formats and returns formatted time string
 * @param value - The time value (Date, string, or null/undefined)
 * @param format - The output format (default: 'HH:mm')
 * @returns Formatted time string or '-' if invalid
 */
export function formatSlotTime(
  value: Date | string | null | undefined,
  format: string = 'HH:mm'
): string {
  if (!value) {
    return '-';
  }

  try {
    const parsedUtc = dayjs(value);

    if (!parsedUtc.isValid()) {
      return '-';
    }

    return parsedUtc.format(format);
  } catch (error) {
    console.error('Error formatting slot time:', error);
    return '-';
  }
}

/**
 * Formats a slot time range (startAt - endAt) from UTC to Asia/Jakarta timezone
 * @param startAt - The start time value
 * @param endAt - The end time value
 * @param format - The output format for each time (default: 'HH:mm')
 * @returns Formatted time range string like "07:00 - 08:00"
 */
export function formatSlotTimeRange(
  startAt: Date | string | null | undefined,
  endAt: Date | string | null | undefined,
  format: string = 'HH:mm'
): string {
  const start = formatSlotTime(startAt, format);
  const end = formatSlotTime(endAt, format);

  if (start === '-' || end === '-') {
    return '-';
  }

  return `${start} - ${end}`;
}

/**
 * Gets the time portion from a slot's startAt in Asia/Jakarta timezone
 * Used for mapping slots by time key
 * @param value - The startAt value
 * @returns Time string in HH:mm format
 */
export function getSlotTimeKey(value: Date | string | null | undefined): string {
  return formatSlotTime(value, 'HH:mm');
}
