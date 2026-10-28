import { getBookedInventoriesApi, getBookedInventoryApi } from '@/api/admin/bookedInventory';
import { queryOptions } from '@tanstack/react-query';
import type { SearchParamsData } from '@/types';

export type BookedCustomer = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  image?: string | null;
};
export type BookedInvoice = {
  id: string;
  number: string;
  status: string;
  total: number;
  payment?: { method?: string | { name?: string } | null } | null;
};
export type BookedCourtSlot = {
  court?: { id: string; name: string } | null;
  startAt?: string;
  endAt?: string;
  date?: string;
  time?: string;
  slot?: { id?: string; startAt: string; endAt: string };
};
export type AdminBookedInventoryListItem = {
  id: string;
  itemType?: 'inventory' | 'ballboy' | 'coach';
  category?: 'bola' | 'raket' | 'ballboy' | 'coach' | 'inventory';
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
    customer?: BookedCustomer | null;
    user?: BookedCustomer | null;
    invoice?: BookedInvoice | null;
    courtSlots?: BookedCourtSlot[];
    createdAt?: string;
  };
  customer?: BookedCustomer | null;
  invoice?: BookedInvoice | null;
  courtSlots?: BookedCourtSlot[];
  serviceStaff?: { id: string; name: string; email?: string | null; phone?: string | null } | null;
  coachType?: { id: string; name: string; description?: string | null } | null;
  slot?: { startAt: string; endAt: string; court?: { id: string; name: string } | null } | null;
  createdAt: string;
  updatedAt: string;
};
export type AdminBookedInventoryDetail = AdminBookedInventoryListItem & {
  coaches?: Array<{
    staff: { id: string; name: string };
    coachType: string | { name?: string };
    slot: { startAt: string; endAt: string };
  }>;
  ballboys?: Array<{
    staff: { id: string; name: string };
    slot: { startAt: string; endAt: string };
  }>;
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
