'use client';

import { mapApiErrorsToForm } from '@/lib/api-error';

import { ResendOtpButton } from '@/components/buttons/ResendOtpButton';
import { Field, FieldError, FieldGroup, FieldSet } from '@/components/ui/field';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { DialogTitle } from '@/components/ui/dialog';
import { formatPhone } from '@/lib/utils';
import { registerMutationOptions, verifyPhoneOtpMutationOptions } from '@/mutations/auth';
import { sendPhoneOtpMutationOptions } from '@/mutations/phone';
import { profileQueryOptions } from '@/queries/profile';
import useAuthRedirectStore from '@/stores/useAuthRedirectStore';
import useAuthStore from '@/stores/useAuthStore';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { useRegisterStore } from '@/stores/useRegisterStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const formSchema = z.object({
  otp: z.string().min(1, 'Masukkan kode OTP').length(4, 'Kode OTP harus terdiri dari 4 digit'),
  phone: z.string().min(1, 'WhatsApp Number is required').max(15, 'WhatsApp Number is too long'),
  requestId: z.string().min(1, 'Request ID is required')
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  onVerifySuccess?: () => void;
  type?: 'global' | 'register';
};

const VerifyPhoneOtpForm = ({ onVerifySuccess, type = 'global' }: Props) => {
  const requestId = usePhoneStore((state) => state.requestId);
  const setRequestId = usePhoneStore((state) => state.setRequestId);
  const phone = usePhoneStore((state) => state.phone);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: phone || '',
      requestId: requestId || '',
      otp: ''
    }
  });

  const router = useRouter();

  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const consumeRedirectPath = useAuthRedirectStore((state) => state.consumeRedirectPath);

  const clearRegisterData = useRegisterStore((state) => state.clear);

  const { mutate: mutateRegister, isPending: isRegisterPending } = useMutation(
    registerMutationOptions({
      onSuccess: (res) => {
        const token = res?.data?.token;

        if (!token && res?.success !== true) {
          toast.error('Login failed: No token received.');
          return;
        }

        setAuth(true);
        const redirectPath = consumeRedirectPath();
        router.push(redirectPath ?? '/');
        clearRegisterData();
        queryClient.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
        onVerifySuccess?.();
      },
      onError: (err) => {
        mapApiErrorsToForm(form, err);
      }
    })
  );

  const { mutate: resendOtp, isPending: isResendOtpPending } = useMutation(
    sendPhoneOtpMutationOptions({
      onSuccess: (res) => {
        const requestId = res?.data?.requestId;
        if (requestId) {
          form.setValue('requestId', requestId);
          setRequestId(requestId);
        } else {
          toast.error('Failed to get Request ID. Please try again.');
        }
      }
    })
  );

  const { mutate, isPending } = useMutation(
    verifyPhoneOtpMutationOptions({
      onSuccess: () => {
        form.reset();
        onVerifySuccess?.();
      },
      onError: (err) => {
        mapApiErrorsToForm(form, err);
      }
    })
  );

  const registerData = useRegisterStore((state) => state.registerData);

  const onSubmit: SubmitHandler<FormSchema> = useCallback(
    (data) => {
      if (data.otp.length < 4) {
        toast.error('Please enter a valid OTP');
        return;
      }

      if (!data.requestId || !data.phone) {
        toast.error('WhatsApp Number or Request ID is missing');
        return;
      }

      if (!registerData && type === 'register') {
        toast.error('Registration data is missing');
        return;
      }

      const formatedPhone = formatPhone(data.phone);

      if (type === 'register') {
        mutateRegister({
          ...registerData,
          phone: formatedPhone,
          code: data.otp,
          requestId: data.requestId
        });
      } else {
        mutate({
          phone: formatedPhone,
          code: data.otp,
          requestId: data.requestId
        });
      }
    },
    [mutateRegister, registerData, mutate, type]
  );

  const handleResendOtp = () => {
    if (!phone) {
      toast.error('WhatsApp Number is missing! Refresh and try again.');
      return;
    }

    resendOtp({ phone: formatPhone(phone) });
  };

  const maxLength = 4;

  // const handleOtpChange = useCallback(
  //   (value, info: { name?: string }) => {
  //     if (info.name === 'otp' && value.otp && value.otp.length === maxLength && !isPending) {
  //       form.handleSubmit(onSubmit)();
  //     }
  //   },
  //   [maxLength, isPending, form, onSubmit]
  // );

  // useEffect(() => {
  //   const { unsubscribe } = form.watch((value, info) => {
  //     handleOtpChange(value, info);
  //   });
  //   return () => unsubscribe();
  // }, [form.watch, handleOtpChange]);

  return (
    <form className="otp-verification py-1" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Field>
            <div className="flex w-full flex-col items-center gap-0">
              <header className="mb-7 flex w-full flex-col items-center text-center">
                <div className="mb-4 flex size-10 items-center justify-center text-[#ad422b]">
                  <Phone className="size-7" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <DialogTitle className="text-[22px] leading-snug font-medium tracking-tight text-[#171717]">
                  Verifikasi WhatsApp
                </DialogTitle>
                <p
                  id="whatsapp-otp-description"
                  className="mt-3 max-w-[260px] text-xs leading-relaxed text-black/50"
                >
                  Masukkan 4 digit kode yang dikirim ke WhatsApp
                </p>
                <p className="mt-2 text-sm font-medium tracking-wide text-[#171717]">
                  {formatPhone(phone)}
                </p>
              </header>
              <Controller
                name="otp"
                control={form.control}
                defaultValue=""
                disabled={isRegisterPending || isPending || isResendOtpPending}
                render={({ field }) => (
                  <InputOTP
                    id="otp"
                    aria-label="Kode OTP WhatsApp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    containerClassName="w-full justify-center"
                    maxLength={maxLength}
                    disabled={field.disabled}
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      if (value.length === maxLength && !isPending && !isRegisterPending) {
                        form.handleSubmit(onSubmit)();
                      }
                    }}
                  >
                    <InputOTPGroup className="w-full max-w-[280px] justify-center gap-3">
                      <InputOTPSlot index={0} variant="separated" />
                      <InputOTPSlot index={1} variant="separated" />
                      <InputOTPSlot index={2} variant="separated" />
                      <InputOTPSlot index={3} variant="separated" />
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
              <FieldError className="mt-3 text-center">
                {form.formState.errors.otp?.message}
              </FieldError>
              {(isPending || isRegisterPending) && (
                <p role="status" className="mt-3 text-xs text-black/50">
                  Memverifikasi kode...
                </p>
              )}
              <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-0 [&_button]:min-h-10 [&_button]:border-0 [&_button]:px-0 [&_button]:py-0">
                <p className="text-xs text-black/45">Belum menerima kode?</p>
                <ResendOtpButton
                  onSendOtp={handleResendOtp}
                  seconds={process.env.NODE_ENV === 'development' ? 5 : 60}
                  persistKey="otp:login"
                  autoStart
                />
              </div>
            </div>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default VerifyPhoneOtpForm;
