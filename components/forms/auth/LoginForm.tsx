'use client';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { sendLoginOtpMutationOptions } from '@/mutations/auth';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  phone: z.string().min(1, 'Phone number is required').max(15, 'Phone number is too long')
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  onLoginSuccess?: () => void;
};

const LoginForm = ({ onLoginSuccess }: Props) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: ''
    }
  });

  const setPhone = usePhoneStore((state) => state.setPhone);
  const setRequestId = usePhoneStore((state) => state.setRequestId);

  const { mutate, isPending } = useMutation(
    sendLoginOtpMutationOptions({
      onSuccess: (res) => {
        const requestId = res?.data?.requestId as string | undefined;
        if (requestId) setRequestId(requestId);
        form.reset();
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
    setPhone(formData.phone);
    mutate(formData);
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
            <Input
              id="phone"
              type="tel"
              {...form.register('phone')}
              placeholder="e.g. +6281234567890"
              onBeforeInput={(e) => {
                const char = e.data;
                if (char && !/[\d\s]/.test(char)) {
                  e.preventDefault();
                }
              }}
            />
            <FieldError>{form.formState.errors.phone?.message}</FieldError>
          </Field>
          <Field className="mt-2">
            <Button type="submit" loading={isPending}>
              Login
            </Button>
          </Field>
          <p className="text-muted-foreground text-center text-sm">
            Don&apos;t have an account?{' '}
            <span className="text-primary cursor-pointer font-medium underline">Register</span>
          </p>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default LoginForm;
