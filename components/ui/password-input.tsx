'use client';

import * as React from 'react';

import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { InputGroup, InputGroupButton } from './input-group';

const PasswordInput = ({ className, ...props }: InputProps) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <InputGroup className="w-full">
      <Input
        className={cn(
          'hide-password-toggle rounded-r-none border-r-0 pr-10 shadow-none',
          className
        )}
        {...props}
        type={showPassword ? 'text' : 'password'}
      />
      <InputGroupButton
        type="button"
        variant="ghost"
        size="sm"
        className="z-30 cursor-pointer rounded-full border-l-0 p-0 hover:bg-transparent"
        onClick={() => setShowPassword((prev) => !prev)}
      >
        {showPassword ? (
          <IconEye className="text-muted-foreground size-5" aria-hidden="true" />
        ) : (
          <IconEyeOff className="text-muted-foreground size-5" aria-hidden="true" />
        )}
        <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
      </InputGroupButton>
    </InputGroup>
  );
};

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
