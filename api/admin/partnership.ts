import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData, UpdateMutationPayload } from '@/types';

export async function getPartnershipsApi(queryParams: SearchParamsData = {}) {
  const url = '/partnerships';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getPartnershipApi(id: string) {
  const { data } = await adminApi.get(`/partnerships/${id}`);
  return data;
}

export async function createPartnershipApi(payload: CreateMutationPayload) {
  const { data } = await adminApi.post('/partnerships', payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function updatePartnershipApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/partnerships/${payload.id}`, payload.data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function deletePartnershipApi(id: string) {
  const { data } = await adminApi.delete(`/partnerships/${id}`);
  return data;
}
