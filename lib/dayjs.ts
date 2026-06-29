import dayjs from 'dayjs';
import localeId from 'dayjs/locale/id';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale(localeId);
dayjs.tz.setDefault('Asia/Jakarta');

/** Current instant in Asia/Jakarta; use for user-facing dates to avoid SSR/client drift. */
export const nowJakarta = () => dayjs().tz('Asia/Jakarta');

export default dayjs;
