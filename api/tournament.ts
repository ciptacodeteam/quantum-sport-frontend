import { api } from '@/lib/api';
import type { SearchParamsData } from '@/types';
import { mergedQueryParamUrl } from '@/lib/utils';

export async function getActiveTournamentsApi(params: SearchParamsData = {}) {
  const url = mergedQueryParamUrl('/tournaments/active', params);
  const { data } = await api.get(url);
  return data;
}

export async function getTournamentsApi(params: SearchParamsData = {}) {
  const url = mergedQueryParamUrl('/tournaments', params);
  const { data } = await api.get(url);
  return data;
}

export async function getTournamentDetailApi(id: string) {
  const { data } = await api.get(`/tournaments/${id}`);
  return data;
}

