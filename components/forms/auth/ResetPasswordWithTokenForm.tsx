'use client';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { resetPasswordWithTokenMutationOptions } from '@/mutations/auth';

const formSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
      .max(100, 'Password is too long'),
    confirmPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  token?: string;
};

const ResetPasswordWithTokenForm = ({ token }: Props) => {
  const [hasCompleted, setHasCompleted] = useState(false);
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  });

  const isTokenMissing = !token;

  const { mutate, isPending } = useMutation(
    resetPasswordWithTokenMutationOptions({
      onSuccess: () => {
        form.reset();
        setHasCompleted(true);
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

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    if (!token) {
      toast.error('Reset token is missing or invalid. Please request a new link.');
      return;
    }

    setHasCompleted(false);
    mutate({
      token,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword
    });
  };

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      {hasCompleted && (
        <Alert variant="success">
          <AlertTitle>Password updated</AlertTitle>
          <AlertDescription>
            You can now{' '}
            <Link href="/" className="text-primary font-medium underline underline-offset-4">
              return to the app
            </Link>{' '}
            and sign in with your new password.
          </AlertDescription>
        </Alert>
      )}

      {isTokenMissing && (
        <Alert variant="destructive">
          <AlertTitle>Invalid reset link</AlertTitle>
          <AlertDescription>
            This reset link is missing a valid token. Request a new password reset email and try
            again.
          </AlertDescription>
        </Alert>
      )}

      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="newPassword">New password</FieldLabel>
            <PasswordInput
              id="newPassword"
              {...form.register('newPassword')}
              placeholder="Enter your new password"
              disabled={isTokenMissing || isPending}
            />
            <FieldError>{form.formState.errors.newPassword?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
            <PasswordInput
              id="confirmPassword"
              {...form.register('confirmPassword')}
              placeholder="Re-enter your new password"
              disabled={isTokenMissing || isPending}
            />
            <FieldError>{form.formState.errors.confirmPassword?.message}</FieldError>
          </Field>

          <Field className="mt-2">
            <Button type="submit" loading={isPending} disabled={isTokenMissing}>
              Reset password
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};

export default ResetPasswordWithTokenForm;
