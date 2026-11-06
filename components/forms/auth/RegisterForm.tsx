'use client';

import { mapApiErrorsToForm } from '@/lib/api-error';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupText } from '@/components/ui/input-group';
import { formatPhone } from '@/lib/utils';
import { sendPhoneOtpMutationOptions } from '@/mutations/phone';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { useRegisterStore } from '@/stores/useRegisterStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';
import AuthFormHeader from './AuthFormHeader';

const formSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'Nama depan wajib diisi')
    .max(50, 'Nama depan maksimal 50 karakter'),
  lastName: z.string().trim().max(49, 'Nama belakang maksimal 49 karakter'),
  phone: z.string().min(1, 'WhatsApp Number is required').max(15, 'WhatsApp Number is too long')
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  onRegisterSuccess?: () => void;
  onLoginClick?: () => void;
};

const RegisterForm = ({ onRegisterSuccess, onLoginClick }: Props) => {
  const phone = usePhoneStore((state) => state.phone);
  const registrationMode = usePhoneStore((state) => state.registrationMode);
  const activation = registrationMode === 'activate';

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: phone && phone.startsWith('+62') ? phone.replace(/^\+62/, '') : phone || '',
      firstName: '',
      lastName: ''
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
        const details = (err as { errors?: { nextAction?: string } })?.errors;
        if (details?.nextAction === 'LOGIN') {
          onLoginClick?.();
          return;
        }
        mapApiErrorsToForm(form, err);
      }
    })
  );

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    const formatedPhone = formatPhone(formData.phone);
    setPhone(formatedPhone);
    setRegisterData({
      name: [formData.firstName, formData.lastName].filter(Boolean).join(' '),
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formatedPhone
    });
    mutate({ phone: formatedPhone, purpose: 'REGISTER' });
  };

  return (
    <form className="p-0" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <AuthFormHeader
            title={activation ? 'Aktivasi akun walk-in' : 'Start your game.'}
            description={
              activation
                ? 'Verifikasi nomor WhatsApp, lalu buat password. Riwayat booking Anda tetap terhubung.'
                : 'Create your account. Find your court. Make your next move.'
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="firstName">Nama depan</FieldLabel>
              <Input
                id="firstName"
                autoComplete="given-name"
                {...form.register('firstName')}
                placeholder="Contoh: John"
              />
              <FieldError>{form.formState.errors.firstName?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="lastName">Nama belakang (opsional)</FieldLabel>
              <Input
                id="lastName"
                autoComplete="family-name"
                {...form.register('lastName')}
                placeholder="Contoh: Doe"
              />
              <FieldError>{form.formState.errors.lastName?.message}</FieldError>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="phone">Nomor WhatsApp</FieldLabel>
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
          <Field className="mt-2">
            <Button type="submit" loading={isPending}>
              {activation ? 'Lanjut verifikasi WhatsApp' : 'Register'}
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
