'use client';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

export function useBookingDateFilter() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const dateParams = useMemo(
    () =>
      dateRange?.from
        ? {
            dateFrom: format(dateRange.from, 'yyyy-MM-dd'),
            dateTo: format(dateRange.to ?? dateRange.from, 'yyyy-MM-dd')
          }
        : {},
    [dateRange]
  );
  return { dateRange, setDateRange, dateParams };
}
