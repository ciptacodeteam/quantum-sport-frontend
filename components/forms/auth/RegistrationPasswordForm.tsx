'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from 'sonner';
import { registerMutationOptions } from '@/mutations/auth';
import { useRegisterStore } from '@/stores/useRegisterStore';
import { usePhoneStore } from '@/stores/usePhoneStore';
import useAuthStore from '@/stores/useAuthStore';
import useAuthRedirectStore from '@/stores/useAuthRedirectStore';
import { profileQueryOptions } from '@/queries/profile';
import { mapApiErrorsToForm } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import AuthFormHeader from './AuthFormHeader';
const schema = z
  .object({
    password: z.string().min(6, 'Password minimal 6 karakter').max(100),
    confirmPassword: z.string().min(6, 'Ulangi password Anda').max(100)
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Password tidak sama'
  });
export default function RegistrationPasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' }
  });
  const phone = usePhoneStore((state) => state.phone);
  const requestId = usePhoneStore((state) => state.requestId);
  const registrationToken = usePhoneStore((state) => state.registrationToken);
  const activation = usePhoneStore((state) => state.registrationMode) === 'activate';
  const registerData = useRegisterStore((state) => state.registerData);
  const client = useQueryClient();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const consumeRedirect = useAuthRedirectStore((state) => state.consumeRedirectPath);
  const { mutate, isPending } = useMutation(
    registerMutationOptions({
      onSuccess: (response) => {
        if (!response?.data?.token && response?.success !== true) {
          toast.error('Aktivasi belum berhasil. Silakan coba lagi.');
          return;
        }
        setAuth(true);
        const redirect = consumeRedirect();
        useRegisterStore.getState().clear();
        usePhoneStore.getState().setPhone(null);
        usePhoneStore.getState().setRequestId(null);
        onSuccess?.();
        void client.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
        router.push(redirect ?? '/');
      },
      onError: (error) => {
        mapApiErrorsToForm(form, error);
      }
    })
  );
  return (
    <form
      className="p-0"
      onSubmit={form.handleSubmit((values) => {
        if (!phone || !requestId || !registrationToken || !registerData) {
          toast.error('Verifikasi nomor WhatsApp terlebih dahulu.');
          return;
        }
        mutate({ ...registerData, phone, requestId, registrationToken, password: values.password });
      })}
    >
      <FieldSet>
        <FieldGroup>
          <AuthFormHeader
            title="Buat password"
            description="Nomor WhatsApp sudah diverifikasi. Buat password untuk mengakses akun dan riwayat booking Anda."
          />
          <Field>
            <FieldLabel htmlFor="registration-password">Password baru</FieldLabel>
            <PasswordInput
              id="registration-password"
              autoComplete="new-password"
              {...form.register('password')}
            />
            <FieldError>{form.formState.errors.password?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="registration-confirm-password">Konfirmasi password</FieldLabel>
            <PasswordInput
              id="registration-confirm-password"
              autoComplete="new-password"
              {...form.register('confirmPassword')}
            />
            <FieldError>{form.formState.errors.confirmPassword?.message}</FieldError>
          </Field>
          <Button type="submit" loading={isPending}>
            {activation ? 'Aktifkan akun' : 'Selesaikan pendaftaran'}
          </Button>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
