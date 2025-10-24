'use client';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupText } from '@/components/ui/input-group';
import { PasswordInput } from '@/components/ui/password-input';
import { formatPhone } from '@/lib/utils';
import { sendPhoneOtpMutationOptions } from '@/mutations/phone';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { useRegisterStore } from '@/stores/useRegisterStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    phone: z.string().min(1, 'Phone number is required').max(15, 'Phone number is too long'),
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
  onRegisterSuccess?: () => void;
  onLoginClick?: () => void;
};

const RegisterForm = ({ onRegisterSuccess, onLoginClick }: Props) => {
  const phone = usePhoneStore((state) => state.phone);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: phone && phone.startsWith('+62') ? phone.replace(/^\+62/, '') : phone || '',
      name: '',
      password: '',
      confirmPassword: ''
    }
  });

  const setPhone = usePhoneStore((state) => state.setPhone);
  const setRequestId = usePhoneStore((state) => state.setRequestId);
  const setRegisterData = useRegisterStore((state) => state.setRegisterData);

  const { mutate, isPending } = useMutation(
    sendPhoneOtpMutationOptions({
      onSuccess: (res) => {
        const requestId = res?.data?.requestId as string | undefined;
        if (requestId) setRequestId(requestId);
        form.reset();
        onRegisterSuccess?.();
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
    const formatedPhone = formatPhone(formData.phone);
    setPhone(formatedPhone);
    setRegisterData({
      name: formData.name,
      phone: formatedPhone,
      password: formData.password
    });
    mutate({
      ...formData,
      phone: formatedPhone
    });
  };

  return (
    <form className="p-0 md:p-8 md:pb-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <header className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-lg font-bold md:text-2xl">Create your account</h1>
            <p className="text-muted-foreground text-sm text-balance md:text-base">
              Please register to start using Quantum Sport.
            </p>
          </header>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" {...form.register('name')} placeholder="e.g. John Doe" />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <InputGroup>
              <InputGroupText className="px-3">+62</InputGroupText>
              <Input
                id="phone"
                type="tel"
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
            </InputGroup>
            <FieldError>{form.formState.errors.phone?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
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
              Register
            </Button>
          </Field>
          {!!onLoginClick && (
            <p className="text-muted-foreground text-center text-sm">
              Already have an account?{' '}
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
export default RegisterForm;
