'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  requestEmailChangeMutationOptions,
  verifyEmailChangeMutationOptions
} from '@/mutations/email';
import { profileQueryOptions } from '@/queries/profile';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ResendOtpButton } from '../buttons/ResendOtpButton';

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
  const [codeSent, setCodeSent] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

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

  const { mutate: requestChange, isPending: isRequesting } = useMutation(
    requestEmailChangeMutationOptions({
      onSuccess: (data) => {
        setCodeSent(true);
        setRequestId(data.data?.requestId || data.requestId || null);
      }
    })
  );

  const { mutate: verifyChange, isPending: isVerifying } = useMutation(
    verifyEmailChangeMutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
        otpForm.reset();
        setCodeSent(false);
        setRequestId(null);
        onOpenChange(false);
        onSuccess?.();
      }
    })
  );

  const handleEmailSubmit = (data: EmailFormData) => {
    requestChange({ newEmail: data.email });
  };

  const handleOtpSubmit = useCallback(
    (data: OtpFormData) => {
      if (!requestId) return;
      verifyChange({ requestId, code: data.otp });
    },
    [requestId, verifyChange]
  );

  const handleResendCode = () => {
    const newEmail = emailForm.getValues('email');
    requestChange({ newEmail });
  };

  useEffect(() => {
    const subscription = otpForm.watch((value) => {
      const otp = (value as { otp?: string })?.otp;
      if (otp && otp.length === 6) {
        otpForm.handleSubmit(handleOtpSubmit)();
      }
    });
    return () => subscription.unsubscribe();
  }, [otpForm, handleOtpSubmit]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          emailForm.reset();
          otpForm.reset();
          setCodeSent(false);
          setRequestId(null);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent>
        {!codeSent ? (
          <>
            <DialogHeader>
              <DialogTitle>{!!email ? 'Ubah' : 'Tambah'} Email</DialogTitle>
              <DialogDescription>
                {!codeSent
                  ? 'Masukkan alamat email baru Anda. Kode verifikasi akan dikirim.'
                  : 'Masukkan kode 6 digit yang dikirim ke alamat email baru Anda.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email-input">Alamat Email Baru</FieldLabel>
                    <Input
                      id="email-input"
                      type="email"
                      placeholder="e.g. mark@example.com"
                      {...emailForm.register('email')}
                    />
                    {emailForm.formState.errors.email && (
                      <FieldError>{emailForm.formState.errors.email.message}</FieldError>
                    )}
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Batal
                  </Button>
                  <Button type="submit" loading={isRequesting} disabled={isRequesting}>
                    Konfirmasi
                  </Button>
                </DialogFooter>
              </FieldSet>
            </form>
          </>
        ) : (
          <form className="py-6 md:p-8" onSubmit={otpForm.handleSubmit(handleOtpSubmit)}>
            <FieldSet>
              <FieldGroup>
                <Field>
                  <div className="flex-center flex-col gap-4">
                    <header className="flex-center flex-col gap-4">
                      <Mail className="text-primary size-10" />
                      <FieldLabel htmlFor="otp" className="max-w-xs text-center leading-relaxed">
                        Masukkan OTP yang dikirim ke alamat email Anda
                        <br /> {emailForm.getValues('email')}
                      </FieldLabel>
                    </header>
                    <Controller
                      name="otp"
                      control={otpForm.control}
                      defaultValue=""
                      disabled={isVerifying}
                      render={({ field }) => (
                        <InputOTP
                          maxLength={6}
                          value={field.value}
                          onChange={(value) => field.onChange(value)}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} className="size-14 md:text-xl" />
                            <InputOTPSlot index={1} className="size-14 md:text-xl" />
                            <InputOTPSlot index={2} className="size-14 md:text-xl" />
                            <InputOTPSlot index={3} className="size-14 md:text-xl" />
                            <InputOTPSlot index={4} className="size-14 md:text-xl" />
                            <InputOTPSlot index={5} className="size-14 md:text-xl" />
                          </InputOTPGroup>
                        </InputOTP>
                      )}
                    />
                    <FieldError>{otpForm.formState.errors.otp?.message}</FieldError>
                    <div className="mt-2">
                      <ResendOtpButton
                        onSendOtp={handleResendCode}
                        seconds={process.env.NODE_ENV === 'development' ? 5 : 60}
                        persistKey="otp:change-email"
                        autoStart
                      />
                    </div>
                  </div>
                </Field>
              </FieldGroup>
            </FieldSet>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
