import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { TrackedPackage } from '@/types/membership-tracking';
const mocks = vi.hoisted(() => ({ list: vi.fn(), tracking: vi.fn() }));
vi.mock('@/api/admin/membership-members', () => ({
  getMembershipMembers: mocks.list,
  getMembershipMemberTracking: mocks.tracking
}));
import MembershipMembersSection, { MembershipUsage } from './MembershipMembersSection';

const member = {
  id: 'pack',
  user: { name: 'Jim', phone: '08123456789', email: null },
  membership: { name: 'Silver', sport: 'PADEL', type: 'ALL_HOUR', sessions: 10 },
  remainingSessions: 6,
  status: 'ACTIVE',
  startDate: '2026-11-01T00:00:00Z',
  endDate: '2026-12-01T00:00:00Z'
};
const pack: TrackedPackage = {
  id: 'pack',
  name: 'Silver',
  sport: 'PADEL',
  type: 'ALL_HOUR',
  status: 'ACTIVE',
  totalHours: 10,
  remainingHours: 6,
  usedHours: 3,
  heldHours: 1,
  remainingDays: 14,
  startDate: '2026-11-01T00:00:00Z',
  endDate: '2026-12-01T00:00:00Z',
  purchaseInvoice: null,
  usage: [
    {
      id: 'confirmed',
      status: 'CONFIRMED',
      hours: 3,
      createdAt: '2026-11-15T01:00:00Z',
      invoiceNumber: 'INV-USED',
      branch: { id: 'cemara', name: 'Cemara', address: '' },
      details: [
        {
          court: { name: 'Court 1' },
          slot: { startAt: '2026-11-17T15:00:00Z', endAt: '2026-11-17T16:00:00Z' }
        }
      ]
    },
    {
      id: 'held',
      status: 'HOLD',
      hours: 1,
      createdAt: '2026-11-16T01:00:00Z',
      invoiceNumber: 'INV-HELD',
      details: []
    },
    {
      id: 'cancelled',
      status: 'CANCELLED',
      hours: 2,
      createdAt: '2026-11-14T01:00:00Z',
      invoiceNumber: 'INV-CANCELLED',
      details: []
    }
  ]
};
let client: QueryClient;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.list.mockResolvedValue({ packages: [member], total: 21, page: 1, pageSize: 20 });
  mocks.tracking.mockResolvedValue({ user: member.user, packages: [pack] });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
});
function mount() {
  return render(
    <QueryClientProvider client={client}>
      <MembershipMembersSection />
    </QueryClientProvider>
  );
}

it('shows the current balance and opens the selected member mutation history', async () => {
  mount();
  expect(await screen.findByText('Jim')).toBeInTheDocument();
  expect(screen.getByText('6 / 10 jam')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Lihat mutasi Jim · Silver' }));
  const dialog = within(screen.getByRole('dialog'));
  expect(await dialog.findByText('−3 jam')).toBeInTheDocument();
  expect(mocks.tracking).toHaveBeenCalledWith('pack', expect.any(AbortSignal));
  expect(dialog.getByText('Court 1 · 15:00–16:00')).toBeInTheDocument();
  expect(dialog.getByText('15 Nov 2026 · 08:00')).toBeInTheDocument();
  const rows = dialog.getAllByRole('row');
  expect(rows[1]).toHaveTextContent('INV-HELD');
  expect(rows[1]).toHaveTextContent('1 jam ditahan');
  expect(rows[3]).toHaveTextContent('INV-CANCELLED');
  expect(rows[3]).toHaveTextContent('0 jam');
  expect(dialog.queryByText('−2 jam')).not.toBeInTheDocument();
});
it('applies search, sport and pagination on the server, resetting the page for a new search', async () => {
  mount();
  await screen.findByText('Jim');
  fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
  await waitFor(() =>
    expect(mocks.list).toHaveBeenLastCalledWith(
      { q: '', sport: undefined, page: 2 },
      expect.any(AbortSignal)
    )
  );
  fireEvent.change(screen.getByLabelText('Cari member atau paket'), { target: { value: 'Jim' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cari' }));
  await waitFor(() =>
    expect(mocks.list).toHaveBeenLastCalledWith(
      { q: 'Jim', sport: undefined, page: 1 },
      expect.any(AbortSignal)
    )
  );
  fireEvent.change(screen.getByLabelText('Olahraga'), { target: { value: 'TENNIS' } });
  await waitFor(() =>
    expect(mocks.list).toHaveBeenLastCalledWith(
      { q: 'Jim', sport: 'TENNIS', page: 1 },
      expect.any(AbortSignal)
    )
  );
});
it('distinguishes a failed request from an empty member report', async () => {
  mocks.list.mockRejectedValueOnce({ msg: 'Server sedang sibuk.' });
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('Server sedang sibuk.');
  expect(screen.queryByText('Tidak ada paket member yang sesuai.')).not.toBeInTheDocument();
  mocks.list.mockResolvedValue({ packages: [], total: 0, page: 1, pageSize: 20 });
  fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
  expect(await screen.findByText('Tidak ada paket member yang sesuai.')).toBeInTheDocument();
});
it('separates debt adjustments from booking usage and handles unused packages', () => {
  render(
    <MembershipUsage pack={{ ...pack, debtSettledHours: 2, debtTransferredHours: 1, usage: [] }} />
  );
  expect(screen.getByText(/pelunasan kekurangan paket sebelumnya: −2 jam/)).toBeInTheDocument();
  expect(screen.getByText(/dialihkan ke paket berikutnya: 1 jam/)).toBeInTheDocument();
  expect(screen.getByText('Belum ada pemakaian pada paket ini.')).toBeInTheDocument();
});
