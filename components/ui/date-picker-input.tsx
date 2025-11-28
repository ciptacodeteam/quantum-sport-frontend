'use client';

import { cn } from '@/lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import dayjs from 'dayjs';
import { CalendarIcon } from 'lucide-react';

type Props = {
  value: Date | undefined | null;
  onValueChange: (date: Date | undefined | null) => void;
  minDate?: Date;
  maxDate?: Date;
};

const DatePickerInput = ({ value, onValueChange, minDate, maxDate }: Props) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className={cn('w-full pl-3 text-left font-normal', !value && 'text-muted-foreground')}
        >
          <div className="flex-between w-full">
            {value ? dayjs(value).format('DD/MM/YYYY') : <span>dd/MM/YYYY</span>}
            <CalendarIcon className="inline-block size-4" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="flex w-auto items-center overflow-hidden p-0" align="start">
        <div className="sm:flex">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={value ? dayjs(value).toDate() : undefined}
            onSelect={(date) => onValueChange(date)}
            autoFocus
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DatePickerInput;
