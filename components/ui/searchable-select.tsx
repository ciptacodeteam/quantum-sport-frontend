'use client';

import { useId, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from './command';

export type SearchableSelectOption = {
  value: string;
  label: string;
  description?: string;
  keywords?: string[];
};

export function SearchableSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Pilih opsi',
  searchPlaceholder = 'Cari...',
  emptyMessage = 'Tidak ada hasil yang sesuai.',
  searchable = true,
  disabled = false,
  required = false,
  className
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  searchable?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const listId = useId();
  const selected = options.find((option) => option.value === value);
  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery('');
  };
  return (
    <Popover open={open && !disabled} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open && !disabled}
          aria-controls={listId}
          aria-haspopup="listbox"
          aria-required={required || undefined}
          disabled={disabled}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              changeOpen(true);
            }
          }}
          className={cn(
            'bg-background h-12 w-full min-w-0 justify-between gap-3 rounded-lg px-4 text-left text-sm font-normal shadow-xs',
            className
          )}
        >
          <span className={cn('min-w-0 truncate', !selected && 'text-muted-foreground')}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] rounded-xl p-1.5 shadow-lg"
      >
        <Command className="rounded-lg bg-transparent [&_[data-slot=command-input-wrapper]]:h-12 [&_[data-slot=command-input-wrapper]]:px-3">
          {searchable && (
            <CommandInput
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={setQuery}
            />
          )}
          <CommandList
            id={listId}
            aria-label="Pilihan tersedia"
            className="max-h-64 overscroll-contain py-1"
          >
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="space-y-1 p-0">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.label, option.description ?? '', ...(option.keywords ?? [])]}
                  onSelect={() => {
                    onValueChange(option.value);
                    changeOpen(false);
                  }}
                  className="data-[selected=true]:bg-primary/5 min-h-11 cursor-pointer gap-3 rounded-lg px-3 py-3"
                >
                  <Check
                    aria-hidden="true"
                    className={cn(
                      'text-primary size-4 shrink-0',
                      option.value === value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm leading-relaxed font-medium break-words">
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="text-muted-foreground mt-1 block text-xs leading-relaxed break-words">
                        {option.description}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
