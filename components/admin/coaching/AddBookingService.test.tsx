import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AddBookingService from './AddBookingService';
const mocks = vi.hoisted(() => ({
  available: vi.fn(),
  attach: vi.fn(),
  canWrite: true,
  now: Date.parse('2026-11-02T12:00:00+07:00')
}));
vi.mock('@/api/admin/coaching', () => ({ coachingApi: mocks }));
vi.mock('@/hooks/useRoleAccess', () => ({ useHasRole: () => mocks.canWrite }));
vi.mock('@/hooks/useBookingClock', () => ({ useBookingClock: () => mocks.now }));
vi.mock('@/queries/admin/paymentMethod', () => ({
  adminPaymentMethodsQueryOptions: {
    queryKey: ['methods'],
    queryFn: async () => [
      {
        id: 'va',
        name: 'BCA',
        channel: 'BCA_VIRTUAL_ACCOUNT',
        fees: 4000,
        percentage: 1,
        isActive: true
      }
    ]
  }
}));
vi.mock('@/lib/midtrans', () => ({ getMidtransConfig: async () => ({ checkoutMode: 'snap' }) }));
const props = {
  detailId: 'court-detail',
  startAt: '2026-11-02 13:00:00',
  endAt: '2026-11-02 14:00:00',
  sport: 'PADEL' as const,
  confirmed: true
};
const mount = (changes = {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  const result = render(
    <QueryClientProvider client={client}>
      <AddBookingService {...props} {...changes} />
    </QueryClientProvider>
  );
  return { ...result, client };
};
beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
  vi.clearAllMocks();
  mocks.canWrite = true;
  mocks.now = Date.parse('2026-11-02T12:00:00+07:00');
  mocks.available.mockResolvedValue([
    { slotId: 'coach-slot', staffId: 'coach', name: 'Coach A', kind: 'COACH', price: 150000 }
  ]);
  mocks.attach.mockResolvedValue({
    invoiceId: 'service-invoice',
    invoiceNumber: 'INV-SERVICE',
    status: 'PENDING',
    total: 156105
  });
});
afterEach(cleanup);
it('creates an invoice directly for the selected staff slot, without a paid confirmation', async () => {
  const { client } = mount();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  fireEvent.click(await screen.findByRole('combobox', { name: 'Pilih layanan' }));
  fireEvent.click(await screen.findByRole('option', { name: /Coach Coach A/ }));
  const button = screen.getByRole('button', { name: 'Tambah layanan & buat invoice' });
  await waitFor(() => expect(button).toBeEnabled());
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(screen.getByText('Rp 156.105')).toBeInTheDocument();
  fireEvent.click(button);
  await waitFor(() =>
    expect(mocks.attach).toHaveBeenCalledWith('court-detail', 'coach-slot', 'va')
  );
  expect(await screen.findByText('Invoice INV-SERVICE · Menunggu pembayaran')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Lihat invoice' })).toHaveAttribute(
    'href',
    '/admin/kelola-transaksi/service-invoice'
  );
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'schedule'] });
});
it('closes at 13:15 WIB and does not load offers for an elapsed hour', () => {
  mocks.now = Date.parse('2026-11-02T13:15:00+07:00');
  mount();
  expect(screen.getByText(/melewati batas pemesanan/)).toBeInTheDocument();
  expect(mocks.available).not.toHaveBeenCalled();
});
it('hides the action for viewers and unconfirmed court bookings', () => {
  mocks.canWrite = false;
  const { unmount } = mount();
  expect(screen.queryByRole('region')).toBeNull();
  expect(mocks.available).not.toHaveBeenCalled();
  unmount();
  mocks.canWrite = true;
  mount({ confirmed: false });
  expect(screen.queryByText('Tambah Coach')).toBeNull();
  expect(mocks.available).not.toHaveBeenCalled();
});
it('explains when no staff schedule is available', async () => {
  mocks.available.mockResolvedValue([]);
  mount({ sport: 'TENNIS' });
  expect(
    await screen.findByText('Tidak ada coach atau ballboy tersedia pada jam ini.')
  ).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Tambah layanan & buat invoice' })).toBeNull();
});
