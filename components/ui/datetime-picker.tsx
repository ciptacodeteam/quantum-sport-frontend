'use client';

import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { CalendarIcon } from 'lucide-react';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { ScrollArea, ScrollBar } from './scroll-area';

type Props = {
  value: Date | undefined | null;
  onValueChange: (date: Date | undefined | null) => void;
  disabled?: boolean;
};

const DatetimePicker = ({ value, onValueChange, disabled }: Props) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className={cn('w-full pl-3 text-left font-normal', !value && 'text-muted-foreground')}
          disabled={disabled}
        >
          <div className="flex-between w-full">
            {value ? dayjs(value).format('DD/MM/YYYY HH:mm') : <span>dd/MM/YYYY HH:mm</span>}
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
          />
          <div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
            <ScrollArea className="w-64 bg-white sm:h-full sm:w-auto">
              <div className="flex p-2 sm:flex-col">
                {Array.from({ length: 24 }, (_, i) => i)
                  .reverse()
                  .map((hour) => (
                    <Button
                      key={hour}
                      type="button"
                      size="icon"
                      variant={value && value.getHours() === hour ? 'default' : 'ghost'}
                      className="aspect-square shrink-0 sm:w-full"
                      onClick={() => {
                        let newDate = value ? new Date(value) : new Date();
                        const newHour = parseInt(hour.toString(), 10);
                        newDate.setHours(newHour);
                        onValueChange(newDate);
                      }}
                    >
                      {hour}
                    </Button>
                  ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 bg-white sm:h-full sm:w-auto">
              <div className="flex p-2 sm:flex-col">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    type="button"
                    variant={value && value.getMinutes() === minute ? 'default' : 'ghost'}
                    className="aspect-square shrink-0 sm:w-full"
                    onClick={() => {
                      let newDate = value ? new Date(value) : new Date();
                      const newMinute = parseInt(minute.toString(), 10);
                      newDate.setMinutes(newMinute);
                      onValueChange(newDate);
                    }}
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
export default DatetimePicker;
