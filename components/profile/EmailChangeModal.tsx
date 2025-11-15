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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendEmailOtpMutationOptions, verifyEmailOtpMutationOptions } from '@/mutations/email';
import { useResendCountdown } from '@/hooks/useResendCountdown';
import { profileQueryOptions } from '@/queries/profile';
import { updateProfileApi } from '@/api/auth';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address')
});

const otpSchema = z.object({
  otp: z.string().min(1, 'OTP is required').length(6, 'OTP must be 6 digits')
});

type EmailFormData = z.infer<typeof emailSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

type Props = {
  open: boolean;
  email: string | null | undefined;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function EmailChangeModal({ open, email, onOpenChange, onSuccess }: Props) {
  const qc = useQueryClient();
  const [otpSent, setOtpSent] = useState(false);
  const cooldown = useResendCountdown({ seconds: 60, persistKey: 'email-otp-cd' });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: email || ''
    }
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: ''
    }
  });

  useEffect(() => {
    if (email) {
      emailForm.setValue('email', email);
    }
  }, [email, emailForm]);

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: async (payload: { email: string }) => {
      const form = new FormData();
      form.append('email', payload.email);
      return updateProfileApi(form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update email')
  });

  const { mutate: sendOtp, isPending: isSending } = useMutation(
    sendEmailOtpMutationOptions({
      onSuccess: () => {
        cooldown.start();
        setOtpSent(true);
        toast.success('OTP sent to email');
      }
    })
  );

  const { mutate: verifyOtp, isPending: isVerifying } = useMutation(
    verifyEmailOtpMutationOptions({
      onSuccess: () => {
        toast.success('Email verified');
        qc.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
        otpForm.reset();
        setOtpSent(false);
        onOpenChange(false);
        onSuccess?.();
      }
    })
  );

  const handleEmailSubmit = (data: EmailFormData) => {
    updateProfile({ email: data.email });
    sendOtp({ email: data.email });
  };

  const handleOtpSubmit = (data: OtpFormData) => {
    const email = emailForm.getValues('email');
    verifyOtp({ email, otp: data.otp });
  };

  const handleResendOtp = () => {
    if (cooldown.isCoolingDown) return;
    const email = emailForm.getValues('email');
    sendOtp({ email });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          emailForm.reset();
          otpForm.reset();
          setOtpSent(false);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Email</DialogTitle>
          <DialogDescription>Update and verify your email address</DialogDescription>
        </DialogHeader>
        {!otpSent ? (
          <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email-input">New Email</FieldLabel>
                <Input id="email-input" type="email" {...emailForm.register('email')} />
                {emailForm.formState.errors.email && (
                  <FieldError>{emailForm.formState.errors.email.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
            <Button
              type="submit"
              loading={isUpdating || isSending}
              disabled={isUpdating || isSending}
            >
              Save & Send OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email-otp">OTP</FieldLabel>
                <Input id="email-otp" {...otpForm.register('otp')} maxLength={6} />
                {otpForm.formState.errors.otp && (
                  <FieldError>{otpForm.formState.errors.otp.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendOtp}
                disabled={cooldown.isCoolingDown || isSending}
              >
                {cooldown.isCoolingDown ? `Resend (${cooldown.label})` : 'Resend OTP'}
              </Button>
              <Button type="submit" loading={isVerifying} disabled={isVerifying}>
                Verify Email
              </Button>
            </div>
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
