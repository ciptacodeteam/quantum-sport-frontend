import { api } from '@/lib/api';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { SearchParamsData, CreateMutationPayload } from '@/types';

export async function getClubsApi(queryParams: SearchParamsData = {}) {
  const url = '/clubs';
  // Add include=leader to get leader information
  const params = { ...queryParams, include: 'leader' };
  const mergedUrl = mergedQueryParamUrl(url, params);
  const res = await api.get(mergedUrl);
  // Backend returns array directly: [{...}, {...}]
  return res.data;
}

export async function getClubApi(id: string) {
  // Include leader and clubMember in the request
  const { data } = await api.get(`/clubs/${id}?include=leader,clubMember`);
  return data;
}

export async function joinClubApi(clubId: string) {
  const { data } = await api.post(`/clubs/${clubId}/join`);
  return data;
}

export async function requestJoinClubApi(clubId: string) {
  const { data } = await api.post(`/clubs/${clubId}/request`);
  return data;
}

export async function leaveClubApi(clubId: string) {
  const { data } = await api.delete(`/clubs/${clubId}/leave`);
  return data;
}

export async function getUserClubsApi() {
  const { data } = await api.get('/clubs/my-clubs');
  return data;
}

export async function createClubApi(payload: FormData) {
  const { data } = await api.post('/clubs', payload, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
}
