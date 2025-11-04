import { getBookingApi, getBookingsApi } from '@/api/admin/booking';
import type { Booking } from '@/types/model';
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
    queryFn: () => getBookingApi(id),
    select: (res) => res.data as Booking
  });

