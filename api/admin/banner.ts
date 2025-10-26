import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData, UpdateMutationPayload } from '@/types';

export async function getBannersApi(queryParams: SearchParamsData = {}) {
  const url = '/banners';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getBannerApi(id: string) {
  const { data } = await adminApi.get(`/banner/${id}`);
  return data;
}

export async function createBannerApi(payload: CreateMutationPayload) {
  const { data } = await adminApi.post('/banners', payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function updateBannerApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/banners/${payload.id}`, payload.data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function deleteBannerApi(id: string) {
  const { data } = await adminApi.delete(`/banners/${id}`);
  return data;
}
