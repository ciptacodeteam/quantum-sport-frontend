'use client';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupButton, InputGroupText } from '@/components/ui/input-group';
import { PasswordInput } from '@/components/ui/password-input';
import { formatPhone } from '@/lib/utils';
import {
  checkAccountMutationOptions,
  forgotPasswordMutationOptions,
  loginMutationOptions
} from '@/mutations/auth';
import useAuthStore from '@/stores/useAuthStore';
import useAuthRedirectStore from '@/stores/useAuthRedirectStore';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconRefresh } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const formSchema = z.object({
  phone: z.string().min(1, 'Phone number is required').max(15, 'Phone number is too long'),
  password: z.string().optional()
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  onRegisterClick?: () => void;
  openVerifyPhoneOtpModal?: () => void;
  onLoginSuccess?: () => void;
};

const LoginForm = ({ onRegisterClick, openVerifyPhoneOtpModal, onLoginSuccess }: Props) => {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
      password: ''
    }
  });

  const [isAccountExists, setIsAccountExists] = useState(false);
  const setRequestId = usePhoneStore((state) => state.setRequestId);
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
        if (err.errors?.name === 'ZodError') {
          const fieldErrors = err.errors.fields as Record<string, string>;
          Object.entries(fieldErrors).forEach(([fieldName, message]) => {
            form.setError(fieldName as keyof FormSchema, {
              type: 'server',
              message
            });
          });
        }
      }
    })
  );

  const { mutate: forgotPassword, isPending: isForgotPasswordPending } = useMutation(
    forgotPasswordMutationOptions({
      onSuccess: (res) => {
        const requestId = res?.data?.requestId;
        const phone = res?.data?.phone;

        if (!phone) {
          toast.error('Failed to get phone number. Please try again later.');
          return;
        }

        setPhone(phone);

        if (requestId) {
          setRequestId(requestId);
          openVerifyPhoneOtpModal?.();
        } else {
          toast.error('Failed to get Request ID. Please try again later.');
        }
      },
      onError: (err) => {
        if (err.errors?.name === 'ZodError') {
          const fieldErrors = err.errors.fields as Record<string, string>;
          Object.entries(fieldErrors).forEach(([fieldName, message]) => {
            form.setError(fieldName as keyof FormSchema, {
              type: 'server',
              message
            });
          });
        }
      }
    })
  );

  const queryClient = useQueryClient();
  const setToken = useAuthStore((state) => state.setToken);
  const consumeRedirectPath = useAuthRedirectStore((state) => state.consumeRedirectPath);

  const { mutate: login, isPending: isLoginPending } = useMutation(
    loginMutationOptions({
      queryClient: queryClient,
      onSuccess: (res) => {
        // Robust token extraction: check data.token first, then fallback to root token property
        const token = res?.data?.token || (res as any)?.token;

        console.log('Login response:', res); // Debug log

        if (!token) {
          console.error('Login successful but no token found in response:', res);
          toast.error('Login failed. Please try again.');
          return;
        }

        setToken(token);
        form.reset();
        const redirectPath = consumeRedirectPath();
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.refresh();
        }
        onLoginSuccess?.();
      },
      onError: (err) => {
        console.error('Login error:', err);
        if (err.errors?.name === 'ZodError') {
          const fieldErrors = err.errors.fields as Record<string, string>;
          Object.entries(fieldErrors).forEach(([fieldName, message]) => {
            form.setError(fieldName as keyof FormSchema, {
              type: 'server',
              message
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

  const handleForgotPassword = () => {
    if (!form.getValues('phone')) {
      form.setError('phone', {
        message: 'Phone number is required to reset password',
        type: 'manual'
      });
      return;
    }

    const phone = formatPhone(form.getValues('phone'));
    forgotPassword({ phone });
  };

  return (
    <form className="p-0 md:p-8 md:pb-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <header className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-lg font-bold md:text-2xl">Welcome back</h1>
            <p className="text-muted-foreground text-sm text-balance md:text-base">
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
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <button
                  onClick={handleForgotPassword}
                  disabled={isForgotPasswordPending}
                  type="button"
                  className="ml-auto inline-block"
                >
                  <span className="cursor-pointer text-sm underline-offset-4 hover:underline">
                    {isForgotPasswordPending ? 'Processing...' : 'Forgot Password?'}
                  </span>
                </button>
              </div>
              <PasswordInput
                id="password"
                {...form.register('password')}
                placeholder="Enter your password"
              />
              <FieldError>{form.formState.errors.password?.message}</FieldError>
            </Field>
          )}
          <Field className="mt-2">
            <Button
              type="submit"
              loading={isCheckAccountPending || isLoginPending || isForgotPasswordPending}
            >
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
