import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData, UpdateMutationPayload } from '@/types';

export async function getUsersApi(queryParams: SearchParamsData = {}) {
  const url = '/users';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getUserApi(id: string) {
  const { data } = await adminApi.get(`/users/${id}`);
  return data;
}

export async function createUserApi(payload: CreateMutationPayload) {
  const { data } = await adminApi.post('/users', payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function updateUserApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/users/${payload.id}`, payload.data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function deleteUserApi(id: string) {
  const { data } = await adminApi.delete(`/users/${id}`);
  return data;
}

export async function banUserApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/users/${payload.id}/ban`, payload.data);
  return data;
}

export async function unbanUserApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/users/${payload.id}/unban`, payload.data);
  return data;
}
