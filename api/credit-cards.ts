import { api } from '@/lib/api';
import type {
  CardCheckoutPayload,
  CheckoutResponse,
  ListCreditCardsResponse,
  MembershipCardCheckoutPayload,
  SaveCreditCardResponse
} from '@/types/model';

export type SaveCreditCardPayload = {
  cardToken: string; // payment_method_id from Xendit JS
  cardBrand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault?: boolean;
};

/**
 * Save a new credit card using Xendit payment_method_id
 * POST /credit-cards
 */
export const saveCreditCardApi = async (
  payload: SaveCreditCardPayload
): Promise<SaveCreditCardResponse> => {
  const response = await api.post('/credit-cards', payload);
  return response.data;
};

/**
 * List all saved credit cards for the user
 * GET /credit-cards
 */
export const listCreditCardsApi = async (): Promise<ListCreditCardsResponse> => {
  const response = await api.get('/credit-cards');
  return response.data;
};

/**
 * Get a single credit card by ID
 * GET /credit-cards/:id
 */
export const getCreditCardApi = async (id: string): Promise<SaveCreditCardResponse> => {
  const response = await api.get(`/credit-cards/${id}`);
  return response.data;
};

/**
 * Update a credit card (e.g., mark as default)
 * PUT /credit-cards/:id
 */
export const updateCreditCardApi = async (
  id: string,
  payload: Partial<{ isDefault: boolean }>
): Promise<SaveCreditCardResponse> => {
  const response = await api.put(`/credit-cards/${id}`, payload);
  return response.data;
};

/**
 * Delete a credit card
 * DELETE /credit-cards/:id
 */
export const deleteCreditCardApi = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/credit-cards/${id}`);
  return response.data;
};

/**
 * Checkout with credit card for booking/court slots
 * POST /checkout
 */
export const cardCheckoutApi = async (payload: CardCheckoutPayload): Promise<CheckoutResponse> => {
  const response = await api.post('/checkout', payload);
  return response.data?.data || response.data;
};

/**
 * Checkout with credit card for membership
 * POST /checkout/membership
 */
export const membershipCardCheckoutApi = async (
  payload: MembershipCardCheckoutPayload
): Promise<CheckoutResponse> => {
  const response = await api.post('/checkout/membership', payload);
  return response.data?.data || response.data;
};
