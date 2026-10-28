import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  response: { data: { number: 'INV-TEST', status: 'PAID' } } as any,
  error: false,
  pending: false,
  lookup: 'INV-TEST' as string | null
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(state.lookup ? `invoice_number=${state.lookup}` : '')
}));
vi.mock('@/components/headers/MainHeader', () => ({ default: () => null }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: state.response,
    isError: state.error,
    isPending: state.pending,
    isFetching: false,
    refetch: vi.fn()
  })
}));
vi.mock('motion/react', () => ({
  useReducedMotion: () => true,
  motion: {
    section: ({ initial, animate, transition, ...props }: any) => <section {...props} />,
    div: ({ initial, animate, transition, ...props }: any) => <div {...props} />,
    path: ({ initial, animate, transition, ...props }: any) => <path {...props} />
  }
}));
import PaymentResultPage from './PaymentResultPage';
beforeEach(() => {
  state.response = { data: { number: 'INV-TEST', status: 'PAID' } };
  state.error = false;
  state.pending = false;
  state.lookup = 'INV-TEST';
});
afterEach(cleanup);
it('shows success only after the invoice API confirms PAID', () => {
  render(<PaymentResultPage />);
  expect(screen.getByText('Pembayaran berhasil')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Lihat detail transaksi' })).toHaveAttribute(
    'href',
    '/invoice/INV-TEST'
  );
});
it('keeps showing verification when the server still reports pending', () => {
  state.response.data.status = 'PENDING';
  render(<PaymentResultPage />);
  expect(screen.getByText('Memeriksa pembayaran')).toBeInTheDocument();
  expect(screen.queryByText('Pembayaran berhasil')).toBeNull();
});
it('shows verified failed and expired states', () => {
  state.response.data.status = 'FAILED';
  const view = render(<PaymentResultPage />);
  expect(screen.getByText('Pembayaran gagal')).toBeInTheDocument();
  state.response.data.status = 'EXPIRED';
  view.rerender(<PaymentResultPage />);
  expect(screen.getByText('Waktu pembayaran habis')).toBeInTheDocument();
});
it('does not turn a network failure into a successful or failed payment', () => {
  state.error = true;
  state.response = undefined;
  render(<PaymentResultPage />);
  expect(screen.getByText('Status belum dapat diperiksa')).toBeInTheDocument();
  expect(screen.queryByText('Pembayaran berhasil')).toBeNull();
});
it('explains missing references instead of assuming success', () => {
  state.lookup = null;
  state.response = undefined;
  render(<PaymentResultPage />);
  expect(screen.getByText('Referensi pembayaran tidak ditemukan')).toBeInTheDocument();
});
