import { api } from '@/lib/api';

export async function sendPhoneOtpApi(payload) {
  const { data } = await api.post('/phone/send-otp', payload);
  return data;
}

export async function verifyPhoneOtpApi(payload) {
  const { data } = await api.post('/phone/verify-otp', payload);
  return data;
}
