import type { CoachingGroupSummary } from './coachingGroup';
import { adminApi } from '@/lib/adminApi';

export type RollingServiceSchedule = {
  followCourtWindow: true;
  additionalHourPrice?: number | null;
  days: number[];
  startHour: number;
  endHour: number;
  price: number;
};
export type CoachingPerson = {
  id: string;
  branchId: string;
  name: string;
  phone: string | null;
  role: 'COACH' | 'BALLBOY';
  coachType: 'PADEL' | 'TENNIS' | 'PADEL_TENNIS' | null;
  coachProfile: string | null;
  coachingGroups?: { group: CoachingGroupSummary }[];
  isActive: boolean;
  rollingServiceSchedule?: RollingServiceSchedule | null;
};
export type CoachingProfile = {
  name: string;
  kind: 'COACH' | 'BALLBOY';
  coachType?: 'PADEL' | 'TENNIS' | 'PADEL_TENNIS';
  phone?: string;
  coachProfile?: string;
  groupIds?: string[];
  isActive: boolean;
};
export type CoachingSlot = {
  additionalHourPrice?: number | null;
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
  groups?: CoachingGroupSummary[];
  price: number;
  startAt: string;
  endAt: string;
};
export type CoachingBooking = {
  id: string;
  bookingId: string;
  name: string;
  coachingGroupName?: string | null;
  customer: string;
  phone: string | null;
  court: string;
  startAt: string;
  endAt: string;
  price: number;
  status: string;
  invoice: { id: string; number: string; status: string; total: number; dueDate: string } | null;
};
export type CoachReplacementAvailability = {
  current: {
    coachingGroupId?: string | null;
    coachingGroupName?: string | null;
    id: string;
    slotId: string;
    name: string;
    price: number;
    startAt: string;
    endAt: string;
  };
  options: Array<{
    slotId: string;
    staffId: string;
    name: string;
    price: number;
    coachingGroupId?: string | null;
    coachingGroupName?: string | null;
  }>;
};
export type CoachCancellationPreview = {
  current: {
    id: string;
    slotId: string;
    name: string;
    price: number;
    startAt: string;
    endAt: string;
  };
  invoiceNumber: string | null;
  refundRequired: boolean;
};
export const coachingApi = {
  list: async () => (await adminApi.get('/coaching')).data.data as CoachingPerson[],
  person: async (id: string) => (await adminApi.get(`/coaching/${id}`)).data.data as CoachingPerson,
  save: async (id: string | undefined, input: CoachingProfile) =>
    id ? adminApi.put(`/coaching/${id}`, input) : adminApi.post('/coaching', input),
  schedule: async (id: string, fromDate?: string, toDate?: string) =>
    (await adminApi.get(`/coaching/${id}/schedule`, { params: { fromDate, toDate } })).data
      .data as CoachingSlot[],
  saveSchedule: async (id: string, data: RollingServiceSchedule) =>
    (await adminApi.post(`/coaching/${id}/schedule`, data)).data.data as {
      created: number;
      updated: number;
      skipped: number;
    },
  toggle: async (id: string, isAvailable: boolean) =>
    adminApi.patch(`/coaching/slots/${id}`, { isAvailable }),
  updatePrice: async (id: string, price: number) =>
    adminApi.patch(`/coaching/slots/${id}`, { price }),
  available: async (detailId: string, startAt: string, endAt: string, signal?: AbortSignal) =>
    (
      await adminApi.get(`/coaching/booking-details/${detailId}/availability`, {
        params: { startAt, endAt },
        signal,
        timeout: 15000
      })
    ).data.data as CoachingOption[],
  attach: async (
    detailId: string,
    slotIds: string[],
    paymentMethodId?: string,
    manualPayment?: { method?: 'EDC' | 'QRIS_STATIC' | 'BANK_TRANSFER_MANUAL'; received: boolean },
    coachingGroupId?: string
  ) =>
    (
      await adminApi.post(`/coaching/booking-details/${detailId}/services`, {
        slotIds,
        coachingGroupId,
        manualPayment,
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
  cancellation: async (id: string) =>
    (await adminApi.get(`/coaching/bookings/${id}/cancellation`)).data
      .data as CoachCancellationPreview,
  cancelCoach: async (id: string, input: { expectedSlotId: string; reason: string }) =>
    (await adminApi.post(`/coaching/bookings/${id}/cancel-coach`, input)).data.data as {
      id: string;
      bookingId: string;
      name: string;
      price: number;
      refundRequired: boolean;
      slotReleased: boolean;
    },
  ballboyCancellation: async (id: string) =>
    (await adminApi.get(`/booked-ballboys/${id}/cancellation`)).data
      .data as CoachCancellationPreview,
  cancelBallboy: async (id: string, input: { expectedSlotId: string; reason: string }) =>
    (await adminApi.put(`/booked-ballboys/${id}/cancel`, input)).data.data as {
      id: string;
      bookingId: string;
      name: string;
      price: number;
      refundRequired: boolean;
      slotReleased: boolean;
    },
  replacements: async (id: string) =>
    (await adminApi.get(`/coaching/bookings/${id}/replacements`)).data
      .data as CoachReplacementAvailability,
  replaceCoach: async (
    id: string,
    input: { slotId: string; expectedSlotId: string; reason?: string; coachingGroupId?: string }
  ) =>
    (await adminApi.post(`/coaching/bookings/${id}/replace-coach`, input)).data.data as {
      id: string;
      bookingId: string;
      name: string;
      slotId: string;
      price: number;
    },
  bookings: async (kind: 'COACH' | 'BALLBOY', dates: { dateFrom?: string; dateTo?: string } = {}) =>
    (await adminApi.get('/coaching/bookings', { params: { kind, ...dates } })).data
      .data as CoachingBooking[]
};
