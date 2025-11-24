import {
  sendVerificationOtpApi,
  verifyVerificationOtpApi,
  type SendVerificationOtpPayload,
  type VerifyVerificationOtpPayload
} from '@/api/verification';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
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
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Gagal mengirim OTP';
      toast.error(msg);
      onError?.(error);
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
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Kode OTP salah atau kadaluarsa';
      toast.error(msg);
      onError?.(error);
    }
  });
