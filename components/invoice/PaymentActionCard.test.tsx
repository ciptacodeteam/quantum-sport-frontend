import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ pay: vi.fn() }));
vi.mock('./PaymentCountdown', () => ({ default: () => null }));
vi.mock('@/lib/midtrans', () => ({ payWithSnap: mocks.pay }));
import PaymentActionCard from './PaymentActionCard';
const base = { id: 'test', status: 'PENDING', total: 302331 };
beforeEach(() => {
  mocks.pay.mockReset().mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const snapMeta = {
  gateway: 'midtrans',
  checkout_mode: 'snap',
  snap_token: 'same-token',
  redirect_url: 'https://app.midtrans.com/snap/v2/vtweb/same-token'
};

it.each(['QRIS', 'BCA_VIRTUAL_ACCOUNT', 'CARDS'])(
  'reopens the saved Snap token for %s after closing',
  async (channel_code) => {
    const refresh = vi.fn();
    render(
      <PaymentActionCard
        invoice={{ ...base, paymentMeta: { ...snapMeta, channel_code } }}
        canPay
        onRefresh={refresh}
      />
    );
    expect(screen.queryByText(/belum tersedia/)).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Lanjutkan pembayaran' }));
    });
    expect(mocks.pay).toHaveBeenCalledWith('same-token', expect.any(Object));
    expect(screen.getByRole('button', { name: 'Pembayaran sedang dibuka...' })).toBeDisabled();
    act(() => mocks.pay.mock.calls[0][1].onClose());
    expect(refresh).toHaveBeenCalledTimes(1);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Lanjutkan pembayaran' }));
    });
    expect(mocks.pay).toHaveBeenCalledTimes(2);
    expect(mocks.pay.mock.calls[1][0]).toBe('same-token');
  }
);
it.each(['onSuccess', 'onPending', 'onError'])(
  'refreshes authoritative invoice status after Snap %s',
  async (callback) => {
    const refresh = vi.fn();
    render(
      <PaymentActionCard invoice={{ ...base, paymentMeta: snapMeta }} canPay onRefresh={refresh} />
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Lanjutkan pembayaran' }));
    });
    act(() => mocks.pay.mock.calls[0][1][callback]({}));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Lanjutkan pembayaran' })).toBeEnabled();
  }
);
it('allows retry and a saved URL fallback when Snap fails to load', async () => {
  mocks.pay.mockRejectedValueOnce(new Error('script unavailable'));
  render(<PaymentActionCard invoice={{ ...base, paymentMeta: snapMeta }} canPay />);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Lanjutkan pembayaran' }));
  });
  expect(screen.getByRole('button', { name: 'Lanjutkan pembayaran' })).toBeEnabled();
  expect(screen.getByRole('link', { name: 'Buka halaman pembayaran' })).toHaveAttribute(
    'href',
    snapMeta.redirect_url
  );
});
it('uses the saved Snap URL when the token is unavailable, even for QRIS', () => {
  render(
    <PaymentActionCard
      invoice={{
        ...base,
        paymentMeta: { ...snapMeta, snap_token: undefined, channel_code: 'QRIS' }
      }}
      canPay
    />
  );
  expect(screen.getByRole('link', { name: /Lanjutkan pembayaran/ })).toHaveAttribute(
    'href',
    snapMeta.redirect_url
  );
});
it.each(['PAID', 'FAILED', 'EXPIRED', 'CANCELLED'])('does not resume a %s invoice', (status) => {
  const { container } = render(
    <PaymentActionCard invoice={{ ...base, status, paymentMeta: snapMeta }} canPay />
  );
  expect(container).toBeEmptyDOMElement();
  expect(mocks.pay).not.toHaveBeenCalled();
});
it('does not open Snap when the expiry passes after the invoice rendered', async () => {
  const now = vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-01T00:00:00Z'));
  const refresh = vi.fn();
  render(
    <PaymentActionCard
      invoice={{ ...base, paymentMeta: snapMeta, dueDate: '2026-11-01T00:01:00Z' }}
      canPay
      onRefresh={refresh}
    />
  );
  now.mockReturnValue(Date.parse('2026-11-01T00:02:00Z'));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Lanjutkan pembayaran' }));
  });
  expect(mocks.pay).not.toHaveBeenCalled();
  expect(refresh).toHaveBeenCalledTimes(1);
});
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
