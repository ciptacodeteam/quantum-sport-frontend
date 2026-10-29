'use client';

import { useState } from 'react';
import { id } from 'date-fns/locale';
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
    setInternalValue(date ?? null);
    if (onChange) onChange(date ?? null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      <DialogContent className="booking-date-dialog max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-none border-black/15 bg-[#f8f8f6] p-5 text-[#171717] sm:max-w-[400px] sm:p-7">
        <DialogHeader className="gap-2 border-b border-black/15 pb-5 text-left">
          <p className="pr-6 text-[10px] font-medium tracking-[0.16em] text-[#ad422b] uppercase">
            Black Padel / Booking
          </p>
          <DialogTitle className="text-2xl font-medium tracking-tight text-[#171717]">
            {label}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-black/50">
            Tentukan hari untuk permainan berikutnya.
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-0">
          <Calendar
            mode="single"
            required
            locale={id}
            weekStartsOn={1}
            showOutsideDays={false}
            defaultMonth={selectedDate ?? new Date()}
            className="w-full bg-transparent p-0 [--cell-size:2rem]"
            disabled={[{ before: minDate ?? new Date() }, ...(maxDate ? [{ after: maxDate }] : [])]}
            endMonth={maxDate}
            classNames={{
              root: 'w-full',
              month: 'flex w-full flex-col gap-5',
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
              weekday:
                'flex-1 pb-2 text-center text-[10px] font-medium tracking-wider text-black/45 uppercase',
              day_button: 'rounded-none text-sm',
              today: 'text-[#ad422b] outline outline-1 -outline-offset-1 outline-[#ad422b]/35',
              disabled: 'text-black/20',
              week: 'mt-1 flex w-full'
            }}
            fromYear={new Date().getFullYear()}
            toYear={new Date().getFullYear() + 5}
            captionLayout="dropdown"
            selected={selectedDate ?? undefined}
            onSelect={handleSelect}
            autoFocus
          />
        </div>
        <div className="flex gap-5 border-t border-black/15 pt-4 text-[11px] text-black/50">
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
