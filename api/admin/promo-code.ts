import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData, UpdateMutationPayload } from '@/types';

export async function getPromoCodesApi(queryParams: SearchParamsData = {}) {
  const url = '/promo-code';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getPromoCodeApi(id: string) {
  const { data } = await adminApi.get(`/promo-code/${id}`);
  return data;
}

export async function createPromoCodeApi(payload: CreateMutationPayload) {
  const { data } = await adminApi.post('/promo-code', payload);
  return data;
}

export async function updatePromoCodeApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/promo-code/${payload.id}`, payload.data);
  return data;
}
