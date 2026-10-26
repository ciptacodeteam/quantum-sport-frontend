import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('./PaymentCountdown', () => ({ default: () => null }));
import PaymentActionCard from './PaymentActionCard';
const base = { id: 'test', status: 'PENDING', total: 302331 };
afterEach(cleanup);
it('renders a local SVG QR from payment data', () => {
  const { container } = render(
    <PaymentActionCard
      invoice={{
        ...base,
        paymentMeta: {
          channel_code: 'QRIS',
          actions: [{ descriptor: 'QR_STRING', value: 'actual-code' }]
        }
      }}
      canPay
    />
  );
  expect(screen.getByTitle('Kode QRIS pembayaran')).toBeInTheDocument();
  expect(container.querySelector('img')).toBeNull();
  expect(screen.getByText('Rp302.331')).toBeInTheDocument();
});
it('copies the exact VA number including leading zeros', async () => {
  const copy = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copy } });
  render(
    <PaymentActionCard
      invoice={{
        ...base,
        payment: { method: { channel: 'BCA_VIRTUAL_ACCOUNT' } },
        paymentInstructions: { accountNumber: '001234567890' }
      }}
      canPay
    />
  );
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Salin nomor Virtual Account' }));
  });
  expect(copy).toHaveBeenCalledWith('001234567890');
  expect(screen.queryByTitle('Kode QRIS pembayaran')).toBeNull();
});
it('does not show payment instructions when payment is no longer available', () => {
  const { container } = render(
    <PaymentActionCard invoice={{ ...base, status: 'PAID' }} canPay={false} />
  );
  expect(container).toBeEmptyDOMElement();
});
