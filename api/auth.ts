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

export async function logoutApi() {
  const { data } = await api.post('/auth/logout');
  return data;
}

export async function getProfileApi() {
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
