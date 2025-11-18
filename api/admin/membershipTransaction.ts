import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { SearchParamsData } from '@/types';

export async function getAdminMembershipTransactionsApi(queryParams: SearchParamsData = {}) {
  const url = '/membership-transactions';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getAdminMembershipTransactionDetailApi(id: string) {
  const { data } = await adminApi.get(`/membership-transactions/${id}`);
  return data;
}

export async function exportAdminMembershipTransactionsExcelApi(
  queryParams: SearchParamsData = {}
) {
  const url = '/membership-transactions/export/excel';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl, { responseType: 'blob' });
  return res.data as Blob;
}

export async function approveAdminMembershipTransactionApi(id: string) {
  const { data } = await adminApi.put(`/membership-transactions/${id}/approve`);
  return data;
}

export async function rejectAdminMembershipTransactionApi(
  id: string,
  payload?: { reason?: string }
) {
  const { data } = await adminApi.put(`/membership-transactions/${id}/reject`, payload);
  return data;
}

export async function suspendAdminMembershipTransactionApi(
  id: string,
  payload: { reason: string; endDate?: string }
) {
  const { data } = await adminApi.put(`/membership-transactions/${id}/suspend`, payload);
  return data;
}

export async function unsuspendAdminMembershipTransactionApi(id: string) {
  const { data } = await adminApi.put(`/membership-transactions/${id}/unsuspend`);
  return data;
}
