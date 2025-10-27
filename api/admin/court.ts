import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData, UpdateMutationPayload } from '@/types';

export async function getCourtsApi(queryParams: SearchParamsData = {}) {
  const url = '/courts';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getCourtApi(id: string) {
  const { data } = await adminApi.get(`/courts/${id}`);
  return data;
}

export async function createCourtApi(payload: CreateMutationPayload) {
  const { data } = await adminApi.post('/courts', payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function updateCourtApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/courts/${payload.id}`, payload.data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function deleteCourtApi(id: string) {
  const { data } = await adminApi.delete(`/courts/${id}`);
  return data;
}
