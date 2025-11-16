'use client';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { SUPPORT_CIPTACODE_PHONE_NUMBER } from '@/lib/constants';
import { getWhatsappMessageUrl } from '@/lib/utils';
import { adminLoginMutationOptions } from '@/mutations/admin/auth';
import useAuthStore from '@/stores/useAuthStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const formSchema = z.object({
  email: z.email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type FormSchema = z.infer<typeof formSchema>;

const LoginForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);

  const { mutate, isPending } = useMutation(
    adminLoginMutationOptions({
      onSuccess: (res) => {
        const token = res?.data?.token;

        if (!token) {
          toast.error('Login failed: No token received.');
          return;
        }

        setToken(token);
        form.reset();
        router.push('/admin/dashboard');
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
    mutate(formData);
  };

  return (
    <form className="p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <header className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground text-balance">Login to Quantum Sport account</p>
          </header>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder="e.g. email@example.com"
            />
            <FieldError>{form.formState.errors.email?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput
              id="password"
              {...form.register('password')}
              placeholder="Your password"
            />
            <FieldError>{form.formState.errors.password?.message}</FieldError>
          </Field>
          <Field className="mt-2">
            <Button type="submit" loading={isPending}>
              Login
            </Button>
          </Field>
          <p className="text-muted-foreground text-center text-sm">
            Have trouble logging in?{' '}
            <Link
              href={getWhatsappMessageUrl(
                SUPPORT_CIPTACODE_PHONE_NUMBER,
                'Halo Ciptacode, saya mengalami kesulitan saat login pada Admin Dashboard (Quantum Sport). Bisa tolong bantu saya? Terima kasih!'
              )}
              className="hidden underline lg:inline"
            >
              Contact support.
            </Link>
          </p>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default LoginForm;
