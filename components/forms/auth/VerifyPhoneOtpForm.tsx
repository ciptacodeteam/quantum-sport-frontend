'use client';

import { ResendOtpButton } from '@/components/buttons/ResendOtpButton';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { formatPhone } from '@/lib/utils';
import { loginMutationOptions, registerMutationOptions } from '@/mutations/auth';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
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
  type?: 'login' | 'register';
};

const VerifyPhoneOtpForm = ({ onVerifySuccess, type }: Props) => {
  const requestId = usePhoneStore((state) => state.requestId);
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

  const { mutate: mutateLogin, isPending: isLoginPending } = useMutation(
    loginMutationOptions({
      onSuccess: () => {
        router.push('/');
        onVerifySuccess?.();
      },
      onError: (err) => {
        if (err.errors) {
          const fieldErrors = err.errors as z.ZodFlattenedError<FormSchema>;
          Object.entries(fieldErrors).forEach(([fieldName, error]) => {
            form.setError(fieldName as keyof FormSchema, {
              type: 'server',
              message: Array.isArray(error) ? error.join(', ') : String(error)
            });
          });
        }
      }
    })
  );

  const { mutate: mutateRegister, isPending: isRegisterPending } = useMutation(
    registerMutationOptions({
      onSuccess: () => {
        router.push('/');
        onVerifySuccess?.();
      },
      onError: (err) => {
        if (err.errors) {
          const fieldErrors = err.errors as z.ZodFlattenedError<FormSchema>;
          Object.entries(fieldErrors).forEach(([fieldName, error]) => {
            form.setError(fieldName as keyof FormSchema, {
              type: 'server',
              message: Array.isArray(error) ? error.join(', ') : String(error)
            });
          });
        }
      }
    })
  );

  const onSubmit: SubmitHandler<FormSchema> = useCallback(
    (data) => {
      if (data.otp.length < 4) {
        toast.error('Please enter a valid OTP');
        return;
      }

      if (data.requestId === null || data.phone === null) {
        toast.error('Phone number or Request ID is missing');
        return;
      }

      if (type === 'register') {
        mutateRegister(data);
      } else {
        mutateLogin(data);
      }
    },
    [mutateLogin, mutateRegister, type]
  );

  const handleResendOtp = () => {
    toast.success('resending');
  };

  useEffect(() => {
    const subscription = form.watch((value) => {
      const otp = (value as { otp?: string })?.otp;
      if (otp && otp.length === 4) {
        form.handleSubmit(onSubmit)();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit]);

  return (
    <form className="p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
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
                disabled={isLoginPending || isRegisterPending}
                render={({ field }) => (
                  <InputOTP
                    maxLength={4}
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="size-14" />
                      <InputOTPSlot index={1} className="size-14" />
                      <InputOTPSlot index={2} className="size-14" />
                      <InputOTPSlot index={3} className="size-14" />
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
              <div className="mt-2">
                <ResendOtpButton
                  onSendOtp={handleResendOtp}
                  seconds={60}
                  persistKey="otp:login"
                  autoStart
                />
              </div>
              <FieldError>{form.formState.errors.otp?.message}</FieldError>
            </div>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default VerifyPhoneOtpForm;
