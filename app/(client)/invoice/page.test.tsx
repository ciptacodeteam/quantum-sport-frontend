import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  invoices: [] as any[],
  user: { id: 'customer' } as { id: string; role?: string } | null,
  pendingProfile: false,
  error: null as { code: number } | null,
  refetch: vi.fn(),
  invoiceOptions: vi.fn(),
  push: vi.fn()
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/components/headers/MainHeader', () => ({ default: () => null }));
vi.mock('@/components/footers/MainBottomNavigation', () => ({ default: () => null }));
vi.mock('@/queries/profile', () => ({ profileQueryOptions: { queryKey: ['profile'] } }));
vi.mock('@/queries/invoice', () => ({ invoicesQueryOptions: () => ({ queryKey: ['invoices'] }) }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: { queryKey: string[] }) => {
    if (options.queryKey[0] === 'profile')
      return { data: mocks.user, isPending: mocks.pendingProfile };
    mocks.invoiceOptions(options);
    return {
      data: { data: mocks.invoices },
      isPending: false,
      isError: !!mocks.error,
      error: mocks.error,
      refetch: mocks.refetch
    };
  }
}));
import InvoiceHistoryPage from './page';
beforeEach(() => {
  mocks.invoices = [];
  mocks.user = { id: 'customer' };
  mocks.error = null;
  mocks.pendingProfile = false;
  vi.clearAllMocks();
});
afterEach(cleanup);
it('does not request customer invoices using a staff account', () => {
  mocks.user = { id: 'staff', role: 'ADMIN' };
  render(<InvoiceHistoryPage />);
  expect(mocks.invoiceOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  expect(screen.getByText('Riwayat untuk akun pelanggan')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Kembali ke profil/ }));
  expect(mocks.push).toHaveBeenCalledWith('/profile');
});
it('waits for the customer profile before requesting invoices', () => {
  mocks.user = null;
  mocks.pendingProfile = true;
  render(<InvoiceHistoryPage />);
  expect(mocks.invoiceOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
});
it('shows a sign-in prompt for expired sessions and does not retry 401 responses', () => {
  mocks.error = { code: 401 };
  render(<InvoiceHistoryPage />);
  expect(screen.getByText('Sesi Anda telah berakhir')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Masuk ke akun/ })).toBeInTheDocument();
  const options = mocks.invoiceOptions.mock.calls[0][0];
  expect(options.retry(0, { code: 401 })).toBe(false);
});
it('offers a retry for server errors rather than showing an empty history', () => {
  mocks.error = { code: 500 };
  render(<InvoiceHistoryPage />);
  expect(screen.queryByText('Belum ada riwayat pemesanan')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Coba lagi/ }));
  expect(mocks.refetch).toHaveBeenCalledOnce();
});
it('shows the empty state after a successful customer request', () => {
  render(<InvoiceHistoryPage />);
  expect(mocks.invoiceOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
  expect(screen.getByText('Belum ada riwayat pemesanan')).toBeInTheDocument();
});

it('offers Value Packs for an empty category without a zero invoice counter', () => {
  mocks.invoices = [
    {
      id: 'invoice-1',
      number: 'INV-TEST',
      status: 'PAID',
      total: 300000,
      issuedAt: '2026-10-23T01:00:00Z',
      booking: { status: 'CONFIRMED', details: [] }
    }
  ];
  render(<InvoiceHistoryPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Value Pack' }));
  expect(screen.getByText('Belum ada pembelian Value Pack')).toBeInTheDocument();
  expect(screen.queryByText(/Menampilkan 0/)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Lihat Value Pack/ }));
  expect(mocks.push).toHaveBeenCalledWith('/membership');
  fireEvent.click(screen.getByRole('button', { name: 'Lihat semua riwayat' }));
  expect(screen.getByText('INV-TEST')).toBeInTheDocument();
});
it('keeps paid invoices as detail links even if a booking hold status is stale', () => {
  mocks.invoices = [
    {
      id: 'invoice-1',
      number: 'INV-TEST',
      status: 'PAID',
      total: 300000,
      issuedAt: '2026-10-23T01:00:00Z',
      booking: { status: 'HOLD', details: [] }
    }
  ];
  render(<InvoiceHistoryPage />);
  expect(screen.getByRole('link')).toHaveAttribute('href', '/invoice/INV-TEST');
  expect(screen.getByText('Lihat detail')).toBeInTheDocument();
  expect(screen.queryByText('Lanjutkan pembayaran')).toBeNull();
});

it('supports the membership summary returned by the list API without invented package numbers', () => {
  mocks.invoices = [
    {
      id: 'invoice-2',
      number: 'INV-PACK',
      status: 'PAID',
      total: 400000,
      issuedAt: '2026-10-23T01:00:00Z',
      membershipUser: { membership: { id: 'pack', name: 'Happy Hour' } }
    }
  ];
  render(<InvoiceHistoryPage />);
  expect(screen.getByText('Happy Hour')).toBeInTheDocument();
  expect(screen.queryByText(/undefined/)).toBeNull();
});
it('summarizes consecutive hours with one booking date on the history card', () => {
  mocks.invoices = [
    {
      id: 'invoice-3',
      number: 'INV-HOURS',
      status: 'EXPIRED',
      total: 302331,
      issuedAt: '2026-10-23T01:00:00Z',
      booking: {
        details: [
          {
            id: 'later',
            court: { id: 'court-2', name: 'Court 2' },
            slot: { startAt: '2026-10-23T01:00:00Z', endAt: '2026-10-23T02:00:00Z' }
          },
          {
            id: 'earlier',
            court: { id: 'court-2', name: 'Court 2' },
            slot: { startAt: '2026-10-23T00:00:00Z', endAt: '2026-10-23T01:00:00Z' }
          }
        ]
      }
    }
  ];
  render(<InvoiceHistoryPage />);
  expect(screen.getByText('00.00 - 02.00')).toBeInTheDocument();
  expect(screen.getAllByText('23 Okt 2026')).toHaveLength(1);
  expect(screen.queryByText(/WIB/)).toBeNull();
});
