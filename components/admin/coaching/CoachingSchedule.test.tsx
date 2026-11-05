import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CoachingSchedule from './CoachingSchedule';
const mocks = vi.hoisted(() => ({
  person: vi.fn(),
  schedule: vi.fn(),
  saveSchedule: vi.fn(),
  updatePrice: vi.fn(),
  toggle: vi.fn()
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/admin/coaching/ballboy',
  useSearchParams: () => new URLSearchParams()
}));
vi.mock('@/api/admin/coaching', () => ({ coachingApi: mocks }));
vi.mock('@/hooks/useRoleAccess', () => ({
  useRoleAccess: () => ({ hasAccess: true, isLoading: false })
}));
vi.mock('@/hooks/useAdminCourtSports', () => ({
  useAdminCourtSports: () => ({ branchId: 'cemara' })
}));
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  render(
    <QueryClientProvider client={client}>
      <CoachingSchedule staffId="ballboy" />
    </QueryClientProvider>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.person.mockResolvedValue({ name: 'Budi', role: 'BALLBOY' });
  mocks.schedule.mockResolvedValue([
    {
      id: 'open',
      startAt: '2026-11-04 13:00:00',
      endAt: '2026-11-04 14:00:00',
      price: 45000,
      isAvailable: true,
      booked: false
    },
    {
      id: 'booked',
      startAt: '2026-11-04 14:00:00',
      endAt: '2026-11-04 15:00:00',
      price: 45000,
      isAvailable: false,
      booked: true
    }
  ]);
  mocks.saveSchedule.mockResolvedValue({ created: 2, updated: 0, skipped: 0 });
  mocks.updatePrice.mockResolvedValue({});
});
afterEach(cleanup);
it('saves the selected hourly tariff and day rules together', async () => {
  mount();
  fireEvent.change(await screen.findByLabelText('Harga per jam'), { target: { value: '50000' } });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Minggu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Simpan jadwal & harga' }));
  await waitFor(() =>
    expect(mocks.saveSchedule).toHaveBeenCalledWith('ballboy', {
      followCourtWindow: true,
      price: 50000,
      days: [1, 2, 3, 4, 5, 6],
      startHour: 6,
      endHour: 24
    })
  );
});
it('edits the price of one available slot while keeping booked slots protected', async () => {
  mount();
  const buttons = await screen.findAllByRole('button', { name: 'Edit harga' });
  expect(buttons[1]).toBeDisabled();
  fireEvent.click(buttons[0]);
  fireEvent.change(screen.getByLabelText('Harga per jam (Rp)'), { target: { value: '60000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan harga' }));
  await waitFor(() => expect(mocks.updatePrice).toHaveBeenCalledWith('open', 60000));
});

it('uses the court rolling window without date fields or a manual period in the request', async () => {
  mount();
  expect(await screen.findByText('Periode layanan otomatis')).toBeInTheDocument();
  expect(screen.queryByLabelText('Dari tanggal')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Sampai tanggal')).not.toBeInTheDocument();
  expect(mocks.schedule).toHaveBeenCalledWith('ballboy');
});
it('loads the saved repeating day, hour and price settings', async () => {
  mocks.person.mockResolvedValue({
    name: 'Budi',
    role: 'BALLBOY',
    rollingServiceSchedule: {
      followCourtWindow: true,
      days: [1, 3],
      startHour: 9,
      endHour: 17,
      price: 75000
    }
  });
  mount();
  await waitFor(() => expect(screen.getByLabelText('Harga per jam')).toHaveValue(75000));
  expect(screen.getByRole('checkbox', { name: 'Senin' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Selasa' })).not.toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Simpan jadwal & harga' }));
  await waitFor(() =>
    expect(mocks.saveSchedule).toHaveBeenCalledWith('ballboy', {
      followCourtWindow: true,
      days: [1, 3],
      startHour: 9,
      endHour: 17,
      price: 75000
    })
  );
});
