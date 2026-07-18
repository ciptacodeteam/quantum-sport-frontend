import { getBookedBallboyApi, getBookedBallboysApi } from '@/api/admin/bookedBallboy';
import { queryOptions } from '@tanstack/react-query';
import type { SearchParamsData } from '@/types';

export type AdminBookedBallboyListItem = {
  id: string;
  staff?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    image?: string | null;
    role?: string;
  } | null;
  slot?: {
    id?: string;
    startAt: string;
    endAt: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    price?: number;
    isAvailable?: boolean;
  } | null;
  courtSlot?: {
    id: string;
    startAt: string;
    endAt: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    court?: { id: string; name: string; sport?: string } | null;
  } | null;
  booking: {
    id: string;
    status: string;
    totalPrice?: number;
    customer?: {
      id: string;
      name: string;
      email?: string;
      phone?: string | null;
      image?: string | null;
    } | null;
    user?: {
      id: string;
      name: string;
      email?: string;
      phone?: string | null;
      image?: string | null;
    } | null;
    invoice?: {
      id: string;
      number: string;
      status: string;
      total?: number;
      payment?: { method?: string | { name?: string } | null } | null;
    } | null;
    courtSlots?: Array<{
      court: { id: string; name: string; sport?: string } | null;
      slot?: {
        id?: string;
        startAt: string;
        endAt: string;
        date?: string;
        startTime?: string;
        endTime?: string;
      } | null;
      startAt?: string;
      endAt?: string;
      date?: string;
      time?: string;
    }>;
    details?: Array<{
      id?: string;
      court?: { id: string; name: string; sport?: string } | null;
      slot?: {
        id?: string;
        startAt: string;
        endAt: string;
        date?: string;
        startTime?: string;
        endTime?: string;
      } | null;
    }>;
    createdAt?: string;
  };
  price: number;
  createdAt: string;
  updatedAt?: string;
};

export type AdminBookedBallboyDetail = AdminBookedBallboyListItem;

export const adminBookedBallboysQueryOptions = (queryParams?: SearchParamsData) =>
  queryOptions({
    queryKey: ['admin', 'booked-ballboys', queryParams],
    queryFn: () => getBookedBallboysApi(queryParams),
    select: (res) => res.data as AdminBookedBallboyListItem[]
  });

export const adminBookedBallboyQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'booked-ballboys', id],
    queryFn: () => getBookedBallboyApi(id),
    select: (res) => res.data as AdminBookedBallboyDetail
  });
