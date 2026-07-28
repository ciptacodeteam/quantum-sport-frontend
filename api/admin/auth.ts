import { adminApi } from '@/lib/adminApi';

export async function loginApi(payload) {
  const { data } = await adminApi.post('/auth/login', payload);
  return data;
}

export async function registerApi(payload) {
  const { data } = await adminApi.post('/auth/register', payload);
  return data;
}

export async function logoutApi() {
  const { data } = await adminApi.post('/auth/logout');
  return data;
}

export async function refreshTokenApi() {
  const { data } = await adminApi.post('/auth/refresh-token');
  return data;
}

export async function getProfileApi() {
  const { data } = await adminApi.get('/auth/profile');
  return data;
}

export async function updateProfileApi(payload) {
  const { data } = await adminApi.post('/auth/profile', payload, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
}

export async function checkAdminAccountApi() {
  const { data } = await adminApi.get('/auth/check-account');
  return data;
}

export async function changePasswordApi(payload) {
  const { data } = await adminApi.post('/auth/change-password', payload);
  return data;
}
