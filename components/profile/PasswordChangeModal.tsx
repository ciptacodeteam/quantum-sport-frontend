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

const verifyPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required')
});

const changePasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
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
            {step === 'verify' ? 'Verify Current Password' : 'Set New Password'}
          </DialogTitle>
          <DialogDescription>
            {step === 'verify'
              ? 'Enter your current password to continue.'
              : 'Choose a strong new password.'}
          </DialogDescription>
        </DialogHeader>
        {step === 'verify' ? (
          <form onSubmit={verifyForm.handleSubmit(handleVerifySubmit)} className="space-y-4">
            {!userEmail && (
              <p className="text-destructive text-sm">Email is required to verify password.</p>
            )}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="currentPwd">Current Password</FieldLabel>
                <Input
                  id="currentPwd"
                  type="password"
                  {...verifyForm.register('currentPassword')}
                />
                {verifyForm.formState.errors.currentPassword && (
                  <FieldError>{verifyForm.formState.errors.currentPassword.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
            <Button type="submit" loading={isVerifying} disabled={isVerifying}>
              Verify Password
            </Button>
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
                <Input
                  id="confirmPwd"
                  type="password"
                  {...changeForm.register('confirmPassword')}
                />
                {changeForm.formState.errors.confirmPassword && (
                  <FieldError>{changeForm.formState.errors.confirmPassword.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
            <Button type="submit" loading={isChanging} disabled={isChanging}>
              Change Password
            </Button>
          </form>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
