import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'ghost';
}

const CardInput = React.forwardRef<HTMLInputElement, CardInputProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <input
        {...props}
        ref={ref}
        className={cn(
          'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 font-mono text-base tracking-widest focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          variant === 'ghost' &&
            'border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0',
          className
        )}
      />
    );
  }
);

CardInput.displayName = 'CardInput';

export { CardInput };
