import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useBranchStore } from '@/stores/useBranchStore';
import { useBallboyCartStore } from '@/stores/useBallboyCartStore';
import AddOnsPage from './page';
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  availability: vi.fn(),
  window: vi.fn(),
  roster: vi.fn()
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/components/headers/MainHeader', () => ({ default: () => null }));
vi.mock('@/api/court', () => ({ getCourtBookingWindowApi: mocks.window }));
vi.mock('@/api/ballboy', () => ({
  getBallboyAvailabilityApi: mocks.availability,
  getBallboysApi: mocks.roster
}));
vi.mock('@/hooks/useBookingClock', () => ({
  useBookingClock: () => Date.parse('2030-10-22T10:00:00+07:00')
}));
vi.mock('@/lib/dayjs', async (original) => {
  const actual = await original<typeof import('@/lib/dayjs')>();
  return { ...actual, nowJakarta: () => actual.default('2030-10-22') };
});
const slot = (hour: number) => ({
  slotId: `ballboy-${hour}`,
  ballboy: { id: 'budi', name: 'Budi' },
  price: 45000,
  startAt: `2030-10-22 ${hour}:00:00`,
  endAt: `2030-10-22 ${hour + 1}:00:00`
});
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AddOnsPage />
    </QueryClientProvider>
  );
  return client;
}
beforeEach(() => {
  vi.clearAllMocks();
  useBranchStore.setState({
    branch: { id: 'cemara', name: 'Cemara', address: '', isActive: true }
  });
  useBallboyCartStore.getState().clear();
  mocks.roster.mockResolvedValue([
    { id: 'budi', name: 'Budi' },
    { id: 'andi', name: 'Andi' }
  ]);
  mocks.window.mockResolvedValue({ startDate: '2030-10-22', endDate: '2030-11-22', months: 1 });
  mocks.availability.mockResolvedValue({ data: [slot(9), slot(11), slot(12)] });
});
afterEach(() => {
  cleanup();
  useBallboyCartStore.getState().clear();
});
it('blocks unavailable and past hours, then checks out multiple ballboy hours without courts', async () => {
  const client = mount();
  expect(await screen.findByRole('button', { name: 'Budi, 09:00, Tidak tersedia' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Budi, 10:00, Tidak tersedia' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Lanjut ke pembayaran' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Budi, 11:00, Tersedia' }));
  fireEvent.click(screen.getByRole('button', { name: 'Budi, 12:00, Tersedia' }));
  expect(screen.getByText('Rp90.000')).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Lanjut ke pembayaran' })).toBeEnabled()
  );
  fireEvent.click(screen.getByRole('button', { name: 'Lanjut ke pembayaran' }));
  expect(useBallboyCartStore.getState().items.map((item) => item.slotId)).toEqual([
    'ballboy-11',
    'ballboy-12'
  ]);
  expect(useBallboyCartStore.getState().items.every((item) => !item.courtSlotId)).toBe(true);
  expect(mocks.push).toHaveBeenCalledWith('/add-ons/checkout');
  client.clear();
});
it('blocks the selected hour if another customer books it during availability refresh', async () => {
  const client = mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Budi, 11:00, Tersedia' }));
  await act(async () => {
    await client.cancelQueries();
    client.setQueryData(['ballboy', 'availability', 'cemara', '2030-10-22', 'TENNIS'], []);
  });
  expect(await screen.findByRole('alert')).toHaveTextContent('sudah tidak tersedia');
  expect(screen.getByRole('button', { name: 'Lanjut ke pembayaran' })).toBeDisabled();
  client.clear();
});
it('keeps every hour blocked when availability cannot be loaded', async () => {
  mocks.availability.mockRejectedValue(new Error('offline'));
  const client = mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('belum dapat dimuat');
  expect(screen.getByRole('button', { name: 'Lanjut ke pembayaran' })).toBeDisabled();
  client.clear();
});

it('shows a timetable with ballboy columns, including fully unavailable people', async () => {
  const client = mount();
  const table = await screen.findByRole('table', { name: 'Jadwal booking ballboy' });
  expect(table).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Waktu' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Budi' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Andi' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Andi, 11:00, Tidak tersedia' })).toBeDisabled();
  const available = screen.getByRole('button', { name: 'Budi, 11:00, Tersedia' });
  expect(available).toHaveTextContent('Rp45.000');
  fireEvent.click(available);
  expect(screen.getByRole('button', { name: 'Budi, 11:00, Dipilih' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.getByRole('button', { name: 'Budi, 11:00, Dipilih' })).toHaveClass('bg-[#111111]');
  client.clear();
});
it('retains the previous date selection when booking another day', async () => {
  const client = mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Budi, 11:00, Tersedia' }));
  mocks.availability.mockResolvedValue({
    data: [
      {
        ...slot(11),
        slotId: 'next-day',
        startAt: '2030-10-23 11:00:00',
        endAt: '2030-10-23 12:00:00'
      }
    ]
  });
  fireEvent.click(screen.getByRole('button', { name: '23 Okt 2030' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Budi, 11:00, Tersedia' }));
  expect(screen.getByText('Rp90.000')).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Lanjut ke pembayaran' })).toBeEnabled()
  );
  fireEvent.click(screen.getByRole('button', { name: 'Lanjut ke pembayaran' }));
  expect(useBallboyCartStore.getState().items.map((item) => item.date)).toEqual([
    '2030-10-22',
    '2030-10-23'
  ]);
  client.clear();
});
