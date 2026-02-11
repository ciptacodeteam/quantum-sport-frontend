'use client';

import { loadXenditScript, collectCardData } from '@/lib/xendit';
import { useEffect, useState } from 'react';

export type UseXenditCardCollectionResult = {
  collectCard: (params: {
    paymentSessionId: string;
    cardNumber: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    cardholderFirstName?: string;
    cardholderLastName?: string;
    cardholderEmail?: string;
    cardholderPhoneNumber?: string;
  }) => Promise<{
    paymentRequestId: string;
    actionUrl: string;
    status: string;
  }>;
  isLoading: boolean;
  error: string | null;
  isScriptReady: boolean;
};

/**
 * Hook for handling Xendit card collection with Payment Session
 * Loads card_session.js and collects card data to create Payment Request
 */
export function useXenditCardCollection(): UseXenditCardCollectionResult {
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Xendit script on mount
  useEffect(() => {
    loadXenditScript()
      .then(() => setIsScriptReady(true))
      .catch((err) => {
        console.error('Failed to load Xendit Card Session JS:', err);
        setError('Failed to load payment system. Please refresh the page.');
      });
  }, []);

  const collectCard = async (params: {
    paymentSessionId: string;
    cardNumber: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    cardholderFirstName?: string;
    cardholderLastName?: string;
    cardholderEmail?: string;
    cardholderPhoneNumber?: string;
  }): Promise<{
    paymentRequestId: string;
    actionUrl: string;
    status: string;
  }> => {
    setError(null);
    setIsLoading(true);

    try {
      // Collect card data using Xendit Card Session JS
      const result = await collectCardData(params);

      setIsLoading(false);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Card collection failed';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  return {
    collectCard,
    isLoading,
    error,
    isScriptReady
  };
}
