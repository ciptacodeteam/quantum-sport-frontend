'use client';

import { useRef } from 'react';
import { IconCalendarFilled } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { DatePickerModal, DatePickerModalTrigger } from '@/components/ui/date-picker-modal';
import { Separator } from '@/components/ui/separator';
import dayjs from '@/lib/dayjs';
import { cn } from '@/lib/utils';

/** Shared date header from the court booking page, outside the scrolling timetable. */
export default function BookingDateNavigation({
  selectedDate,
  dates,
  minDate,
  maxDate,
  disabled,
  onDateChange,
  label = 'Tanggal booking lapangan'
}: {
  selectedDate: string;
  dates: string[];
  minDate: string;
  maxDate: string;
  disabled: boolean;
  onDateChange: (date: string) => void;
  label?: string;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const chooseCalendarDate = (value: Date | null) => {
    if (!value) return;
    const next = dayjs(value).format('YYYY-MM-DD');
    if (next < minDate || next > maxDate || disabled) return;
    onDateChange(next);
    const target = strip.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`);
    if (strip.current && target) {
      // Scroll only the date strip; selecting a date must not move the page/header.
      const left =
        target.getBoundingClientRect().left -
        strip.current.getBoundingClientRect().left +
        strip.current.scrollLeft;
      strip.current.scrollTo({ left, behavior: 'smooth' });
    }
  };
  return (
    <div className="min-w-0 shrink-0 border-y border-black/15 bg-[#f8f8f6] p-3 lg:border">
      <div className="flex items-center gap-2">
        <div className="flex shrink-0 items-center">
          <DatePickerModal
            value={dayjs(selectedDate).toDate()}
            onChange={chooseCalendarDate}
            label="Pilih tanggal bermain"
            minDate={dayjs(minDate).toDate()}
            maxDate={dayjs(maxDate).toDate()}
          >
            <DatePickerModalTrigger>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Pilih tanggal pemesanan"
                disabled={disabled}
                className="rounded-none border border-black/15 bg-white p-2 text-black hover:bg-black/5"
              >
                <IconCalendarFilled className="size-5" />
              </Button>
            </DatePickerModalTrigger>
          </DatePickerModal>
        </div>
        <Separator
          orientation="vertical"
          className="mx-2 bg-black/25 data-[orientation=vertical]:h-10"
        />
        <div
          ref={strip}
          role="group"
          aria-label={label}
          className="flex min-w-0 flex-1 flex-nowrap gap-2 overflow-x-auto px-2 pb-1"
        >
          {dates.map((value) => (
            <button
              key={value}
              type="button"
              data-date={value}
              aria-label={dayjs(value).format('DD MMM YYYY')}
              aria-pressed={selectedDate === value}
              className={cn(
                'flex h-16 min-w-16 shrink-0 flex-col items-center justify-center border px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
                selectedDate === value
                  ? 'border-[#111111] bg-[#111111] text-white'
                  : 'border-transparent text-black/60 hover:border-black/15 hover:bg-white'
              )}
              onClick={() => onDateChange(value)}
            >
              <span className="text-xs font-normal">{dayjs(value).format('ddd')}</span>
              <div className="mt-0.5 flex">
                <span className="me-0.5 text-sm font-semibold">{dayjs(value).format('DD')}</span>
                <span className="text-sm font-semibold">{dayjs(value).format('MMM')}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
