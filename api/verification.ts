import { api } from '@/lib/api';

export type SendVerificationOtpPayload =
  | { type: 'phone'; phone: string }
  | { type: 'email'; email: string };
export type VerifyVerificationOtpPayload = {
  type: 'phone' | 'email';
  requestId: string;
  code: string;
};

export async function sendVerificationOtpApi(payload: SendVerificationOtpPayload) {
  const { data } = await api.post('/verification/send-otp', payload);
  return data;
}

export async function verifyVerificationOtpApi(payload: VerifyVerificationOtpPayload) {
  const { data } = await api.post('/verification/verify-otp', payload);
  return data;
}
