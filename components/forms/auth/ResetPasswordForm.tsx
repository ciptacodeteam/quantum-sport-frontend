'use client';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { resetPasswordMutationOptions } from '@/mutations/auth';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const formSchema = z
  .object({
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .max(100, 'Password is too long'),
    confirmPassword: z
      .string()
      .min(6, 'Confirm Password must be at least 6 characters long')
      .max(100, 'Confirm Password is too long')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  onSuccess?: () => void;
  onLoginClick?: () => void;
};

const ResetPasswordForm = ({ onSuccess, onLoginClick }: Props) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const { mutate, isPending } = useMutation(
    resetPasswordMutationOptions({
      onSuccess: () => {
        form.reset();
        onSuccess?.();
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

  const requestId = usePhoneStore((state) => state.requestId);
  const phone = usePhoneStore((state) => state.phone);

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    if (!phone || !requestId) {
      toast.error('Session expired. Please try again.');
      return;
    }

    mutate({
      phone,
      requestId,
      newPassword: formData.password
    });
  };

  return (
    <form className="p-0 md:p-8 md:pb-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <header className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-lg font-bold md:text-2xl">Reset Your Password</h1>
            <p className="text-muted-foreground text-sm text-balance md:text-base">
              Please enter your new password below.
            </p>
          </header>
          <Field>
            <FieldLabel htmlFor="password">New Password</FieldLabel>
            <PasswordInput
              id="password"
              {...form.register('password')}
              placeholder="Enter your password"
            />
            <FieldError>{form.formState.errors.password?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
            <PasswordInput
              id="confirmPassword"
              {...form.register('confirmPassword')}
              placeholder="Confirm your password"
            />
            <FieldError>{form.formState.errors.confirmPassword?.message}</FieldError>
          </Field>
          <Field className="mt-2">
            <Button type="submit" loading={isPending}>
              Reset Password
            </Button>
          </Field>
          {!!onLoginClick && (
            <p className="text-muted-foreground text-center text-sm">
              Remembered your password?
              <span
                className="text-primary cursor-pointer font-medium underline"
                onClick={onLoginClick}
              >
                Login
              </span>
            </p>
          )}
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default ResetPasswordForm;
