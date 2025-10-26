import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData, UpdateMutationPayload } from '@/types';

export async function getPaymentMethodsApi(queryParams: SearchParamsData = {}) {
  const url = '/payment-methods';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getPaymentMethodApi(id: string) {
  const { data } = await adminApi.get(`/payment-methods/${id}`);
  return data;
}

export async function createPaymentMethodApi(payload: CreateMutationPayload) {
  const { data } = await adminApi.post('/payment-methods', payload);
  return data;
}

export async function updatePaymentMethodApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/payment-methods/${payload.id}`, payload.data);
  return data;
}

export async function deletePaymentMethodApi(id: string) {
  const { data } = await adminApi.delete(`/payment-methods/${id}`);
  return data;
}
