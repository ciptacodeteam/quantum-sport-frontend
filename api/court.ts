import { api } from '@/lib/api';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData } from '@/types';

export async function getCourtsApi(queryParams: SearchParamsData = {}) {
  const url = '/courts';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await api.get(mergedUrl);
  return res.data;
}

export async function getCourtApi(id: string) {
  const { data } = await api.get(`/courts/${id}`);
  return data;
}

export async function getCourtSlotsApi(courtId: string, queryParams?: SearchParamsData) {
  const url = `/courts/${courtId}/slots`;
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await api.get(mergedUrl);
  return res.data;
}

export async function getCourtsSlotsApi(queryParams: SearchParamsData = {}) {
  const url = '/courts/slots';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await api.get(mergedUrl);
  return res.data;
}

export async function getAllCourtsSlotsApi(date: string) {
  const { data } = await api.get('/slots', {
    params: { date }
  });
  return data;
}

