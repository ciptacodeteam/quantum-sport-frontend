'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { loginMutationOptions, changePasswordMutationOptions } from '@/mutations/auth';
import { toast } from 'sonner';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PasswordInput } from '../ui/password-input';

const verifyPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Kata sandi saat ini diperlukan')
});

const changePasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'Kata sandi harus terdiri dari minimal 6 karakter'),
    confirmPassword: z.string().min(1, 'Harap konfirmasi kata sandi Anda')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Kata sandi tidak cocok',
    path: ['confirmPassword']
  });

type VerifyPasswordFormData = z.infer<typeof verifyPasswordSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

type Props = {
  open: boolean;
  userEmail: string | null | undefined;
  onOpenChange: (open: boolean) => void;
};

export default function PasswordChangeModal({ open, userEmail, onOpenChange }: Props) {
  const [step, setStep] = useState<'verify' | 'change'>('verify');

  const verifyForm = useForm<VerifyPasswordFormData>({
    resolver: zodResolver(verifyPasswordSchema),
    defaultValues: {
      currentPassword: ''
    }
  });

  const changeForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  });

  const { mutate: verifyCurrentPassword, isPending: isVerifying } = useMutation(
    loginMutationOptions({
      onSuccess: () => {
        setStep('change');
        toast.success('Password verified');
      }
    })
  );

  const { mutate: changePassword, isPending: isChanging } = useMutation(
    changePasswordMutationOptions({
      onSuccess: () => {
        verifyForm.reset();
        changeForm.reset();
        setStep('verify');
        onOpenChange(false);
        toast.success('Password changed');
      }
    })
  );

  const handleVerifySubmit = (data: VerifyPasswordFormData) => {
    if (!userEmail) {
      toast.error('No email on account');
      return;
    }
    verifyCurrentPassword({ email: userEmail, password: data.currentPassword });
  };

  const handleChangeSubmit = (data: ChangePasswordFormData) => {
    const currentPassword = verifyForm.getValues('currentPassword');
    changePassword({ currentPassword, newPassword: data.newPassword });
  };

  const close = (o: boolean) => {
    if (!o) {
      setStep('verify');
      verifyForm.reset();
      changeForm.reset();
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === 'verify' ? 'Verifikasi Kata Sandi Saat Ini' : 'Atur Kata Sandi Baru'}
          </DialogTitle>
          <DialogDescription>
            {step === 'verify'
              ? 'Masukkan kata sandi saat ini untuk melanjutkan.'
              : 'Pilih kata sandi baru yang kuat.'}
          </DialogDescription>
        </DialogHeader>
        {step === 'verify' ? (
          <form onSubmit={verifyForm.handleSubmit(handleVerifySubmit)} className="space-y-4">
            {!userEmail && (
              <p className="text-destructive text-sm">
                Tidak ada email yang terkait dengan akun ini. Tidak dapat memverifikasi kata sandi.
              </p>
            )}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="currentPwd">Kata Sandi Saat Ini</FieldLabel>
                <PasswordInput
                  id="currentPwd"
                  placeholder="Masukkan kata sandi saat ini"
                  {...verifyForm.register('currentPassword')}
                />
                {verifyForm.formState.errors.currentPassword && (
                  <FieldError>{verifyForm.formState.errors.currentPassword.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Tutup
              </Button>
              <Button type="submit" loading={isVerifying} disabled={isVerifying}>
                Konfirmasi
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={changeForm.handleSubmit(handleChangeSubmit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="newPwd">New Password</FieldLabel>
                <Input id="newPwd" type="password" {...changeForm.register('newPassword')} />
                {changeForm.formState.errors.newPassword && (
                  <FieldError>{changeForm.formState.errors.newPassword.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="confirmPwd">Confirm New Password</FieldLabel>
                <PasswordInput
                  id="confirmPwd"
                  placeholder="Masukkan ulang kata sandi baru Anda"
                  {...changeForm.register('confirmPassword')}
                />
                {changeForm.formState.errors.confirmPassword && (
                  <FieldError>{changeForm.formState.errors.confirmPassword.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Tutup
              </Button>
              <Button type="submit" loading={isChanging} disabled={isChanging}>
                Ubah Kata Sandi
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
