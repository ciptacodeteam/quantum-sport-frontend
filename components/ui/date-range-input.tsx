'use client';

import { useState } from 'react';
import {
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isSameYear,
  startOfDay,
  subDays
} from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon } from 'lucide-react';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface DateRangeInputProps {
  value: DateRange | undefined | null;
  onValueChange: (range: DateRange | undefined | null) => void;
  minDate?: Date;
  maxDate?: Date;
  numberOfMonths?: number;
  className?: string;
  placeholder?: string;
}

function rangeLabel(range: DateRange | undefined | null, placeholder: string) {
  if (!range?.from) return placeholder;
  if (!range.to || isSameDay(range.from, range.to)) return format(range.from, 'dd MMM yyyy');
  const fromFormat = isSameMonth(range.from, range.to)
    ? 'dd'
    : isSameYear(range.from, range.to)
      ? 'dd MMM'
      : 'dd MMM yyyy';
  return `${format(range.from, fromFormat)} — ${format(range.to, 'dd MMM yyyy')}`;
}

const DateRangeInput = ({
  value,
  onValueChange,
  minDate,
  maxDate,
  numberOfMonths = 1,
  className,
  placeholder = 'Select date range'
}: DateRangeInputProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();
  const [month, setMonth] = useState<Date>(value?.from ?? new Date());
  const [choosingEnd, setChoosingEnd] = useState(false);
  const min = minDate ? startOfDay(minDate) : undefined;
  const max = maxDate ? startOfDay(maxDate) : undefined;
  const today = startOfDay(new Date());
  const presets = [
    { label: 'Today', from: today, to: today },
    { label: 'Last 7 days', from: subDays(today, 6), to: today },
    { label: 'Last 30 days', from: subDays(today, 29), to: today }
  ];
  const outOfBounds = (date: Date) =>
    !!((min && startOfDay(date) < min) || (max && startOfDay(date) > max));
  const label = rangeLabel(value, placeholder);

  const changeOpen = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraft(value ?? undefined);
      setMonth(value?.from ?? max ?? min ?? today);
      setChoosingEnd(false);
    }
    setOpen(nextOpen);
  };

  const applyRange = (range: DateRange) => {
    onValueChange(range);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          aria-label={`Date range: ${label}`}
          className={cn(
            'w-full justify-start gap-2 text-left font-normal sm:w-auto',
            !value?.from && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="text-muted-foreground size-4 shrink-0" />
          <span className="truncate tabular-nums">{label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto max-w-[calc(100vw-2rem)] p-0"
        align="end"
        sideOffset={6}
        aria-label="Choose date range"
      >
        <div className="flex gap-1 border-b p-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              size="sm"
              variant="ghost"
              disabled={outOfBounds(preset.from) || outOfBounds(preset.to)}
              onClick={() => applyRange({ from: preset.from, to: preset.to })}
              className="flex-1 px-2 text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <Calendar
          mode="range"
          captionLayout="dropdown"
          month={month}
          onMonthChange={setMonth}
          selected={draft}
          showOutsideDays={false}
          onSelect={(_range, day) => {
            if (outOfBounds(day)) return;
            if (choosingEnd && draft?.from) {
              applyRange(
                isBefore(day, draft.from)
                  ? { from: day, to: draft.from }
                  : { from: draft.from, to: day }
              );
            } else {
              setDraft({ from: day, to: undefined });
              setChoosingEnd(true);
            }
          }}
          numberOfMonths={isMobile ? 1 : numberOfMonths}
          startMonth={min ?? new Date(today.getFullYear() - 10, 0)}
          endMonth={max ?? new Date(today.getFullYear() + 5, 11)}
          disabled={outOfBounds}
        />
        <p role="status" className="text-muted-foreground border-t px-3 py-2 text-xs">
          {choosingEnd ? 'Select end date' : 'Select start date'}
        </p>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangeInput;
