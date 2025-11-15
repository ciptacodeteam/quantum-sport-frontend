import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData, UpdateMutationPayload } from '@/types';

export async function getTournamentsApi(queryParams: SearchParamsData = {}) {
  const url = '/tournaments';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await adminApi.get(mergedUrl);
  return res.data;
}

export async function getTournamentApi(id: string) {
  const { data } = await adminApi.get(`/tournaments/${id}`);
  return data;
}

export async function createTournamentApi(payload: CreateMutationPayload) {
  const { data } = await adminApi.post('/tournaments', payload.data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
}

export async function updateTournamentApi(payload: UpdateMutationPayload) {
  const { data } = await adminApi.put(`/tournaments/${payload.id}`, payload.data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
}

export async function deleteTournamentApi(id: string) {
  const { data } = await adminApi.delete(`/tournaments/${id}`);
  return data;
}
