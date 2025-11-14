import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { SearchParamsData } from '@/types';

export async function getAdminClubsApi(queryParams: SearchParamsData = {}) {
  const url = '/clubs';
  // Include leader information for admin view
  const params = { ...queryParams, include: 'leader' };
  const mergedUrl = mergedQueryParamUrl(url, params);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getAdminClubApi(id: string) {
  // Include leader and members for detailed view
  const { data } = await adminApi.get(`/clubs/${id}?include=leader,clubMember`);
  return data;
}

export async function deleteAdminClubApi(clubId: string) {
  const { data } = await adminApi.delete(`/clubs/${clubId}`);
  return data;
}
