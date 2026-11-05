import type { PaymentMethod } from '@/types/model';
export function isOfflinePaymentMethod(
  method: Pick<PaymentMethod, 'isActive' | 'isOffline' | 'channel'>
) {
  return (
    method.isActive &&
    (method.isOffline === true ||
      ['CASH', 'EDC', 'QRIS_STATIC', 'BANK_TRANSFER_MANUAL'].includes(method.channel ?? ''))
  );
}
