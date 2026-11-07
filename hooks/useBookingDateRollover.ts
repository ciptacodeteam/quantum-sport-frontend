'use client';
import { useEffect } from 'react';
import { nextScheduleDateAfterClose } from '@/lib/booking-date-rollover';

export function useBookingDateRollover({
  date,
  endDate,
  scheduledHours,
  now,
  enabled,
  onDateChange
}: {
  date: string;
  endDate: string;
  scheduledHours: string[];
  now: number;
  enabled: boolean;
  onDateChange: (date: string) => void;
}) {
  useEffect(() => {
    if (!enabled) return;
    const next = nextScheduleDateAfterClose(date, endDate, scheduledHours, now);
    if (next) onDateChange(next);
  }, [date, endDate, scheduledHours, now, enabled, onDateChange]);
}
