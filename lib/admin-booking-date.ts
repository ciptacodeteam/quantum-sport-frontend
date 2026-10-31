import dayjs from './dayjs';

// Calendar controls use browser-local Date containers; derive today's calendar
// components in Jakarta first so UTC servers cannot select yesterday.
export function jakartaCalendarDate(now = new Date()): Date {
  return new Date(`${dayjs(now).tz('Asia/Jakarta').format('YYYY-MM-DD')}T00:00:00`);
}

export function currentAdminBookingDate(
  saved: Date | string | null | undefined,
  now = new Date()
): Date {
  const today = jakartaCalendarDate(now);
  const selected = saved ? dayjs(saved) : null;
  if (!selected?.isValid() || selected.format('YYYY-MM-DD') < dayjs(today).format('YYYY-MM-DD')) {
    return today;
  }
  return saved instanceof Date ? saved : selected.toDate();
}
