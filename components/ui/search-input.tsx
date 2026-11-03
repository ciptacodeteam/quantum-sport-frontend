'use client';

import { Search } from 'lucide-react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function SearchInput({
  className,
  containerClassName,
  ...props
}: InputProps & { containerClassName?: string }) {
  return (
    <div className={cn('relative w-full min-w-0', containerClassName)}>
      <Search
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
      />
      <Input {...props} className={cn('pl-10', className)} />
    </div>
  );
}
