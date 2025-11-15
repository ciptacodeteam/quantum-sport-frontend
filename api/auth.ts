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

export async function getProfileApiSmart() {
  // Import dynamically to avoid circular dependency
  const { isAdminToken } = await import('@/lib/utils');
  const { adminApi } = await import('@/lib/adminApi');

  // Check if current token is admin token
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
    // If not in localStorage, try auth store
    if (!token) {
      const { default: useAuthStore } = await import('@/stores/useAuthStore');
      token = useAuthStore.getState().token;
    }
    // Remove 'Bearer ' prefix if present
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7);
    }
  }

  if (token && isAdminToken(token)) {
    // Use admin API endpoint
    const { data } = await adminApi.get('/auth/profile');
    return data;
  }

  // Use regular user API endpoint
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
