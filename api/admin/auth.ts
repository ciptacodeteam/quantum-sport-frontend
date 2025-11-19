import { adminApi } from '@/lib/adminApi';
import axios from 'axios';
import { env } from '@/env';

// Create a base axios instance for shared endpoints
const baseApi = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

export async function loginApi(payload) {
  const { data } = await adminApi.post('/auth/login', payload);
  return data;
}

export async function registerApi(payload) {
  const { data } = await adminApi.post('/auth/register', payload);
  return data;
}

export async function logoutApi() {
  // Use base API for logout (shared endpoint between admin and user)
  const { data } = await baseApi.post('/auth/logout');
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
