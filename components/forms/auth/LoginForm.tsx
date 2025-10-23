'use client';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupButton, InputGroupText } from '@/components/ui/input-group';
import { PasswordInput } from '@/components/ui/password-input';
import { formatPhone } from '@/lib/utils';
import { checkAccountMutationOptions, loginMutationOptions } from '@/mutations/auth';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconRefresh } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  phone: z.string().min(1, 'Phone number is required').max(15, 'Phone number is too long'),
  password: z.string().optional()
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  onRegisterClick?: () => void;
  onLoginSuccess?: () => void;
};

const LoginForm = ({ onRegisterClick, onLoginSuccess }: Props) => {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
      password: ''
    }
  });

  const [isAccountExists, setIsAccountExists] = useState(false);
  const setPhone = usePhoneStore((state) => state.setPhone);

  const { mutate: checkAccount, isPending: isCheckAccountPending } = useMutation(
    checkAccountMutationOptions({
      onSuccess: (res) => {
        const accountExists = res?.data?.exists || false;

        if (accountExists) {
          setIsAccountExists(true);
        } else {
          setPhone(res?.data?.phone || '');
          onRegisterClick?.();
        }
      },
      onError: (err) => {
        if (err.errors) {
          const fieldErrors = err.errors as z.ZodFlattenedError<FormSchema>;
          Object.entries(fieldErrors).forEach(([fieldName, error]) => {
            form.setError(fieldName as keyof FormSchema, {
              type: 'server',
              message: Array.isArray(error) ? error.join(', ') : String(error)
            });
          });
        }
      }
    })
  );

  const queryClient = useQueryClient();

  const { mutate: login, isPending: isLoginPending } = useMutation(
    loginMutationOptions({
      queryClient: queryClient,
      onSuccess: () => {
        form.reset();
        router.refresh();
        onLoginSuccess?.();
      },
      onError: (err) => {
        if (err.errors) {
          const fieldErrors = err.errors as z.ZodFlattenedError<FormSchema>;
          Object.entries(fieldErrors).forEach(([fieldName, error]) => {
            form.setError(fieldName as keyof FormSchema, {
              type: 'server',
              message: Array.isArray(error) ? error.join(', ') : String(error)
            });
          });
        }
      }
    })
  );

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    const formatedPhone = formatPhone(formData.phone);

    setPhone(formatedPhone);
    if (isAccountExists) {
      if (!formData.password || formData.password.trim() === '') {
        form.setError('password', {
          type: 'manual',
          message: 'Password is required'
        });
        return;
      }

      login({
        phone: formatedPhone,
        password: formData.password
      });
    } else {
      checkAccount({ phone: formatedPhone });
    }
  };

  return (
    <form className="p-6 md:p-8 md:pb-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <header className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground text-balance">
              Please login to your Quantum Sport account.
            </p>
          </header>
          <Field>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <InputGroup>
              <InputGroupText className="px-3">+62</InputGroupText>
              <Input
                id="phone"
                type="tel"
                disabled={isAccountExists}
                {...form.register('phone')}
                placeholder="e.g. 81234567890"
                onBlur={(e) => {
                  const val = e.target.value ?? '';
                  if (val.startsWith('0')) {
                    const newVal = val.replace(/^0/, '');
                    e.currentTarget.value = newVal;
                    form.setValue('phone', newVal, { shouldDirty: true, shouldTouch: true });
                  }
                }}
                onBeforeInput={(e) => {
                  const char = e.data;
                  if (char && !/[\d\s]/.test(char)) {
                    e.preventDefault();
                  }
                }}
              />
              {isAccountExists && (
                <InputGroupButton onClick={() => setIsAccountExists(false)}>
                  <IconRefresh />
                </InputGroupButton>
              )}
            </InputGroup>
            <FieldError>{form.formState.errors.phone?.message}</FieldError>
          </Field>
          {isAccountExists && (
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PasswordInput
                id="password"
                {...form.register('password')}
                placeholder="Enter your password"
              />
              <FieldError>{form.formState.errors.password?.message}</FieldError>
            </Field>
          )}
          <Field className="mt-2">
            <Button type="submit" loading={isCheckAccountPending || isLoginPending}>
              {isAccountExists ? 'Login' : 'Continue'}
            </Button>
          </Field>
          {!!onRegisterClick && (
            <p className="text-muted-foreground text-center text-sm">
              Don&apos;t have an account?{' '}
              <span
                className="text-primary cursor-pointer font-medium underline"
                onClick={onRegisterClick}
              >
                Register
              </span>
            </p>
          )}
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default LoginForm;
