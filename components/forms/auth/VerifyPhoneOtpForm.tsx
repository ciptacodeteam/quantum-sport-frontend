'use client';

import { ResendOtpButton } from '@/components/buttons/ResendOtpButton';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { formatPhone } from '@/lib/utils';
import { registerMutationOptions, verifyPhoneOtpMutationOptions } from '@/mutations/auth';
import { sendPhoneOtpMutationOptions } from '@/mutations/phone';
import { profileQueryOptions } from '@/queries/profile';
import useAuthStore from '@/stores/useAuthStore';
import useAuthRedirectStore from '@/stores/useAuthRedirectStore';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { useRegisterStore } from '@/stores/useRegisterStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const formSchema = z.object({
  otp: z.string().min(1, 'OTP is required').max(6, 'OTP is too long'),
  phone: z.string().min(1, 'Phone number is required').max(15, 'Phone number is too long'),
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
  const setToken = useAuthStore((state) => state.setToken);
  const consumeRedirectPath = useAuthRedirectStore((state) => state.consumeRedirectPath);

  const clearRegisterData = useRegisterStore((state) => state.clear);

  const { mutate: mutateRegister, isPending: isRegisterPending } = useMutation(
    registerMutationOptions({
      onSuccess: (res) => {
        const token = res?.data?.token;

        if (!token) {
          toast.error('Login failed: No token received.');
          return;
        }

        setToken(token);
        const redirectPath = consumeRedirectPath();
        router.push(redirectPath ?? '/');
        clearRegisterData();
        queryClient.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
        onVerifySuccess?.();
      },
      onError: (err) => {
        if (err.errors?.name === 'ZodError') {
          const fieldErrors = err.errors.fields as Record<string, string>;
          Object.entries(fieldErrors).forEach(([fieldName, message]) => {
            form.setError(fieldName as keyof FormSchema, {
              type: 'server',
              message
            });
          });
        }
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
        if (err.errors?.name === 'ZodError') {
          const fieldErrors = err.errors.fields as Record<string, string>;
          Object.entries(fieldErrors).forEach(([fieldName, message]) => {
            form.setError(fieldName as keyof FormSchema, {
              type: 'server',
              message
            });
          });
        }
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
        toast.error('Phone number or Request ID is missing');
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
      toast.error('Phone number is missing! Refresh and try again.');
      return;
    }

    resendOtp({ phone: formatPhone(phone) });
  };

  const maxLength = 4;

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'otp' && value.otp && value.otp.length === maxLength) {
        form.handleSubmit(onSubmit)();
      }
    });
    return () => subscription.unsubscribe();
  }, [maxLength]);

  return (
    <form className="py-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Field>
            <div className="flex-center flex-col gap-4">
              <header className="flex-center flex-col gap-4">
                <Phone className="text-primary size-10" />
                <FieldLabel htmlFor="otp" className="max-w-xs text-center leading-relaxed">
                  Enter the OTP sent to your phone number <br /> {formatPhone(phone)}
                </FieldLabel>
              </header>
              <Controller
                name="otp"
                control={form.control}
                defaultValue=""
                disabled={isRegisterPending || isPending || isResendOtpPending}
                render={({ field }) => (
                  <InputOTP
                    maxLength={4}
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="size-14 md:text-xl" />
                      <InputOTPSlot index={1} className="size-14 md:text-xl" />
                      <InputOTPSlot index={2} className="size-14 md:text-xl" />
                      <InputOTPSlot index={3} className="size-14 md:text-xl" />
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
              <FieldError>{form.formState.errors.otp?.message}</FieldError>
              <div className="mt-2">
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
