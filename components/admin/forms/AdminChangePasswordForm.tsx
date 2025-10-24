'use client';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { adminChangePasswordMutationOptions } from '@/mutations/admin/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

export const formSchema = z.object({
  currentPassword: z.string().min(6).max(32),
  newPassword: z.string().min(6).max(32),
  confirmNewPassword: z.string().min(6).max(32)
});
//   .refine((data) => data.password === data.confirmPassword, {
//     message: 'Passwords do not match',
//     path: ['confirmPassword']
//   });

type FormSchema = z.infer<typeof formSchema>;

const AdminChangePasswordForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    }
  });

  const { mutate, isPending } = useMutation(
    adminChangePasswordMutationOptions({
      onSuccess: () => {
        form.reset();
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

  const onSubmit: SubmitHandler<FormSchema> = (data) => {
    mutate(data);
  };

  const isSaving = isPending || form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
            <PasswordInput
              id="currentPassword"
              {...form.register('currentPassword')}
              placeholder="Enter your current password"
            />
            <FieldError>{form.formState.errors.currentPassword?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
            <PasswordInput
              id="newPassword"
              {...form.register('newPassword')}
              placeholder="Enter your new password"
            />
            <FieldError>{form.formState.errors.newPassword?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmNewPassword">Confirm New Password</FieldLabel>
            <PasswordInput
              id="confirmNewPassword"
              {...form.register('confirmNewPassword')}
              placeholder="Confirm your new password"
            />
            <FieldError>{form.formState.errors.confirmNewPassword?.message}</FieldError>
          </Field>
          <Field className="mt-2">
            <Button type="submit" className="w-fit!" loading={isSaving}>
              Save Changes
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default AdminChangePasswordForm;
