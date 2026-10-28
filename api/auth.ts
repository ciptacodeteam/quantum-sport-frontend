import { api } from '@/lib/api';
import { clearAdminSessionCookie, hasAdminSessionCookie } from '@/lib/admin-session';

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
  // The shared profile page can display either a customer or a staff session.
  // End the same session used by getProfileApiSmart, including its API cookies.
  if (hasAdminSessionCookie()) {
    const { logoutApi: logoutAdminApi } = await import('@/api/admin/auth');
    const data = await logoutAdminApi();
    clearAdminSessionCookie();
    return data;
  }

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

export async function getProfileApiSmart({ signal }: { signal?: AbortSignal } = {}) {
  const { adminApi } = await import('@/lib/adminApi');

  if (hasAdminSessionCookie()) {
    const { data } = await adminApi.get('/auth/profile', { signal });
    return data;
  }

  const { data } = await api.get('/auth/profile', { signal });
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
