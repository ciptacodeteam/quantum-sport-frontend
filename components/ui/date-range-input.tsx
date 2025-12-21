'use client';

import { cn } from '@/lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import dayjs from 'dayjs';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon } from 'lucide-react';

interface DateRangeInputProps {
  value: DateRange | undefined | null;
  onValueChange: (range: DateRange | undefined | null) => void;
  minDate?: Date;
  maxDate?: Date;
  numberOfMonths?: number;
  className?: string;
  placeholder?: string;
}

/**
 * Single-input date range picker with shadcn UI calendar.
 * Opens a range calendar and displays the selected range in one input.
 */
const DateRangeInput = ({
  value,
  onValueChange,
  minDate,
  maxDate,
  numberOfMonths = 2,
  className,
  placeholder = 'dd/MM/YYYY — dd/MM/YYYY'
}: DateRangeInputProps) => {
  const label = (() => {
    const from = value?.from ? dayjs(value.from).format('DD/MM/YYYY') : null;
    const to = value?.to ? dayjs(value.to).format('DD/MM/YYYY') : null;
    if (from && to) return `${from} — ${to}`;
    if (from) return from;
    return placeholder;
  })();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className={cn(
            'w-full pl-3 text-left font-normal sm:w-[300px]',
            !value?.from && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex-between w-full">
            {label}
            <CalendarIcon className="inline-block size-4" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          captionLayout="dropdown"
          selected={value as any}
          onSelect={(range) => onValueChange(range)}
          numberOfMonths={numberOfMonths}
          autoFocus
          fromYear={minDate ? dayjs(minDate).year() : dayjs().year()}
          toYear={maxDate ? dayjs(maxDate).year() : dayjs().add(5, 'year').year()}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DateRangeInput;
