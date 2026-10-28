'use client';

import { mapApiErrorsToForm } from '@/lib/api-error';

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
import AuthFormHeader from './AuthFormHeader';

const formSchema = z.object({
  phone: z.string().min(1, 'WhatsApp Number is required').max(15, 'WhatsApp Number is too long'),
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
        mapApiErrorsToForm(form, err);
      }
    })
  );

  const { mutate: forgotPassword, isPending: isForgotPasswordPending } = useMutation(
    forgotPasswordMutationOptions({
      onSuccess: (res) => {
        const requestId = res?.data?.requestId;
        const phone = res?.data?.phone;

        if (!phone) {
          toast.error('Failed to get WhatsApp Number. Please try again later.');
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
        mapApiErrorsToForm(form, err);
      }
    })
  );

  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const consumeRedirectPath = useAuthRedirectStore((state) => state.consumeRedirectPath);

  const { mutate: login, isPending: isLoginPending } = useMutation(
    loginMutationOptions({
      queryClient: queryClient,
      onSuccess: (res) => {
        const token = res?.data?.token || (res as { token?: string })?.token;

        if (!token && res?.success !== true) {
          toast.error('Login failed. Please try again.');
          return;
        }

        setAuth(true);
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
        mapApiErrorsToForm(form, err);
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
        message: 'WhatsApp Number is required to reset password',
        type: 'manual'
      });
      return;
    }

    const phone = formatPhone(form.getValues('phone'));
    forgotPassword({ phone });
  };

  return (
    <form className="p-0" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <AuthFormHeader
            title="Welcome back."
            description="Log in to book your court and get back in the game."
          />
          <Field>
            <FieldLabel htmlFor="phone">WhatsApp Number</FieldLabel>
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
            <p className="border-t border-black/10 pt-5 text-center text-sm text-black/50">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="cursor-pointer font-medium text-[#ad422b] underline underline-offset-4 hover:text-black"
                onClick={onRegisterClick}
              >
                Register
              </button>
            </p>
          )}
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default LoginForm;
