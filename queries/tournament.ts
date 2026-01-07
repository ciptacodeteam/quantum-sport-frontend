import {
  getActiveTournamentsApi,
  getTournamentDetailApi,
  getTournamentsApi
} from '@/api/tournament';
import { queryOptions } from '@tanstack/react-query';

const normalizeListResponse = (res: any) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const normalizeDetailResponse = (res: any) => {
  if (res?.data) return res.data;
  if (res?.data?.data) return res.data.data;
  return res;
};

export const activeTournamentsQueryOptions = () =>
  queryOptions({
    queryKey: ['tournaments', 'active'],
    queryFn: () => getActiveTournamentsApi(),
    select: normalizeListResponse,
    staleTime: 60 * 1000
  });

export const allTournamentsQueryOptions = () =>
  queryOptions({
    queryKey: ['tournaments', 'all'],
    queryFn: () => getTournamentsApi(),
    select: normalizeListResponse,
    staleTime: 60 * 1000
  });

export const tournamentDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['tournaments', id],
    queryFn: () => getTournamentDetailApi(id),
    select: normalizeDetailResponse,
    enabled: !!id
  });
