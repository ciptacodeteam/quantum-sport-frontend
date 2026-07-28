import { api } from '@/lib/api';

export async function checkAccountApi(payload) {
  const { data } = await api.post('/auth/check-account', payload);
  return data;
}

export async function loginApi(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data;
}

export async function sendLoginOtpApi(payload) {
  const { data } = await api.post('/auth/send-login-otp', payload);
  return data;
}

export async function registerApi(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function refreshTokenApi() {
  const { data } = await api.post('/auth/refresh-token');
  return data;
}

export async function logoutApi() {
  const { data } = await api.post('/auth/logout');
  return data;
}

export async function forgotPasswordApi(payload) {
  const { data } = await api.post('/auth/forgot-password', payload);
  return data;
}

export async function resetPasswordApi(payload) {
  const { data } = await api.post('/auth/reset-password', payload);
  return data;
}

export async function passwordResetWithTokenApi(payload) {
  const { data } = await api.post('/password-reset', payload);
  return data;
}

export async function getProfileApi() {
  const { data } = await api.get('/auth/profile');
  return data;
}

import { hasAdminSessionCookie } from '@/lib/admin-session';

export async function getProfileApiSmart() {
  const { adminApi } = await import('@/lib/adminApi');

  if (hasAdminSessionCookie()) {
    const { data } = await adminApi.get('/auth/profile');
    return data;
  }

  const { data } = await api.get('/auth/profile');
  return data;
}

export async function updateProfileApi(payload) {
  const { data } = await api.post('/auth/profile', payload, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
}

export async function verifyPasswordApi(payload) {
  const { data } = await api.post('/auth/verify-password', payload);
  return data;
}

export async function changePasswordApi(payload) {
  const { data } = await api.post('/auth/change-password', payload);
  return data;
}
