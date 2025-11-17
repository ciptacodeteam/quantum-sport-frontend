/**
 * Formats a date to a specific format
 * @param date - The date value
 * @param format - The output format (e.g., 'YYYY-MM-DD', 'HH:mm', 'DD MMM YYYY')
 * @returns Formatted date string or '-' if invalid
 */
function formatDate(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const pad = (n: number) => n.toString().padStart(2, '0');

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return format
    .replace('YYYY', year.toString())
    .replace('MMM', monthNames[month])
    .replace('MM', pad(month + 1))
    .replace('DD', pad(day))
    .replace('dddd', dayNames[date.getDay()])
    .replace('ddd', dayNamesShort[date.getDay()])
    .replace('HH', pad(hours))
    .replace('mm', pad(minutes));
}

/**
 * Parses an ISO string and extracts date/time components without timezone conversion
 * Treats the time as if it's already in the correct timezone (Asia/Jakarta)
 */
function parseISOString(value: string): { year: number; month: number; day: number; hours: number; minutes: number } | null {
  // Handle ISO format: "2024-01-15T07:00:00Z" or "2024-01-15T07:00:00+07:00" or "2024-01-15T07:00:00.000Z"
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
  const match = value.match(isoRegex);
  
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10) - 1, // Month is 0-indexed
      day: parseInt(match[3], 10),
      hours: parseInt(match[4], 10),
      minutes: parseInt(match[5], 10)
    };
  }
  
  return null;
}

/**
 * Formats a slot time (startAt or endAt) - treats time as local timezone (no conversion)
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
    // If it's a string (likely ISO format), parse it directly to avoid timezone conversion
    if (typeof value === 'string') {
      const parsed = parseISOString(value);
      if (parsed) {
        // Create a date object with the parsed components (treats as local time)
        const date = new Date(parsed.year, parsed.month, parsed.day, parsed.hours, parsed.minutes);
        return formatDate(date, format);
      }
      // Fallback to standard Date parsing if regex doesn't match
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return '-';
      }
      return formatDate(date, format);
    }
    
    // If it's already a Date object, use it directly
    const date = value;
    if (isNaN(date.getTime())) {
      return '-';
    }

    return formatDate(date, format);
  } catch (error) {
    console.error('Error formatting slot time:', error);
    return '-';
  }
}

/**
 * Formats a slot time range (startAt - endAt)
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
 * Gets the time portion from a slot's startAt
 * Used for mapping slots by time key
 * @param value - The startAt value
 * @returns Time string in HH:mm format
 */
export function getSlotTimeKey(value: Date | string | null | undefined): string {
  return formatSlotTime(value, 'HH:mm');
}
