import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        secondaryInfo: 'bg-blue-500 text-white hover:bg-blue-600 focus-visible:ring-blue-300',
        secondarySuccess: 'bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-300',
        secondaryWarning:
          'bg-yellow-500 text-white hover:bg-yellow-600 focus-visible:ring-yellow-300',
        secondaryDanger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-300',
        lightInfo: 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus-visible:ring-blue-300',
        lightSuccess: 'bg-green-100 text-green-700 hover:bg-green-200 focus-visible:ring-green-300',
        lightWarning:
          'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 focus-visible:ring-yellow-300',
        lightDanger: 'bg-red-100 text-red-700 hover:bg-red-200 focus-visible:ring-red-300'
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': 'size-7',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, className }),
        loading && 'pointer-events-none cursor-wait'
      )}
      disabled={loading || props.disabled}
      aria-busy={loading}
      aria-disabled={loading || props.disabled}
      {...(loading && { 'aria-live': 'polite' })}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <Spinner />
          <div className="[&>svg]:hidden">{children || 'Please wait'}</div>
        </div>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
