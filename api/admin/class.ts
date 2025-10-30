import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData, UpdateMutationPayload } from '@/types';

export async function getClassesApi(queryParams: SearchParamsData = {}) {
  const url = '/classes';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getClassApi(id: string) {
  const { data } = await adminApi.get(`/classes/${id}`);
  return data;
}

export async function createClassApi(payload: CreateMutationPayload) {
  const { data } = await adminApi.post('/classes', payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function updateClassApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/classes/${payload.id}`, payload.data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function deleteClassApi(id: string) {
  const { data } = await adminApi.delete(`/classes/${id}`);
  return data;
}
