'use client';

import { cn } from '@/lib/utils';
import DatePickerInput from './date-picker-input';

interface DateRangePickerProps {
  startDate: Date | null | undefined;
  endDate: Date | null | undefined;
  onStartDateChange: (date: Date | null | undefined) => void;
  onEndDateChange: (date: Date | null | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  containerClassName?: string;
  enforceRange?: boolean;
}

/**
 * Reusable date range picker component
 * Combines two DatePickerInput components with a visual separator
 *
 * @param startDate - Start date value
 * @param endDate - End date value
 * @param onStartDateChange - Callback when start date changes
 * @param onEndDateChange - Callback when end date changes
 * @param minDate - Minimum selectable date (optional)
 * @param maxDate - Maximum selectable date (optional)
 * @param containerClassName - Additional CSS classes for the container (optional)
 * @param enforceRange - If true, ensures startDate <= endDate (optional)
 */
const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
  containerClassName,
  enforceRange = false
}: DateRangePickerProps) => {
  const handleStartDateChange = (date: Date | null | undefined) => {
    onStartDateChange(date);

    // Enforce range constraint: if start > end, adjust end to match start
    if (enforceRange && date && endDate && date > endDate) {
      onEndDateChange(date);
    }
  };

  const handleEndDateChange = (date: Date | null | undefined) => {
    onEndDateChange(date);

    // Enforce range constraint: if end < start, adjust start to match end
    if (enforceRange && date && startDate && date < startDate) {
      onStartDateChange(date);
    }
  };

  return (
    <div className={cn('flex w-full max-w-md items-center gap-2', containerClassName)}>
      <DatePickerInput
        value={startDate}
        onValueChange={handleStartDateChange}
        minDate={minDate}
        maxDate={endDate || maxDate}
      />
      <div className="text-muted-foreground text-sm">—</div>
      <DatePickerInput
        value={endDate}
        onValueChange={handleEndDateChange}
        minDate={startDate || minDate}
        maxDate={maxDate}
      />
    </div>
  );
};

export default DateRangePicker;
