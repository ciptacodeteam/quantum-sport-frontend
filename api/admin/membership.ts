import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData, UpdateMutationPayload } from '@/types';

export async function getMembershipsApi(queryParams: SearchParamsData = {}) {
  const url = '/memberships';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getMembershipApi(id: string) {
  const { data } = await adminApi.get(`/memberships/${id}`);
  return data;
}

export async function createMembershipApi(payload: CreateMutationPayload) {
  const { data } = await adminApi.post('/memberships', payload);
  return data;
}

export async function updateMembershipApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/memberships/${payload.id}`, payload.data);
  return data;
}

export async function deleteMembershipApi(id: string) {
  const { data } = await adminApi.delete(`/memberships/${id}`);
  return data;
}
