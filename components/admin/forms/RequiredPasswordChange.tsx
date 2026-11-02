'use client';

import { changePasswordApi } from '@/api/admin/auth';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { clearAdminSessionCookie } from '@/lib/admin-session';
import { mapApiErrorsToForm } from '@/lib/api-error';
import useAuthStore from '@/stores/useAuthStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z
  .object({
    currentPassword: z.string().min(6, 'Masukkan kata sandi sementara Anda.'),
    newPassword: z.string().min(12, 'Gunakan minimal 12 karakter.').max(100),
    confirmNewPassword: z.string().min(1, 'Konfirmasi kata sandi baru.')
  })
  .refine((value) => value.newPassword === value.confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'Konfirmasi kata sandi tidak cocok.'
  });

export default function RequiredPasswordChange() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    }
  });
  const { mutate, isPending } = useMutation({
    mutationFn: changePasswordApi,
    onSuccess: () => {
      form.reset();
      clearAdminSessionCookie();
      useAuthStore.getState().logout();
      queryClient.clear();
      toast.success('Kata sandi diperbarui. Silakan login kembali.');
      router.replace('/admin/auth/login');
    },
    onError: (error) => {
      mapApiErrorsToForm(form, error);
      toast.error('Gagal mengganti kata sandi. Periksa isian Anda.');
    }
  });

  return (
    <main className="bg-muted flex min-h-dvh items-center justify-center p-6">
      <form
        className="bg-background w-full max-w-md space-y-5 rounded-xl border p-6"
        onSubmit={form.handleSubmit((values) => mutate(values))}
      >
        <h1 className="text-xl font-semibold">Ganti kata sandi sementara</h1>
        <p className="text-muted-foreground text-sm">
          Kata sandi Anda telah direset. Buat kata sandi pribadi sebelum mengakses dashboard.
        </p>
        <Field>
          <FieldLabel htmlFor="temporary-password">Kata sandi sementara</FieldLabel>
          <PasswordInput
            id="temporary-password"
            autoComplete="current-password"
            {...form.register('currentPassword')}
          />
          <FieldError>{form.formState.errors.currentPassword?.message}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="new-password">Kata sandi baru</FieldLabel>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            {...form.register('newPassword')}
          />
          <FieldError>{form.formState.errors.newPassword?.message}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">Konfirmasi kata sandi baru</FieldLabel>
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            {...form.register('confirmNewPassword')}
          />
          <FieldError>{form.formState.errors.confirmNewPassword?.message}</FieldError>
        </Field>
        <Button type="submit" loading={isPending} className="w-full">
          Simpan kata sandi baru
        </Button>
      </form>
    </main>
  );
}
