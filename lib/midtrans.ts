import { api } from '@/lib/api';

type MidtransConfig = {
  clientKey: string;
  sandbox: boolean;
  checkoutMode?: 'snap' | 'core';
  snapJsUrl?: string;
};

type TokenResponse = {
  token_id?: string;
  status_code?: string;
  status_message?: string;
  validation_messages?: string[];
};

type SnapResult = {
  status_code?: string;
  status_message?: string;
  transaction_status?: string;
  order_id?: string;
  fraud_status?: string;
};

type SnapPayCallbacks = {
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: SnapResult) => void;
  onClose?: () => void;
};

declare global {
  interface Window {
    MidtransNew3ds?: {
      getCardToken: (
        card: {
          card_number: string;
          card_cvv: string;
          card_exp_month: string;
          card_exp_year: string;
        },
        callbacks: {
          onSuccess: (response: TokenResponse) => void;
          onFailure: (response: TokenResponse) => void;
        }
      ) => void;
      redirect: (redirectUrl: string, options?: { callbackUrl?: string }) => void;
    };
    snap?: {
      pay: (token: string, options?: SnapPayCallbacks) => void;
    };
  }
}

let configPromise: Promise<MidtransConfig> | null = null;

export function getMidtransConfig() {
  configPromise ??= api.get('/midtrans/client-config').then((res) => res.data.data as MidtransConfig);
  return configPromise;
}

export async function loadMidtransScript() {
  const config = await getMidtransConfig();
  if (!config?.clientKey) throw new Error('Payment config unavailable');
  const environment = config.sandbox ? 'sandbox' : 'production';
  let script = document.getElementById('midtrans-script') as HTMLScriptElement | null;
  if (!script) {
    script = document.querySelector('script[src*="midtrans-new-3ds"]');
  }
  if (!script) {
    script = document.createElement('script');
    script.id = 'midtrans-script';
    script.src = 'https://api.midtrans.com/v2/assets/js/midtrans-new-3ds.min.js';
    script.setAttribute('data-environment', environment);
    script.setAttribute('data-client-key', config.clientKey);
    await new Promise<void>((resolve, reject) => {
      script!.onload = () => resolve();
      script!.onerror = () => reject(new Error('Failed to load payment system'));
      document.body.appendChild(script!);
    });
  }
  script.id = 'midtrans-script';
  script.setAttribute('data-environment', environment);
  script.setAttribute('data-client-key', config.clientKey);
  if (!window.MidtransNew3ds) throw new Error('Payment system is not ready');
  return config;
}

export async function loadSnapScript() {
  const config = await getMidtransConfig();
  if (!config?.clientKey) throw new Error('Payment config unavailable');
  const snapJsUrl =
    config.snapJsUrl ||
    (config.sandbox
      ? 'https://app.sandbox.midtrans.com/snap/snap.js'
      : 'https://app.midtrans.com/snap/snap.js');

  let script = document.getElementById('midtrans-snap-script') as HTMLScriptElement | null;
  if (!script) {
    script = document.querySelector(`script[src="${snapJsUrl}"]`);
  }
  if (!script) {
    script = document.createElement('script');
    script.id = 'midtrans-snap-script';
    script.src = snapJsUrl;
    script.setAttribute('data-client-key', config.clientKey);
    await new Promise<void>((resolve, reject) => {
      script!.onload = () => resolve();
      script!.onerror = () => reject(new Error('Failed to load Snap payment'));
      document.body.appendChild(script!);
    });
  } else {
    script.id = 'midtrans-snap-script';
    script.setAttribute('data-client-key', config.clientKey);
  }
  if (!window.snap?.pay) throw new Error('Snap payment is not ready');
  return config;
}

export async function payWithSnap(token: string, callbacks: SnapPayCallbacks = {}) {
  await loadSnapScript();
  if (!window.snap?.pay) throw new Error('Snap payment is not ready');
  window.snap.pay(token, callbacks);
}

export async function getCardToken(card: {
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
}) {
  await loadMidtransScript();
  if (!window.MidtransNew3ds) throw new Error('Payment system is not ready');
  return new Promise<string>((resolve, reject) => {
    window.MidtransNew3ds!.getCardToken(
      {
        card_number: card.cardNumber.replace(/\s+/g, ''),
        card_cvv: card.cvv,
        card_exp_month: String(card.expiryMonth).padStart(2, '0'),
        card_exp_year: String(card.expiryYear)
      },
      {
        onSuccess: (response) => {
          if (!response.token_id) {
            reject(new Error(response.status_message || 'Card token was not created'));
            return;
          }
          resolve(response.token_id);
        },
        onFailure: (response) => {
          reject(
            new Error(
              response.validation_messages?.[0] || response.status_message || 'Card was rejected'
            )
          );
        }
      }
    );
  });
}
