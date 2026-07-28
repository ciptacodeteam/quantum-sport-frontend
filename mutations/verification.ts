import {
  sendVerificationOtpApi,
  verifyVerificationOtpApi,
  type SendVerificationOtpPayload,
  type VerifyVerificationOtpPayload
} from '@/api/verification';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from 'sonner';

export const sendVerificationOtpMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: (payload: SendVerificationOtpPayload) => sendVerificationOtpApi(payload),
    onSuccess: (res, vars) => {
      const target = vars.type === 'phone' ? res?.data?.phone : res?.data?.email;
      toast.success(`OTP dikirim ke ${target}`);
      onSuccess?.(res);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Gagal mengirim OTP'));
      onError?.(error as any);
    }
  });

export const verifyVerificationOtpMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: (payload: VerifyVerificationOtpPayload) => verifyVerificationOtpApi(payload),
    onSuccess: (res, vars) => {
      const label = vars.type === 'phone' ? 'Nomor WhatsApp' : 'Email';
      toast.success(`${label} berhasil diverifikasi`);
      onSuccess?.(res);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Kode OTP salah atau kadaluarsa'));
      onError?.(error as any);
    }
  });
