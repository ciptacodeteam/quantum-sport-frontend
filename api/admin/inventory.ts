import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData, UpdateMutationPayload } from '@/types';

export async function getInventoriesApi(queryParams: SearchParamsData = {}) {
  const url = '/inventory';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getInventoryApi(id: string) {
  const { data } = await adminApi.get(`/inventory/${id}`);
  return data;
}

export async function createInventoryApi(payload: CreateMutationPayload) {
  const { data } = await adminApi.post('/inventory', payload);
  return data;
}

export async function updateInventoryApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/inventory/${payload.id}`, payload.data);
  return data;
}

export async function deleteInventoryApi(id: string) {
  const { data } = await adminApi.delete(`/inventory/${id}`);
  return data;
}
