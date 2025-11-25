'use client';

import { updateProfileApi } from '@/api/auth';
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
import { InputGroup, InputGroupText } from '@/components/ui/input-group';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useResendCountdown } from '@/hooks/useResendCountdown';
import { formatPhone } from '@/lib/utils';
import { verifyPhoneOtpMutationOptions } from '@/mutations/auth';
import { sendPhoneOtpMutationOptions } from '@/mutations/phone';
import { profileQueryOptions } from '@/queries/profile';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ResendOtpButton } from '../buttons/ResendOtpButton';

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
      phone: phone && phone.startsWith('+62') ? phone.replace(/^\+62/, '') : phone || ''
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
      phoneForm.setValue('phone', phone.startsWith('+62') ? phone.replace(/^\+62/, '') : phone);
    }
  }, [phone, phoneForm, open]);

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
    const formatted = formatPhone(data.phone);
    updateProfile({ phone: formatted });
    sendOtp({ phone: formatted });
  };

  const handleOtpSubmit = useCallback(
    (data: OtpFormData) => {
      const phoneVal = phoneForm.getValues('phone');
      const formatted = formatPhone(phoneVal);
      verifyOtp({ phone: formatted, otp: data.otp });
    },
    [phoneForm, verifyOtp]
  );

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
          <DialogTitle>Ubah Nomor Whatsapp</DialogTitle>
          <DialogDescription>Perbarui dan verifikasi nomor Whatsapp Anda</DialogDescription>
        </DialogHeader>
        {!otpSent ? (
          <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="phone-input">Nomor Whatsapp Baru</FieldLabel>
                  <InputGroup>
                    <InputGroupText className="px-3">+62</InputGroupText>
                    <Input
                      id="phone-input"
                      type="tel"
                      {...phoneForm.register('phone')}
                      placeholder="81234567890"
                      onBlur={(e) => {
                        const val = e.target.value ?? '';
                        if (val.startsWith('0')) {
                          const newVal = val.replace(/^0/, '');
                          e.currentTarget.value = newVal;
                          phoneForm.setValue('phone', newVal, {
                            shouldDirty: true,
                            shouldTouch: true
                          });
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
                  {phoneForm.formState.errors.phone && (
                    <FieldError>{phoneForm.formState.errors.phone.message}</FieldError>
                  )}
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  loading={isUpdating || isSending}
                  disabled={isUpdating || isSending}
                >
                  Konfirmasi
                </Button>
              </DialogFooter>
            </FieldSet>
          </form>
        ) : (
          <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
            <FieldSet>
              <FieldGroup>
                <Field>
                  <div className="flex-center flex-col gap-4">
                    <header className="flex-center flex-col gap-4">
                      <Phone className="text-primary size-10" />
                      <FieldLabel htmlFor="otp" className="max-w-xs text-center leading-relaxed">
                        Masukkan OTP yang dikirim ke nomor telepon Anda
                        <br /> {formatPhone(phoneForm.getValues('phone'))}
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
                          onChange={(value) => {
                            field.onChange(value);
                            if (value.length === 6) {
                              otpForm.handleSubmit(handleOtpSubmit)();
                            }
                          }}
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
                        onSendOtp={handleResendOtp}
                        seconds={process.env.NODE_ENV === 'development' ? 5 : 60}
                        persistKey="otp:change-phone"
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
