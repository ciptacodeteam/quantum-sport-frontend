'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

const PasswordInput = ({ className, ...props }: InputProps) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const disabled = props.value === '' || props.value === undefined || props.disabled;

  return (
    <div className="relative">
      <Input
        className={cn('hide-password-toggle pr-10', className)}
        {...props}
        type={showPassword ? 'text' : 'password'}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword((prev) => !prev)}
        disabled={disabled}
      >
        {showPassword && !disabled ? (
          <IconEye className="text-muted-foreground size-5" aria-hidden="true" />
        ) : (
          <IconEyeOff className="text-muted-foreground size-5" aria-hidden="true" />
        )}
        <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
      </Button>
    </div>
  );
};

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
