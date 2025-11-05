import { getTournamentApi, getTournamentsApi } from '@/api/admin/tournament';
import type { Tournament } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';
import type { SearchParamsData } from '@/types';

export const adminTournamentsQueryOptions = (queryParams?: SearchParamsData) =>
  queryOptions({
    queryKey: ['admin', 'tournaments', queryParams],
    queryFn: () => getTournamentsApi(queryParams),
    select: (res) => res.data as Tournament[]
  });

export const adminTournamentQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'tournaments', id],
    queryFn: () => getTournamentApi(id),
    select: (res) => res.data as Tournament
  });

