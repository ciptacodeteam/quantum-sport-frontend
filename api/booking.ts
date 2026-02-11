import { api } from '@/lib/api';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData } from '@/types';

export async function createBookingApi(payload: CreateMutationPayload) {
  const { data } = await api.post('/bookings', payload.data);
  return data;
}

export async function getBookingsApi(queryParams: SearchParamsData = {}) {
  const url = '/bookings';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await api.get(mergedUrl);
  return res.data;
}

export async function checkoutApi(payload: any) {
  const { data } = await api.post('/checkout', payload);
  return data;
}

export async function getInvoiceApi(invoiceId: string) {
  const { data } = await api.get(`/invoices/${invoiceId}`);
  return data;
}

export async function getAllInvoicesApi(queryParams: SearchParamsData = {}) {
  const url = '/invoices';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await api.get(mergedUrl);
  return res.data;
}

export async function expireInvoiceApi(invoiceId: string) {
  const { data } = await api.post(`/invoices/${invoiceId}/expire`);
  return data;
}

export interface CancelBookingPayload {
  reason: string;
}

export interface CancelBookingResponse {
  success: boolean;
  data: {
    bookingId: string;
    invoiceNumber: string;
    status: string;
    releasedSlots: {
      courtSlots: number;
      coachSlots: number;
      ballboySlots: number;
    };
    restoredInventories: number;
    refund?: {
      refundPending: boolean;
      amount: number;
      message: string;
    };
  };
  message: string;
}

/**
 * Cancel a booking and release all resources
 */
export async function cancelBookingApi(
  invoiceId: string,
  payload: CancelBookingPayload
): Promise<CancelBookingResponse> {
  const { data } = await api.post<CancelBookingResponse>(
    `/invoices/${invoiceId}/cancel-booking`,
    payload
  );
  return data;
}
