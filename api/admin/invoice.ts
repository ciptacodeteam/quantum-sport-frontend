import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { SearchParamsData } from '@/types';

export async function getInvoicesApi(queryParams: SearchParamsData = {}) {
  const url = '/invoices';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getInvoiceApi(id: string) {
  const { data } = await adminApi.get(`/invoices/${id}`);
  return data;
}
