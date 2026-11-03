'use client';
import type { DateRange } from 'react-day-picker';
import DateRangeInput from '@/components/ui/date-range-input';
import { jakartaCalendarDate } from '@/lib/admin-booking-date';
import { Button } from '@/components/ui/button';

export default function BookingDateFilter({
  value,
  onChange,
  label = 'Tanggal bermain'
}: {
  value?: DateRange;
  onChange: (value: DateRange | undefined) => void;
  label?: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex max-w-full flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <DateRangeInput
        value={value}
        referenceDate={jakartaCalendarDate()}
        onValueChange={(range) => onChange(range ?? undefined)}
        placeholder="Semua tanggal"
        className="h-9 max-w-full rounded-lg shadow-none"
      />
      {value?.from && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Reset filter tanggal"
          onClick={() => onChange(undefined)}
        >
          Reset
        </Button>
      )}
    </div>
  );
}
