import { getClubsApi, getClubApi, getUserClubsApi, getClubMembershipsApi, getClubRequestsApi } from '@/api/club';
import type { Club, ClubJoinRequest } from '@/types/model';
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
    queryKey: ['clubs', 'my'],
    queryFn: getUserClubsApi,
    select: (res) => {
      // Backend returns { success: true, code: 200, msg: "Success", data: [...] }
      return (Array.isArray(res.data) ? res.data : res) as Club[];
    }
  });

export const clubMembershipsQueryOptions = () =>
  queryOptions({
    queryKey: ['clubs', 'membership'],
    queryFn: getClubMembershipsApi,
    select: (res) => {
      console.log('🔍 Raw membership response:', res);
      // Handle different response structures
      let clubs: Club[] = [];
      
      if (res?.data) {
        // If there's a data property, check if it's an array or has a data property inside
        if (Array.isArray(res.data)) {
          clubs = res.data;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          clubs = res.data.data;
        } else if (typeof res.data === 'object' && !Array.isArray(res.data)) {
          // Single object wrapped in data property
          clubs = [res.data];
        }
      } else if (Array.isArray(res)) {
        clubs = res;
      }
      
      console.log('🔍 Processed membership clubs:', clubs);
      return clubs;
    }
  });

export const clubRequestsQueryOptions = (clubId: string) =>
  queryOptions({
    queryKey: ['clubs', clubId, 'requests'],
    queryFn: () => getClubRequestsApi(clubId),
    select: (res) => {
      return (Array.isArray(res.data) ? res.data : res) as ClubJoinRequest[];
    }
  });
