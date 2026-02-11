/**
 * Xendit Cards Session JS Integration (CORRECT FLOW)
 * Official documentation: https://docs.xendit.co/docs/cards-collecting-card-information
 *
 * Flow:
 * 1. Backend creates Payment Session (POST /sessions) → returns payment_session_id
 * 2. Frontend loads v3/xendit.js script
 * 3. Call Xendit.payment.collectCardData() with payment_session_id
 * 4. Xendit.js AUTOMATICALLY creates Payment Request
 * 5. Returns payment_request_id (pr-xxx) + action_url (3DS link)
 * 6. Redirect user to action_url for 3DS authentication
 * 7. Bank auto-redirects to success/failure URL after 3DS
 * 8. Backend receives webhook: payment.capture
 */

import { env } from '@/env';

// Xendit v3 JS types
declare global {
  interface Window {
    Xendit?: {
      setPublishableKey: (key: string) => void;
      payment: {
        collectCardData: (
          cardData: XenditCardSessionData,
          responseHandler: (
            error: XenditError | null,
            response: XenditCollectCardResponse | null
          ) => void
        ) => void;
      };
    };
  }
}

export type XenditCardSessionData = {
  payment_session_id: string; // From backend Payment Session
  card_number: string;
  expiry_month: string; // 2-digit month (01-12)
  expiry_year: string; // 4-digit year (YYYY format, e.g., '2030')
  cvn: string;
  cardholder_first_name?: string; // Optional
  cardholder_last_name?: string; // Optional
  cardholder_email?: string; // Optional
  cardholder_phone_number?: string; // Optional
};

export type XenditError = {
  error_code: string;
  message: string;
};

export type XenditCollectCardResponse = {
  payment_request_id: string; // pr-xxx
  action_url: string; // 3DS authentication URL
  status: string; // REQUIRES_ACTION
};

export type CollectCardResult = {
  paymentRequestId: string; // pr-xxx from Xendit
  actionUrl: string; // 3DS redirect URL
  status: string; // REQUIRES_ACTION
};

// Use Xendit JS v3 for Payment Session
const XENDIT_SCRIPT_URL = 'https://js.xendit.co/cards-session.min.js';
let scriptLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Load Xendit JS script dynamically
 */
export const loadXenditScript = (): Promise<void> => {
  if (scriptLoaded) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Xendit script can only be loaded in browser environment'));
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src="${XENDIT_SCRIPT_URL}"]`);
    if (existingScript) {
      scriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = XENDIT_SCRIPT_URL;
    script.type = 'text/javascript';
    script.async = true;

    script.onload = () => {
      scriptLoaded = true;
      // Set publishable key after script loads
      const publicKey = getXenditPublicKey();
      if (window.Xendit && publicKey) {
        window.Xendit.setPublishableKey(publicKey);
      }
      resolve();
    };

    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Xendit JS'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

/**
 * Collect card data using Xendit Card Session JS
 * This automatically creates Payment Request and returns action_url for 3DS
 *
 * @param paymentSessionId - Payment session ID from backend (session_xxx)
 * @param cardData - Card information from user input
 * @returns Payment Request ID and action URL for 3DS redirect
 */
export const collectCardData = async (params: {
  paymentSessionId: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  cardholderFirstName?: string;
  cardholderLastName?: string;
  cardholderEmail?: string;
  cardholderPhoneNumber?: string;
}): Promise<CollectCardResult> => {
  // Ensure script is loaded
  await loadXenditScript();

  if (!window.Xendit) {
    throw new Error('Xendit Card Session JS not loaded');
  }

  // Format card data
  const cardNumber = params.cardNumber.replace(/\s/g, '');

  // Xendit Cards Session expects 4-digit year (YYYY format)
  let fullYear = params.expiryYear;
  if (fullYear < 100) {
    // 2-digit year - convert to 4-digit (e.g., 30 → 2030)
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    fullYear = currentCentury + fullYear;
  }

  const cardData: XenditCardSessionData = {
    payment_session_id: params.paymentSessionId,
    card_number: cardNumber,
    expiry_month: String(params.expiryMonth).padStart(2, '0'),
    expiry_year: String(fullYear), // 4-digit year (YYYY)
    cvn: params.cvv
  };

  // Add optional cardholder information if provided
  if (params.cardholderFirstName) {
    cardData.cardholder_first_name = params.cardholderFirstName;
  }
  if (params.cardholderLastName) {
    cardData.cardholder_last_name = params.cardholderLastName;
  }
  if (params.cardholderEmail) {
    cardData.cardholder_email = params.cardholderEmail;
  }
  if (params.cardholderPhoneNumber) {
    cardData.cardholder_phone_number = params.cardholderPhoneNumber;
  }

  console.log('Sending card data to Xendit:', {
    payment_session_id: params.paymentSessionId,
    expiry_month: cardData.expiry_month,
    expiry_year: cardData.expiry_year,
    card_number_length: cardNumber.length,
    cvn_length: params.cvv.length
  });

  return new Promise((resolve, reject) => {
    window.Xendit!.payment.collectCardData(cardData, (error, response) => {
      if (error) {
        console.error('Xendit card collection error:', error);
        reject(new Error(error.message || 'Card collection failed'));
        return;
      }

      if (!response || !response.payment_request_id || !response.action_url) {
        reject(new Error('Invalid response from Xendit - missing payment request data'));
        return;
      }

      // Log for verification
      console.log('Payment Request created:', response.payment_request_id);
      console.log('3DS action URL:', response.action_url);
      console.log('Status:', response.status);

      resolve({
        paymentRequestId: response.payment_request_id,
        actionUrl: response.action_url,
        status: response.status
      });
    });
  });
};

/**
 * Get Xendit publishable key from environment
 */
export const getXenditPublicKey = (): string => {
  const key = env.NEXT_PUBLIC_XENDIT_PUBLIC_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_XENDIT_PUBLIC_KEY is not configured');
  }
  return key;
};
