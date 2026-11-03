import {
  getBookingApi,
  getCourtBookingTableApi,
  getBookingsApi,
  getOngoingBookingsApi,
  getScheduleApi
} from '@/api/admin/booking';
import type { Booking, OngoingBookingItem } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';
import type { SearchParamsData } from '@/types';

export const adminBookingsQueryOptions = (queryParams?: SearchParamsData) =>
  queryOptions({
    queryKey: ['admin', 'bookings', queryParams],
    queryFn: () => getBookingsApi(queryParams),
    select: (res) => res.data as Booking[]
  });

export const adminBookingQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'bookings', id],
    queryFn: ({ signal }) => getBookingApi(id, signal),
    select: (res) => res.data as Booking
  });

export const ongoingBookingsQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'bookings', 'ongoing-schedule'],
    queryFn: getOngoingBookingsApi,
    staleTime: 1000 * 60 * 2, // 2 minutes (more frequent updates for ongoing bookings)
    refetchInterval: 1000 * 60 * 2, // Auto-refetch every 2 minutes
    select: (res) => res.data as OngoingBookingItem[]
  });

export const adminScheduleQueryOptions = (queryParams?: SearchParamsData) =>
  queryOptions({
    queryKey: ['admin', 'schedule', queryParams],
    queryFn: () => getScheduleApi(queryParams),
    select: (res) => res.data as Booking[]
  });

export type CourtBookingPage = { items: Booking[]; total: number; page: number; limit: number };
export const adminBookingTableQueryOptions = (params: SearchParamsData) =>
  queryOptions({
    queryKey: ['admin', 'bookings', 'table', params],
    queryFn: ({ signal }) => getCourtBookingTableApi(params, signal),
    select: (res) => res.data as CourtBookingPage
  });
