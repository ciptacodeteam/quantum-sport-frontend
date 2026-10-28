import { endOfDay, startOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';

/** Convert local calendar days to real UTC instants, including the entire final day. */
export function getAnalyticsDateRange(range: DateRange | undefined) {
  return {
    startDate: range?.from ? startOfDay(range.from).toISOString() : undefined,
    endDate: range?.to ? endOfDay(range.to).toISOString() : undefined
  };
}
