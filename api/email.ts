import { api } from '@/lib/api';

export async function sendEmailOtpApi(payload: { email: string }) {
  const { data } = await api.post('/email/send-otp', payload);
  return data;
}

export async function verifyEmailOtpApi(payload: { email: string; otp: string }) {
  const { data } = await api.post('/email/verify-otp', payload);
  return data;
}

export async function requestEmailChangeApi(payload: { newEmail: string }) {
  const { data } = await api.post('/auth/email/request-change', payload);
  return data;
}

export async function verifyEmailChangeApi(payload: { requestId: string; code: string }) {
  const { data } = await api.post('/auth/email/verify-change', payload);
  return data;
}
