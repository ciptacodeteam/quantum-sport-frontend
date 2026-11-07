import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useBookingDateRollover } from './useBookingDateRollover';
afterEach(cleanup);
it('advances automatically when the clock crosses the last visible hour', () => {
  const onDateChange = vi.fn();
  const { rerender } = renderHook(
    ({ now, enabled }) =>
      useBookingDateRollover({
        date: '2030-01-02',
        endDate: '2030-02-02',
        scheduledHours: ['23:00'],
        now,
        enabled,
        onDateChange
      }),
    { initialProps: { now: Date.parse('2030-01-02T23:29:59+07:00'), enabled: true } }
  );
  expect(onDateChange).not.toHaveBeenCalled();
  rerender({ now: Date.parse('2030-01-02T23:30:00+07:00'), enabled: true });
  expect(onDateChange).toHaveBeenCalledWith('2030-01-03');
});
it('waits for successful schedule loading before changing the selected date', () => {
  const onDateChange = vi.fn();
  renderHook(() =>
    useBookingDateRollover({
      date: '2030-01-02',
      endDate: '2030-02-02',
      scheduledHours: ['23:00'],
      now: Date.parse('2030-01-02T23:45:00+07:00'),
      enabled: false,
      onDateChange
    })
  );
  expect(onDateChange).not.toHaveBeenCalled();
});
