vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ReplaceCoachDialog from './ReplaceCoachDialog';
import CoachingBookings from './CoachingBookings';
const mocks = vi.hoisted(() => ({
  replacements: vi.fn(),
  replaceCoach: vi.fn(),
  bookings: vi.fn(),
  role: 'SUPER_ADMIN',
  now: Date.parse('2026-11-01T12:00:00+07:00')
}));
vi.mock('@/api/admin/coaching', () => ({ coachingApi: mocks }));
vi.mock('@/hooks/useRoleAccess', () => ({
  useHasRole: (roles: string[]) => mocks.role === 'SUPER_ADMIN' || roles.includes(mocks.role)
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
const availability = {
  current: {
    id: 'item',
    slotId: 'old-slot',
    name: 'Coach A',
    price: 150000,
    startAt: '2026-11-02 13:00:00',
    endAt: '2026-11-02 14:00:00'
  },
  options: [{ slotId: 'new-slot', staffId: 'coach-b', name: 'Coach B', price: 150000 }]
};
const props = {
  bookingCoachId: 'item',
  currentName: 'Coach A',
  startAt: '2026-11-02 13:00:00',
  status: 'CONFIRMED'
};
function mount(changes = {}, list = false, kind: 'COACH' | 'BALLBOY' = 'COACH') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  render(
    <QueryClientProvider client={client}>
      {list ? <CoachingBookings kind={kind} /> : <ReplaceCoachDialog {...props} {...changes} />}
    </QueryClientProvider>
  );
  return client;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.role = 'SUPER_ADMIN';
  mocks.now = Date.parse('2026-11-01T12:00:00+07:00');
  mocks.replacements.mockResolvedValue(availability);
  mocks.replaceCoach.mockResolvedValue({ name: 'Coach B' });
  mocks.bookings.mockResolvedValue([
    {
      id: 'item',
      bookingId: 'booking',
      name: 'Coach A',
      customer: 'Budi',
      court: 'Tennis 1',
      startAt: '2026-11-02 13:00:00',
      endAt: '2026-11-02 14:00:00',
      price: 150000,
      status: 'CONFIRMED',
      invoice: null
    }
  ]);
});
afterEach(cleanup);
it('loads options on demand, confirms the selected coach, and refreshes schedule and invoice data', async () => {
  const client = mount();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  expect(mocks.replacements).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Ganti Coach Coach A' }));
  const radio = await screen.findByRole('radio', { name: /Coach B/ });
  const confirm = screen.getByRole('button', { name: 'Konfirmasi Ganti Coach' });
  expect(confirm).toBeDisabled();
  fireEvent.click(radio);
  fireEvent.change(screen.getByLabelText('Alasan penggantian (opsional)'), {
    target: { value: 'Coach berhalangan' }
  });
  expect(screen.getByRole('status')).toHaveTextContent('Selisih harga Rp 0');
  fireEvent.click(confirm);
  await waitFor(() =>
    expect(mocks.replaceCoach).toHaveBeenCalledWith('item', {
      slotId: 'new-slot',
      expectedSlotId: 'old-slot',
      reason: 'Coach berhalangan'
    })
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  for (const key of ['schedule', 'coaching', 'bookings', 'invoices'])
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', key] });
});
it('uses the same replacement dialog from the coach bookings table', async () => {
  mount({}, true);
  fireEvent.click(await screen.findByRole('button', { name: 'Ganti Coach Coach A' }));
  expect(await screen.findByRole('radio', { name: /Coach B/ })).toBeInTheDocument();
  expect(mocks.replacements).toHaveBeenCalledWith('item');
});
it('explains when there is no matching replacement and disables confirmation', async () => {
  mocks.replacements.mockResolvedValue({ ...availability, options: [] });
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Ganti Coach Coach A' }));
  expect(await screen.findByText(/Belum ada coach lain/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Konfirmasi Ganti Coach' })).toBeDisabled();
});
it('refreshes choices and retains the dialog when another admin wins the replacement slot', async () => {
  mocks.replaceCoach.mockRejectedValue(new Error('Coach sudah dipesan'));
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Ganti Coach Coach A' }));
  fireEvent.click(await screen.findByRole('radio', { name: /Coach B/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Ganti Coach' }));
  await waitFor(() => expect(mocks.replacements.mock.calls.length).toBeGreaterThan(1));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Konfirmasi Ganti Coach' })).toBeDisabled();
});
it('does not offer replacements for viewers, unconfirmed bookings or elapsed times', () => {
  mocks.role = 'ADMIN_VIEWER';
  const client = mount();
  expect(screen.queryByRole('button')).toBeNull();
  cleanup();
  client.clear();
  mocks.role = 'SUPER_ADMIN';
  mount({ status: 'HOLD' });
  expect(screen.queryByRole('button')).toBeNull();
  cleanup();
  mocks.now = Date.parse('2026-11-02T13:15:00+07:00');
  mount();
  expect(screen.queryByRole('button')).toBeNull();
  expect(mocks.replacements).not.toHaveBeenCalled();
});

it.each(['ADMIN', 'CASHIER', 'ADMIN_VIEWER', 'COACH', 'BALLBOY', ''])(
  'hides coach replacement for role %s and never loads choices',
  async (role) => {
    mocks.role = role;
    const client = mount();
    expect(screen.queryByRole('button', { name: /Ganti Coach/ })).toBeNull();
    expect(mocks.replacements).not.toHaveBeenCalled();
    cleanup();
    client.clear();
    mount({}, true);
    await screen.findByText('Coach A');
    expect(screen.queryByRole('button', { name: /Ganti Coach/ })).toBeNull();
    expect(screen.getByRole('columnheader', { name: 'Aksi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lihat detail Coach A' })).toBeInTheDocument();
  }
);

it('keeps the selected group when one replacement coach belongs to multiple groups', async () => {
  mocks.replacements.mockResolvedValue({
    ...availability,
    options: [
      { ...availability.options[0], coachingGroupId: 'northwest', coachingGroupName: 'Northwest' },
      { ...availability.options[0], coachingGroupId: 'another', coachingGroupName: 'Other Academy' }
    ]
  });
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Ganti Coach Coach A' }));
  fireEvent.click(await screen.findByRole('radio', { name: /Other Academy/ }));
  expect(screen.getByRole('radio', { name: /Northwest/ })).not.toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Ganti Coach' }));
  await waitFor(() =>
    expect(mocks.replaceCoach).toHaveBeenCalledWith(
      'item',
      expect.objectContaining({ slotId: 'new-slot', coachingGroupId: 'another' })
    )
  );
});

it('keeps the table compact and shows invoice, contact and group only in detail', async () => {
  mocks.role = 'ADMIN_VIEWER';
  mocks.bookings.mockResolvedValueOnce([
    {
      id: 'item',
      bookingId: 'booking',
      name: 'Coach A',
      coachingGroupName: 'SR Academy',
      customer: 'Budi',
      phone: '+6281234567890',
      court: 'Tennis 1',
      startAt: '2026-11-02 13:00:00',
      endAt: '2026-11-02 14:00:00',
      price: 150000,
      status: 'CONFIRMED',
      invoice: {
        id: 'invoice-1',
        number: 'INV-DETAIL',
        status: 'PAID',
        total: 350000,
        dueDate: '2026-11-02T07:00:00Z'
      }
    }
  ]);
  mount({}, true);
  const view = await screen.findByRole('button', { name: 'Lihat detail Coach A' });
  expect(screen.queryByRole('columnheader', { name: 'Invoice' })).toBeNull();
  expect(screen.queryByRole('columnheader', { name: 'Grup coaching' })).toBeNull();
  expect(screen.queryByText('INV-DETAIL')).toBeNull();
  expect(screen.queryByText('+6281234567890')).toBeNull();
  fireEvent.click(view);
  const detail = within(screen.getByRole('dialog', { name: 'Detail Pemesanan Coach' }));
  expect(detail.getByText('SR Academy')).toBeInTheDocument();
  expect(detail.getByText('+6281234567890')).toBeInTheDocument();
  expect(detail.getByText('INV-DETAIL')).toBeInTheDocument();
  expect(detail.getByText('Rp 150.000')).toBeInTheDocument();
  expect(detail.getByText('Rp 350.000')).toBeInTheDocument();
  expect(detail.getByRole('link', { name: 'Buka detail invoice' })).toHaveAttribute(
    'href',
    '/admin/kelola-transaksi/invoice-1'
  );
});
it('uses icon-only controls in the table while keeping accessible action names', async () => {
  mount({}, true);
  for (const name of ['Lihat detail Coach A', 'Ganti Coach Coach A', 'Batalkan Coach Coach A']) {
    const button = await screen.findByRole('button', { name });
    expect(button.textContent).toBe('');
    expect(button.querySelector('svg')).not.toBeNull();
  }
});

it('also keeps ballboy invoices and contact information in the icon-opened detail', async () => {
  mocks.bookings.mockResolvedValueOnce([
    {
      id: 'ballboy-item',
      bookingId: 'booking',
      name: 'Ballboy Ibnu',
      customer: 'Budi',
      phone: '+6281234567890',
      court: 'Padel 1',
      startAt: '2026-11-02 13:00:00',
      endAt: '2026-11-02 14:00:00',
      price: 45000,
      status: 'CONFIRMED',
      invoice: {
        id: 'ballboy-invoice',
        number: 'INV-BALLBOY',
        status: 'PAID',
        total: 195000,
        dueDate: '2026-11-02T07:00:00Z'
      }
    }
  ]);
  mount({}, true, 'BALLBOY');
  const view = await screen.findByRole('button', { name: 'Lihat detail Ballboy Ibnu' });
  expect(view.textContent).toBe('');
  expect(view.querySelector('svg')).not.toBeNull();
  expect(screen.queryByRole('columnheader', { name: 'Invoice' })).toBeNull();
  expect(screen.queryByText('INV-BALLBOY')).toBeNull();
  expect(screen.queryByText('+6281234567890')).toBeNull();
  expect(screen.queryByRole('button', { name: /Ganti Coach|Batalkan Coach/ })).toBeNull();
  fireEvent.click(view);
  const detail = within(screen.getByRole('dialog', { name: 'Detail Pemesanan Ballboy' }));
  expect(detail.getByText('+6281234567890')).toBeInTheDocument();
  expect(detail.getByText('Rp 45.000')).toBeInTheDocument();
  expect(detail.getByText('INV-BALLBOY')).toBeInTheDocument();
  expect(detail.getByRole('link', { name: 'Buka detail invoice' })).toHaveAttribute(
    'href',
    '/admin/kelola-transaksi/ballboy-invoice'
  );
});
