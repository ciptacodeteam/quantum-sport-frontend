import { describe, expect, it } from 'vitest';
import { getInvoicePayment, type PaymentInvoice } from './invoice-payment';
const base: PaymentInvoice = { id: 'invoice', total: 300000, status: 'PENDING' };
describe('invoice payment instructions', () => {
  it('reads QRIS payload from Xendit actions without a remote QR service', () => {
    const info = getInvoicePayment({
      ...base,
      paymentMeta: {
        channel_code: 'QRIS',
        actions: [{ descriptor: 'QR_STRING', value: 'actual-qr-payload' }]
      }
    });
    expect(info.isQRIS).toBe(true);
    expect(info.qrString).toBe('actual-qr-payload');
    expect(info.isVA).toBe(false);
  });
  it('reads bank-specific VA channels and preserves leading zeros', () => {
    const info = getInvoicePayment({
      ...base,
      dueDate: '2026-10-23T10:00:00Z',
      payment: {
        method: { channel: 'BCA_VIRTUAL_ACCOUNT' },
        meta: {
          actions: [
            {
              descriptor: 'VIRTUAL_ACCOUNT_NUMBER',
              value: '001234567890',
              expiry: '2026-10-24T10:00:00Z'
            }
          ]
        }
      }
    });
    expect(info.isVA).toBe(true);
    expect(info.vaNumber).toBe('001234567890');
    expect(info.expiresAt).toBe('2026-10-23T10:00:00Z');
  });
  it('supports normalized API instructions and rejects unsafe redirect URLs', () => {
    const info = getInvoicePayment({
      ...base,
      paymentUrl: 'javascript:alert(1)',
      paymentInstructions: {
        type: 'VIRTUAL_ACCOUNT',
        accountNumber: '00001234',
        accountName: 'BLACK PADEL'
      }
    });
    expect(info.vaNumber).toBe('00001234');
    expect(info.displayName).toBe('BLACK PADEL');
    expect(info.isVA).toBe(true);
    expect(info.paymentUrl).toBeUndefined();
  });
});
