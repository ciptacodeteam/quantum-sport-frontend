import { getAdminClubApi, getAdminClubsApi } from '@/api/admin/club';
import type { SearchParamsData } from '@/types';
import { queryOptions } from '@tanstack/react-query';

export const adminClubsQueryOptions = (queryParams: SearchParamsData = {}) =>
  queryOptions({
    queryKey: ['admin', 'clubs', queryParams],
    queryFn: () => getAdminClubsApi(queryParams),
    select: (res) => {
      // Handle different response structures from backend
      console.log('📊 Admin Clubs Raw Response:', res);
      
      // Check if response is already an array
      if (Array.isArray(res)) {
        return res;
      }
      
      // Check if data is nested in res.data and is an array
      if (res?.data && Array.isArray(res.data)) {
        return res.data;
      }
      
      // Check if data is nested deeper (res.data.data)
      if (res?.data?.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      
      // If single object, wrap in array
      if (res?.data && typeof res.data === 'object') {
        return [res.data];
      }
      
      // Fallback to empty array
      console.warn('⚠️ Unexpected response structure:', res);
      return [];
    }
  });

export const adminClubQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'clubs', id],
    queryFn: () => getAdminClubApi(id),
    select: (res) => {
      // Handle different response structures from backend
      console.log('📊 Admin Club Detail Raw Response:', res);
      
      // Check if data is directly accessible
      if (res?.data && typeof res.data === 'object') {
        return res.data;
      }
      
      // Check if response is the club object itself
      if (res && typeof res === 'object' && res.id) {
        return res;
      }
      
      // Fallback
      console.warn('⚠️ Unexpected club response structure:', res);
      return res;
    }
  });
