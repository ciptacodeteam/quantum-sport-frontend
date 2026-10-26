import { api } from '@/lib/api';

type MidtransConfig = { clientKey: string; sandbox: boolean };
type TokenResponse = {
  token_id?: string;
  status_code?: string;
  status_message?: string;
  validation_messages?: string[];
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
