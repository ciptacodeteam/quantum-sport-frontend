import { getBookedInventoriesApi, getBookedInventoryApi } from '@/api/admin/bookedInventory';
import { queryOptions } from '@tanstack/react-query';
import type { SearchParamsData } from '@/types';

export type AdminBookedInventoryListItem = {
  id: string;
  inventory: {
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    price: number;
    isActive: boolean;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  booking: {
    id: string;
    status: string;
    totalPrice: number;
    customer?: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      image: string | null;
    } | null;
    invoice?: {
      id: string;
      number: string;
      status: string;
      total: number;
    } | null;
    courtSlots?: Array<{
      court: { id: string; name: string } | null;
      startAt: string;
      endAt: string;
      date: string;
      time: string;
    }>;
    createdAt?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type AdminBookedInventoryDetail = AdminBookedInventoryListItem & {
  courtSlots?: Array<{
    court: { id: string; name: string } | null;
    slot: {
      id: string;
      startAt: string;
      endAt: string;
      date: string;
      startTime: string;
      endTime: string;
    };
  }>;
  coaches: Array<{
    staff: { id: string; name: string };
    coachType: string;
    slot: { startAt: string; endAt: string };
  }>;
  ballboys: Array<{
    staff: { id: string; name: string };
    slot: { startAt: string; endAt: string };
  }>;
  invoice?:
    | ({
        id: string;
        number: string;
        status: string;
        total: number;
      } & {
        payment?: {
          method?: string | null;
        } | null;
      })
    | null;
};

export const adminBookedInventoriesQueryOptions = (queryParams?: SearchParamsData) =>
  queryOptions({
    queryKey: ['admin', 'booked-inventories', queryParams],
    queryFn: () => getBookedInventoriesApi(queryParams),
    select: (res) => res.data as AdminBookedInventoryListItem[]
  });

export const adminBookedInventoryQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'booked-inventories', id],
    queryFn: () => getBookedInventoryApi(id),
    select: (res) => res.data as AdminBookedInventoryDetail
  });
