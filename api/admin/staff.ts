import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData, UpdateMutationPayload } from '@/types';

export async function getStaffsApi(queryParams: SearchParamsData = {}) {
  const url = '/staffs';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getStaffApi(id: string) {
  const { data } = await adminApi.get(`/staffs/${id}`);
  return data;
}

export async function updateStaffApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/staffs/${payload.id}`, payload.data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function createStaffApi(payload: CreateMutationPayload) {
  const { data } = await adminApi.post('/staffs', payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function resetStaffPasswordApi(id: string) {
  const { data } = await adminApi.post(`/staffs/${id}/reset-password`);
  return data;
}

export async function revokeStaffTokenApi(id: string) {
  const { data } = await adminApi.post(`/staffs/${id}/revoke-token`);
  return data;
}
