import { api } from '@/lib/api';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData } from '@/types';

export async function getMembershipsApi(queryParams: SearchParamsData = {}) {
  const url = '/memberships';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await api.get(mergedUrl);
  return res.data;
}

export async function getMembershipApi(id: string) {
  const { data } = await api.get(`/memberships/${id}`);
  return data;
}

export async function getMyMembershipsApi() {
  const { data } = await api.get('/memberships/my');
  return data;
}

export async function doMembershipCheckoutApi(payload: CreateMutationPayload) {
  const { data } = await api.post('/memberships/checkout', payload);
  return data;
}

export async function getMyMembershipApi() {
  const { data } = await api.get('/memberships/my/active');
  return data;
}

export async function getMyMembershipTrackingApi() {
  const { data } = await api.get<{
    data: import('@/types/membership-tracking').MembershipTracking;
  }>('/memberships/my/tracking');
  return data;
}

export async function getMembershipRenewalPreviewApi(id: string) {
  const { data } = await api.get<{
    data: { packageSessions: number; debtSessions: number; remainingAfterPurchase: number };
  }>(`/memberships/${id}/renewal-preview`);
  return data.data;
}
