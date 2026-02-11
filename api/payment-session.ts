import { api } from '@/lib/api';

export interface CancelPaymentSessionPayload {
  sessionId: string;
}

export interface CancelPaymentSessionResponse {
  success: boolean;
  data: {
    sessionId: string;
    status: string;
    message: string;
  };
  message: string;
}

/**
 * Cancel a Xendit payment session
 */
export const cancelPaymentSession = async (
  payload: CancelPaymentSessionPayload
): Promise<CancelPaymentSessionResponse> => {
  const response = await api.post<CancelPaymentSessionResponse>(
    '/payment-sessions/cancel',
    payload
  );
  return response.data;
};
