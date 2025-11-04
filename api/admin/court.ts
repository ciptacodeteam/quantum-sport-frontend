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

export async function getCourtSlotsApi(courtId: string, queryParams?: SearchParamsData) {
  const url = `/courts/${courtId}/slots`;
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const { data } = await adminApi.get(mergedUrl);
  return data;
}

export async function getCourtCostingApi(id: string, queryParams?: SearchParamsData) {
  const url = `/courts/${id}/costing`;
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const { data } = await adminApi.get(mergedUrl);
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

export async function createCourtCostApi(payload: CreateMutationPayload) {
  const { data } = await adminApi.post('/court-costs', payload);
  return data;
}

export async function getAllCourtCostApi(queryParams: SearchParamsData = {}) {
  const url = '/court-costs';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function updateCourtCostApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/court-costs/${payload.id}`, payload.data);
  return data;
}

export async function overrideCourtCostApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/court-costs/${payload.id}/override`, payload.data);
  return data;
}
