'use client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { verifyVerificationOtpMutationOptions } from '@/mutations/verification';
import { profileQueryOptions } from '@/queries/profile';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ResendOtpButton } from '../buttons/ResendOtpButton';

const formSchema = z.object({ otp: z.string().min(1, 'OTP wajib diisi') });

type FormSchema = z.infer<typeof formSchema>;

export type VerifyContactOtpDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  type: 'phone' | 'email';
  requestId: string | null;
  onResendOtp: () => void;
};

export function VerifyContactOtpDialog({
  open,
  onOpenChange,
  type,
  requestId,
  onResendOtp
}: VerifyContactOtpDialogProps) {
  const qc = useQueryClient();
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: '' }
  });

  const maxLength = useMemo(() => {
    return type === 'phone' ? 4 : 6;
  }, [type]);

  const { mutate, isPending } = useMutation(
    verifyVerificationOtpMutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
        form.reset();
        onOpenChange(false);
      }
    })
  );

  function handleSubmit(data: FormSchema) {
    if (!requestId) return;
    if (data.otp.length < maxLength) {
      toast.error('Kode OTP tidak lengkap');
      return;
    }
    mutate({ type, requestId, code: data.otp });
  }

  const handleResendOtp = () => {
    onResendOtp();
  };

<<<<<<< HEAD
=======
  const handleOtpChange = useCallback(
    (value, info: { name?: string }) => {
      if (info.name === 'otp' && value.otp && value.otp.length === maxLength && !isPending) {
        form.handleSubmit(handleSubmit)();
      }
    },
    [maxLength, isPending, form, handleSubmit]
  );

  useEffect(() => {
    const { unsubscribe } = form.watch((value, info) => {
      handleOtpChange(value, info);
    });
    return () => unsubscribe();
  }, [form.watch, handleOtpChange]);

>>>>>>> 000da44dcfc15a475fa4d709f9fbe932dbf6957e
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) form.reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <form className="py-6 md:p-8" onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldSet>
            <FieldGroup>
              <Field>
                <div className="flex-center flex-col gap-4">
                  <header className="flex-center flex-col gap-4">
                    {type === 'phone' ? (
                      <Phone className="text-primary size-10" />
                    ) : (
                      <Mail className="text-primary size-10" />
                    )}
                    <FieldLabel htmlFor="otp" className="max-w-xs text-center leading-relaxed">
                      Masukkan OTP yang dikirim ke{' '}
                      {type === 'phone' ? 'nomor WhatsApp Anda' : 'alamat email Anda'}
                    </FieldLabel>
                  </header>
                  <Controller
                    name="otp"
                    control={form.control}
                    defaultValue=""
                    disabled={isPending}
                    render={({ field }) => (
                      <InputOTP
                        maxLength={maxLength}
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          if (value.length === maxLength) {
                            form.handleSubmit(handleSubmit)();
                          }
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: maxLength }).map((_, index) => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                              className="size-14 md:text-xl"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    )}
                  />
                  <FieldError>{form.formState.errors.otp?.message}</FieldError>
                  <div className="mt-2">
                    <ResendOtpButton
                      onSendOtp={handleResendOtp}
                      seconds={process.env.NODE_ENV === 'development' ? 5 : 60}
                      persistKey="otp:verify-contact"
                      autoStart
                    />
                  </div>
                </div>
              </Field>
            </FieldGroup>
          </FieldSet>
        </form>
      </DialogContent>
    </Dialog>
  );
}
