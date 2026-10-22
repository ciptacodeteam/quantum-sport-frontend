'use client';

import { mapApiErrorsToForm } from '@/lib/api-error';

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
import AuthFormHeader from './AuthFormHeader';

const formSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    phone: z.string().min(1, 'WhatsApp Number is required').max(15, 'WhatsApp Number is too long'),
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
        mapApiErrorsToForm(form, err);
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
    <form className="p-0" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <AuthFormHeader
            title="Join the club."
            description="Create your account. Find your court. Make your next move."
          />
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" {...form.register('name')} placeholder="e.g. John Doe" />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">WhatsApp Number</FieldLabel>
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
            <p className="border-t border-black/10 pt-5 text-center text-sm text-black/50">
              Already have an account?{' '}
              <button
                type="button"
                className="cursor-pointer font-medium text-[#ad422b] underline underline-offset-4 hover:text-black"
                onClick={onLoginClick}
              >
                Login
              </button>
            </p>
          )}
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default RegisterForm;
