import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData, UpdateMutationPayload } from '@/types';

export async function getCustomersApi(queryParams: SearchParamsData = {}) {
  const url = '/customers';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getCustomerApi(id: string) {
  const { data } = await adminApi.get(`/customers/${id}`);
  return data;
}

export async function createCustomerApi(payload: CreateMutationPayload) {
  const { data } = await adminApi.post('/customers', payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function updateCustomerApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/customers/${payload.id}`, payload.data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function deleteCustomerApi(id: string) {
  const { data } = await adminApi.delete(`/customers/${id}`);
  return data;
}

export async function banCustomerApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/customers/${payload.id}/ban`, payload.data);
  return data;
}

export async function unbanCustomerApi(id: string) {
  const { data } = await adminApi.post(`/customers/${id}/unban`);
  return data;
}

export async function sendResetPasswordLinkApi(id: string) {
  const { data } = await adminApi.post(`/customers/${id}/send-reset-password`);
  return data;
}

export async function getCustomerMembershipApi(id: string) {
  const { data } = await adminApi.get(`/customers/${id}/membership`);
  return data;
}

export async function searchCustomersApi(params: { q: string; limit?: string }) {
  const url = '/customers/search';
  const mergedUrl = mergedQueryParamUrl(url, params);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}
