import { adminApi } from '@/lib/adminApi';

export type CoachingPerson = {
  id: string;
  branchId: string;
  name: string;
  phone: string | null;
  role: 'COACH' | 'BALLBOY';
  coachType: 'PADEL' | 'TENNIS' | 'PADEL_TENNIS' | null;
  coachProfile: string | null;
  isActive: boolean;
};
export type CoachingProfile = {
  name: string;
  kind: 'COACH' | 'BALLBOY';
  coachType?: 'PADEL' | 'TENNIS' | 'PADEL_TENNIS';
  phone?: string;
  coachProfile?: string;
  isActive: boolean;
};
export type CoachingSlot = {
  id: string;
  startAt: string;
  endAt: string;
  price: number;
  isAvailable: boolean;
  booked: boolean;
};
export type CoachingOption = {
  slotId: string;
  staffId: string;
  name: string;
  kind: 'COACH' | 'BALLBOY';
  coachType: string | null;
  price: number;
  startAt: string;
  endAt: string;
};
export type CoachingBooking = {
  id: string;
  bookingId: string;
  name: string;
  customer: string;
  phone: string | null;
  court: string;
  startAt: string;
  endAt: string;
  price: number;
  status: string;
  invoice: { id: string; number: string; status: string; total: number; dueDate: string } | null;
};
export const coachingApi = {
  list: async () => (await adminApi.get('/coaching')).data.data as CoachingPerson[],
  person: async (id: string) => (await adminApi.get(`/coaching/${id}`)).data.data as CoachingPerson,
  save: async (id: string | undefined, input: CoachingProfile) =>
    id ? adminApi.put(`/coaching/${id}`, input) : adminApi.post('/coaching', input),
  schedule: async (id: string, fromDate: string, toDate: string) =>
    (await adminApi.get(`/coaching/${id}/schedule`, { params: { fromDate, toDate } })).data
      .data as CoachingSlot[],
  saveSchedule: async (
    id: string,
    data: {
      fromDate: string;
      toDate: string;
      days: number[];
      startHour: number;
      endHour: number;
      price: number;
    }
  ) =>
    (await adminApi.post(`/coaching/${id}/schedule`, data)).data.data as {
      created: number;
      updated: number;
      skipped: number;
    },
  toggle: async (id: string, isAvailable: boolean) =>
    adminApi.patch(`/coaching/slots/${id}`, { isAvailable }),
  available: async (detailId: string, startAt: string, endAt: string) =>
    (
      await adminApi.get(`/coaching/booking-details/${detailId}/availability`, {
        params: { startAt, endAt }
      })
    ).data.data as CoachingOption[],
  attach: async (detailId: string, slotId: string, paymentMethodId?: string) =>
    (
      await adminApi.post(`/coaching/booking-details/${detailId}/services`, {
        slotId,
        paymentMethodId
      })
    ).data.data as {
      bookingId: string;
      invoiceId: string;
      invoiceNumber: string;
      total: number;
      status: string;
      dueDate: string;
    },
  bookings: async (kind: 'COACH' | 'BALLBOY') =>
    (await adminApi.get('/coaching/bookings', { params: { kind } })).data.data as CoachingBooking[]
};
