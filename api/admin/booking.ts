import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData } from '@/types';

export async function getBookingsApi(queryParams: SearchParamsData = {}) {
  const url = '/bookings';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getBookingApi(id: string, signal?: AbortSignal) {
  const { data } = await adminApi.get(`/bookings/${id}`, { signal, timeout: 30000 });
  return data;
}

export async function getOngoingBookingsApi() {
  const { data } = await adminApi.get('/bookings/ongoing-schedule');
  return data;
}

export async function getScheduleApi(queryParams: SearchParamsData = {}) {
  const url = '/bookings/schedule';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function createBookingApi(payload: CreateMutationPayload) {
  const { data } = await adminApi.post('/bookings', payload.data);
  return data;
}

export async function updateBookingStatusApi(id: string, status: string) {
  const { data } = await adminApi.put(`/bookings/${id}/status`, { status });
  return data;
}

export async function approveBookingApi(id: string) {
  const { data } = await adminApi.put(`/bookings/${id}/approve`);
  return data;
}

export async function cancelBookingApi(id: string, reason?: string) {
  const { data } = await adminApi.put(`/bookings/${id}/cancel`, { reason });
  return data;
}

export async function exportBookingsApi(queryParams: SearchParamsData = {}) {
  const url = '/bookings/export';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl, { responseType: 'blob' });
  return res.data;
}

export async function getCourtBookingTableApi(params: SearchParamsData, signal?: AbortSignal) {
  const { data } = await adminApi.get('/bookings/table', { params, signal, timeout: 30000 });
  return data;
}
