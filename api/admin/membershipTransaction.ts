import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { SearchParamsData } from '@/types';
import type { MembershipUser } from '@/types/model';

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
