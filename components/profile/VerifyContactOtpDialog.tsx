'use client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldSet } from '@/components/ui/field';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { verifyVerificationOtpMutationOptions } from '@/mutations/verification';
import { profileQueryOptions } from '@/queries/profile';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone } from 'lucide-react';
import { useMemo } from 'react';
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

  // const handleOtpChange = useCallback(
  //   (value, info: { name?: string }) => {
  //     if (info.name === 'otp' && value.otp && value.otp.length === maxLength && !isPending) {
  //       form.handleSubmit(handleSubmit)();
  //     }
  //   },
  //   [maxLength, isPending, form, handleSubmit]
  // );

  // useEffect(() => {
  //   const { unsubscribe } = form.watch((value, info) => {
  //     handleOtpChange(value, info);
  //   });
  //   return () => unsubscribe();
  // }, [form.watch, handleOtpChange]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) form.reset();
        onOpenChange(o);
      }}
    >
      <DialogContent
        aria-describedby="contact-otp-description"
        className="auth-dialog max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-none border-black/15 bg-[#f8f8f6] px-6 pt-10 pb-6 text-[#171717] sm:max-w-[400px] sm:px-8 sm:pb-7"
      >
        <form className="otp-verification py-1" onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldSet>
            <FieldGroup>
              <Field>
                <div className="flex w-full flex-col items-center gap-0">
                  <header className="mb-7 flex w-full flex-col items-center text-center">
                    <div className="mb-4 flex size-10 items-center justify-center text-[#ad422b]">
                      {type === 'phone' ? (
                        <Phone className="size-7" strokeWidth={1.5} aria-hidden="true" />
                      ) : (
                        <Mail className="size-7" strokeWidth={1.5} aria-hidden="true" />
                      )}
                    </div>
                    <DialogTitle className="text-[22px] leading-snug font-medium tracking-tight text-[#171717]">
                      {type === 'phone' ? 'Verifikasi WhatsApp' : 'Verifikasi email'}
                    </DialogTitle>
                    <p
                      id="contact-otp-description"
                      className="mt-3 max-w-[260px] text-xs leading-relaxed text-black/50"
                    >
                      Masukkan {maxLength} digit kode OTP yang dikirim ke{' '}
                      {type === 'phone' ? 'nomor WhatsApp Anda.' : 'alamat email Anda.'}
                    </p>
                  </header>
                  <Controller
                    name="otp"
                    control={form.control}
                    defaultValue=""
                    disabled={isPending}
                    render={({ field }) => (
                      <InputOTP
                        id="otp"
                        aria-label="Kode OTP"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        containerClassName="w-full justify-center"
                        maxLength={maxLength}
                        disabled={field.disabled}
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          if (value.length === maxLength && !isPending) {
                            form.handleSubmit(handleSubmit)();
                          }
                        }}
                      >
                        <InputOTPGroup className="w-full max-w-[280px] justify-center gap-2">
                          {Array.from({ length: maxLength }).map((_, index) => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                              variant="separated"
                              className={maxLength === 6 ? 'h-12 max-w-10 text-xl' : undefined}
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    )}
                  />
                  <FieldError>{form.formState.errors.otp?.message}</FieldError>
                  <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-0 [&_button]:min-h-10 [&_button]:border-0 [&_button]:px-0 [&_button]:py-0">
                    <p className="text-xs text-black/45">Belum menerima kode?</p>
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
