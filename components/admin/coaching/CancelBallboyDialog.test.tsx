vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CancelCoachDialog from './CancelCoachDialog';
import CoachingBookings from './CoachingBookings';
const mocks = vi.hoisted(() => ({
  ballboyCancellation: vi.fn(),
  cancelBallboy: vi.fn(),
  bookings: vi.fn(),
  role: 'SUPER_ADMIN',
  now: Date.parse('2026-11-01T12:00:00+07:00')
}));
vi.mock('@/api/admin/coaching', () => ({ coachingApi: mocks }));
vi.mock('@/hooks/useRoleAccess', () => ({
  useHasRole: (roles: string[]) => roles.includes(mocks.role)
}));
vi.mock('@/hooks/useAdminCourtSports', () => ({
  useAdminCourtSports: () => ({ branchId: 'cemara' })
}));
vi.mock('@/hooks/useBookingClock', () => ({ useBookingClock: () => mocks.now }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/admin/kelola-pemesanan/coach',
  useSearchParams: () => new URLSearchParams()
}));
const props = {
  kind: 'BALLBOY' as const,
  bookingCoachId: 'item',
  currentName: 'Ballboy A',
  startAt: '2026-11-02 13:00:00',
  status: 'CONFIRMED'
};
const preview = {
  current: {
    id: 'item',
    slotId: 'old-slot',
    name: 'Ballboy A',
    price: 150000,
    startAt: '2026-11-02 13:00:00',
    endAt: '2026-11-02 14:00:00'
  },
  refundRequired: true,
  invoiceNumber: 'INV-PAID'
};
function mount(changes = {}, list = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  render(
    <QueryClientProvider client={client}>
      {list ? <CoachingBookings kind="BALLBOY" /> : <CancelCoachDialog {...props} {...changes} />}
    </QueryClientProvider>
  );
  return client;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.role = 'SUPER_ADMIN';
  mocks.now = Date.parse('2026-11-01T12:00:00+07:00');
  mocks.ballboyCancellation.mockResolvedValue(preview);
  mocks.cancelBallboy.mockResolvedValue({ name: 'Ballboy A', price: 150000, refundRequired: true });
  mocks.bookings.mockResolvedValue([
    {
      id: 'item',
      name: 'Ballboy A',
      customer: 'Budi',
      createdAt: '2026-11-08T11:35:00Z',
      cashier: null,
      court: 'Tennis 1',
      startAt: props.startAt,
      endAt: '2026-11-02 14:00:00',
      price: 150000,
      status: 'CONFIRMED',
      invoice: null
    }
  ]);
});
afterEach(cleanup);
it('requires a cancellation reason, shows the manual refund notice, and submits the displayed slot version', async () => {
  const client = mount();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  expect(mocks.ballboyCancellation).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Batalkan Ballboy Ballboy A' }));
  const reason = await screen.findByLabelText('Alasan pembatalan');
  expect(screen.getByText(/Pembayaran sudah lunas/)).toHaveTextContent(
    'tidak mengembalikan dana otomatis'
  );
  const confirm = screen.getByRole('button', { name: 'Konfirmasi Batalkan Ballboy' });
  expect(confirm).toBeDisabled();
  fireEvent.change(reason, { target: { value: '   ' } });
  expect(confirm).toBeDisabled();
  fireEvent.change(reason, { target: { value: 'Pelanggan membatalkan' } });
  fireEvent.click(confirm);
  await waitFor(() =>
    expect(mocks.cancelBallboy).toHaveBeenCalledWith('item', {
      expectedSlotId: 'old-slot',
      reason: 'Pelanggan membatalkan'
    })
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  for (const key of ['schedule', 'coaching', 'bookings', 'invoices', 'analytics'])
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', key] });
});
it('offers ballboy cancellation in the bookings list for a cashier', async () => {
  mocks.role = 'CASHIER';
  mount({}, true);
  expect(await screen.findByText('Dibuat Pada')).toBeInTheDocument();
  expect(await screen.findByText('08/11/2026 18:35')).toBeInTheDocument();
  expect(screen.getByText('Online')).toBeInTheDocument();
  expect(
    await screen.findByRole('button', { name: 'Batalkan Ballboy Ballboy A' })
  ).toBeInTheDocument();
});
it('keeps the dialog and refreshes the preview after a stale assignment error', async () => {
  mocks.cancelBallboy.mockRejectedValue(new Error('Ballboy sudah diganti'));
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Batalkan Ballboy Ballboy A' }));
  fireEvent.change(await screen.findByLabelText('Alasan pembatalan'), {
    target: { value: 'Batal' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Batalkan Ballboy' }));
  await waitFor(() => expect(mocks.ballboyCancellation.mock.calls.length).toBeGreaterThan(1));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
it('does not cancel anything when the dialog is dismissed', async () => {
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Batalkan Ballboy Ballboy A' }));
  await screen.findByLabelText('Alasan pembatalan');
  fireEvent.click(screen.getByRole('button', { name: 'Kembali' }));
  expect(mocks.cancelBallboy).not.toHaveBeenCalled();
});
it.each(['ADMIN_VIEWER', 'COACH', 'BALLBOY', ''])(
  'hides cancellation and does not load preview for role %s',
  (role) => {
    mocks.role = role;
    mount();
    expect(screen.queryByRole('button')).toBeNull();
    expect(mocks.ballboyCancellation).not.toHaveBeenCalled();
  }
);
it('hides the action for cancelled ballboys and elapsed hours', () => {
  mount({ status: 'CANCELLED' });
  expect(screen.queryByRole('button')).toBeNull();
  cleanup();
  mocks.now = Date.parse('2026-11-02T13:30:00+07:00');
  mount();
  expect(screen.queryByRole('button')).toBeNull();
});

it('allows cashiers to cancel a ballboy', async () => {
  mocks.role = 'CASHIER';
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Batalkan Ballboy Ballboy A' }));
  fireEvent.change(await screen.findByLabelText('Alasan pembatalan'), {
    target: { value: 'Batal oleh kasir' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Batalkan Ballboy' }));
  await waitFor(() => expect(mocks.cancelBallboy).toHaveBeenCalled());
});

it('allows a cashier to cancel an unpaid HOLD ballboy without confirming payment', async () => {
  mocks.role = 'CASHIER';
  mocks.ballboyCancellation.mockResolvedValue({ ...preview, refundRequired: false });
  mount({ status: 'HOLD' });
  fireEvent.click(screen.getByRole('button', { name: 'Batalkan Ballboy Ballboy A' }));
  fireEvent.change(await screen.findByLabelText('Alasan pembatalan'), {
    target: { value: 'Batal sebelum pembayaran' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Batalkan Ballboy' }));
  await waitFor(() =>
    expect(mocks.cancelBallboy).toHaveBeenCalledWith('item', {
      expectedSlotId: 'old-slot',
      reason: 'Batal sebelum pembayaran'
    })
  );
});
