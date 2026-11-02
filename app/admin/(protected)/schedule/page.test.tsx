import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import SchedulePage from './page';

const mocks = vi.hoisted(() => ({ slots: vi.fn(), schedule: vi.fn() }));
vi.mock('@/hooks/useAdminCourtSports', () => ({
  useAdminCourtSports: () => ({ branchId: 'cemara', canCreateTennis: true })
}));
vi.mock('@/api/admin/court', () => ({
  getCourtsApi: async () => ({ data: [{ id: 'court', name: 'Padel 1', sport: 'PADEL' }] }),
  getCourtsSlotsApi: mocks.slots
}));
vi.mock('@/api/admin/booking', () => ({ getScheduleApi: mocks.schedule }));

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <SchedulePage />
    </QueryClientProvider>
  );
  return client;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.schedule.mockResolvedValue({ data: [] });
});
afterEach(cleanup);
it('renders the booking grid while the optional slot request is still pending and requests only one day', async () => {
  mocks.slots.mockReturnValue(new Promise(() => {}));
  const client = mount();
  expect(
    await screen.findByRole('table', { name: 'Jadwal pemesanan lapangan' })
  ).toBeInTheDocument();
  expect(screen.queryByText('Memuat jadwal...')).toBeNull();
  expect(screen.getByText('Memuat slot lapangan...')).toBeInTheDocument();
  expect(mocks.schedule).toHaveBeenCalledWith({
    courtSport: 'PADEL',
    date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
  });
  client.clear();
});
it('preserves the booking grid and offers retry when the optional slot request fails', async () => {
  mocks.slots.mockRejectedValue(new Error('slot request failed'));
  const client = mount();
  expect(
    await screen.findByRole('table', { name: 'Jadwal pemesanan lapangan' })
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Muat ulang slot' })).toBeInTheDocument()
  );
  client.clear();
});
