'use client';

import { useState } from 'react';
import { Calendar } from './calendar';
import {
  Dialog,
  DialogContent,
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
  children?: React.ReactNode;
};

function DatePickerModal({
  value,
  onChange,
  label = 'Select Date',
  children
}: DatePickerModalProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<Date | null>(value ?? null);

  const handleSelect = (date: Date | undefined) => {
    setInternalValue(date ?? null);
    if (onChange) onChange(date ?? null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      <DialogContent className="max-w-xs p-0 md:max-w-sm">
        <DialogHeader className="pt-5">
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <div className="flex-center p-4 pt-0">
          <Calendar
            mode="single"
            classNames={{
              root: 'w-full'
            }}
            captionLayout="dropdown"
            selected={internalValue ?? undefined}
            onSelect={handleSelect}
            autoFocus
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { DatePickerModal, DatePickerModalTrigger };
