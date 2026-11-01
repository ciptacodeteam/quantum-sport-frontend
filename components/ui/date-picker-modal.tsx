'use client';

import { useState } from 'react';
import { id } from 'date-fns/locale';
import { Dropdown, type DropdownProps } from 'react-day-picker';
import { Calendar } from './calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogTriggerProps
} from './dialog';

type DatePickerModalTriggerProps = DialogTriggerProps & { children?: React.ReactNode };

function DatePickerModalTrigger({ children, ...props }: DatePickerModalTriggerProps) {
  return (
    <DialogTrigger asChild {...props}>
      {children}
    </DialogTrigger>
  );
}

type DatePickerModalProps = {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  children?: React.ReactNode;
};

function BoundedMonthsDropdown(props: DropdownProps) {
  return <Dropdown {...props} options={props.options?.filter((option) => !option.disabled)} />;
}

function DatePickerModal({
  value,
  onChange,
  label = 'Pilih tanggal',
  minDate,
  maxDate,
  children
}: DatePickerModalProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<Date | null>(value ?? null);
  const selectedDate = value !== undefined ? value : internalValue;

  const handleSelect = (date: Date | undefined) => {
    if (
      date &&
      ((minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) ||
        (maxDate &&
          date >
            new Date(
              maxDate.getFullYear(),
              maxDate.getMonth(),
              maxDate.getDate(),
              23,
              59,
              59,
              999
            )))
    )
      return;
    setInternalValue(date ?? null);
    if (onChange) onChange(date ?? null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      <DialogContent className="booking-date-dialog flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem)] w-[calc(100%-1.5rem)] max-w-[400px] flex-col gap-4 overflow-y-auto overscroll-contain rounded-none border-black/15 bg-[#f8f8f6] p-4 text-[#171717] sm:max-w-[400px] sm:p-6">
        <DialogHeader className="shrink-0 gap-1.5 border-b border-black/15 pb-4 text-left">
          <p className="pr-6 text-[10px] font-medium tracking-[0.16em] text-[#ad422b] uppercase">
            Black Padel / Booking
          </p>
          <DialogTitle className="pr-6 text-xl leading-tight font-medium tracking-tight text-[#171717] sm:text-2xl">
            {label}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-black/50">
            Tentukan hari untuk permainan berikutnya.
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-0 shrink-0">
          <Calendar
            components={{ MonthsDropdown: BoundedMonthsDropdown }}
            mode="single"
            required
            locale={id}
            weekStartsOn={1}
            showOutsideDays={false}
            defaultMonth={selectedDate ?? new Date()}
            className="w-full bg-transparent p-0 [--cell-size:2.5rem]"
            disabled={[{ before: minDate ?? new Date() }, ...(maxDate ? [{ after: maxDate }] : [])]}
            startMonth={minDate}
            endMonth={maxDate}
            classNames={{
              root: 'w-full',
              months: 'relative flex w-full flex-col',
              month: 'flex w-full flex-col gap-3',
              month_caption: 'flex h-10 w-full items-center justify-center px-10',
              dropdowns: 'flex h-10 items-center justify-center gap-2 text-sm font-medium',
              dropdown_root:
                'relative border border-black/15 bg-white focus-within:border-black/50',
              caption_label:
                'flex h-9 items-center gap-2 px-3 text-sm font-medium [&>svg]:size-3 [&>svg]:text-black/45',
              button_previous:
                'flex size-9 items-center justify-center border border-black/15 bg-white text-black transition-colors hover:bg-black/5 disabled:opacity-30',
              button_next:
                'flex size-9 items-center justify-center border border-black/15 bg-white text-black transition-colors hover:bg-black/5 disabled:opacity-30',
              month_grid: 'w-full table-fixed border-collapse',
              weekdays: 'table-row',
              weekday:
                'h-8 w-[14.2857%] p-0 text-center text-[10px] font-medium tracking-wider text-black/45 uppercase',
              day: 'group/day relative h-10 w-[14.2857%] p-0 text-center align-middle select-none',
              day_button:
                'h-10 min-h-10 w-full min-w-0 flex-none aspect-auto rounded-none text-sm group-data-[focused=true]/day:ring-0 focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2',
              today: 'text-[#ad422b] outline outline-1 -outline-offset-1 outline-[#ad422b]/35',
              disabled: 'text-black/20',
              week: 'h-10'
            }}
            captionLayout="dropdown"
            selected={selectedDate ?? undefined}
            onSelect={handleSelect}
            autoFocus
          />
        </div>
        <div className="flex shrink-0 flex-wrap gap-x-5 gap-y-2 border-t border-black/15 pt-3 text-[11px] text-black/50">
          <span className="flex items-center gap-2">
            <span className="size-2.5 border border-[#ad422b]/50" />
            Hari ini
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 bg-[#111111]" />
            Dipilih
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { DatePickerModal, DatePickerModalTrigger };
