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
  // Include leader, clubMember, and user's membership status
  const { data } = await api.get(`/clubs/${id}?include=leader,clubMember,userStatus`);
  return data;
}

export async function joinClubApi(clubId: string) {
  const { data } = await api.post(`/clubs/${clubId}/join`);
  return data;
}

export async function requestJoinClubApi(clubId: string) {
  const { data } = await api.post(`/clubs/${clubId}/request-join`);
  return data;
}

export async function leaveClubApi(clubId: string) {
  const { data } = await api.delete(`/clubs/${clubId}/leave`);
  return data;
}

export async function getUserClubsApi() {
  // Get clubs the user leads
  const { data } = await api.get('/clubs/my?include=leader');
  return data;
}

export async function getClubMembershipsApi() {
  // Get clubs the user is a member of
  const { data } = await api.get('/clubs/membership?include=leader');
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

export async function getClubRequestsApi(clubId: string) {
  const { data } = await api.get(`/clubs/${clubId}/requests`);
  return data;
}

export async function approveClubRequestApi(clubId: string, userId: string) {
  const { data } = await api.post(`/clubs/${clubId}/requests/${userId}/approve`);
  return data;
}

export async function rejectClubRequestApi(clubId: string, userId: string) {
  const { data } = await api.delete(`/clubs/${clubId}/requests/${userId}/reject`);
  return data;
}

export async function deleteClubApi(clubId: string) {
  const { data } = await api.delete(`/clubs/${clubId}`);
  return data;
}
