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
import { sendPhoneOtpMutationOptions } from '@/mutations/phone';
import { verifyPhoneOtpMutationOptions } from '@/mutations/auth';
import { useResendCountdown } from '@/hooks/useResendCountdown';
import { profileQueryOptions } from '@/queries/profile';
import { updateProfileApi } from '@/api/auth';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const phoneSchema = z.object({
  phone: z.string().min(1, 'Phone number is required').max(15, 'Phone number is too long')
});

const otpSchema = z.object({
  otp: z.string().min(1, 'OTP is required').length(6, 'OTP must be 6 digits')
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

type Props = {
  open: boolean;
  phone: string | null | undefined;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function PhoneChangeModal({ open, phone, onOpenChange, onSuccess }: Props) {
  const qc = useQueryClient();
  const [otpSent, setOtpSent] = useState(false);
  const cooldown = useResendCountdown({ seconds: 60, persistKey: 'phone-otp-cd' });

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: phone || ''
    }
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: ''
    }
  });

  useEffect(() => {
    if (phone) {
      phoneForm.setValue('phone', phone);
    }
  }, [phone, phoneForm]);

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: async (payload: { phone: string }) => {
      const form = new FormData();
      form.append('phone', payload.phone);
      return updateProfileApi(form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update phone')
  });

  const { mutate: sendOtp, isPending: isSending } = useMutation(
    sendPhoneOtpMutationOptions({
      onSuccess: () => {
        cooldown.start();
        setOtpSent(true);
        toast.success('OTP sent to phone');
      }
    })
  );

  const { mutate: verifyOtp, isPending: isVerifying } = useMutation(
    verifyPhoneOtpMutationOptions({
      onSuccess: () => {
        toast.success('Phone verified');
        qc.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
        otpForm.reset();
        setOtpSent(false);
        onOpenChange(false);
        onSuccess?.();
      }
    })
  );

  const handlePhoneSubmit = (data: PhoneFormData) => {
    updateProfile({ phone: data.phone });
    sendOtp({ phone: data.phone });
  };

  const handleOtpSubmit = (data: OtpFormData) => {
    const phone = phoneForm.getValues('phone');
    verifyOtp({ phone, otp: data.otp });
  };

  const handleResendOtp = () => {
    if (cooldown.isCoolingDown) return;
    const phone = phoneForm.getValues('phone');
    sendOtp({ phone });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          phoneForm.reset();
          otpForm.reset();
          setOtpSent(false);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Phone</DialogTitle>
          <DialogDescription>Update and verify your phone number</DialogDescription>
        </DialogHeader>
        {!otpSent ? (
          <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="phone-input">New Phone</FieldLabel>
                <Input id="phone-input" type="tel" {...phoneForm.register('phone')} />
                {phoneForm.formState.errors.phone && (
                  <FieldError>{phoneForm.formState.errors.phone.message}</FieldError>
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
                <FieldLabel htmlFor="phone-otp">OTP</FieldLabel>
                <Input id="phone-otp" {...otpForm.register('otp')} maxLength={6} />
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
                Verify Phone
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
