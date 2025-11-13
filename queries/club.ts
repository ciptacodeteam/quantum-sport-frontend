import { getClubsApi, getClubApi, getUserClubsApi } from '@/api/club';
import type { Club } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';
import type { SearchParamsData } from '@/types';

export const clubsQueryOptions = (queryParams?: SearchParamsData) =>
  queryOptions({
    queryKey: ['clubs', queryParams],
    queryFn: () => getClubsApi(queryParams),
    select: (res) => {
      // Backend returns array directly: [{ id: ..., name: ..., _count: { clubMember: 2 } }, ...]
      return (Array.isArray(res.data) ? res.data : res) as Club[];
    }
  });

export const clubQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['clubs', id],
    queryFn: () => getClubApi(id),
    select: (res) => res.data as Club
  });

export const userClubsQueryOptions = () =>
  queryOptions({
    queryKey: ['clubs', 'my-clubs'],
    queryFn: getUserClubsApi,
    select: (res) => (Array.isArray(res.data) ? res.data : res) as Club[]
  });
