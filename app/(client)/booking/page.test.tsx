import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import useAuthStore from '@/stores/useAuthStore';
import { useBranchStore } from '@/stores/useBranchStore';
import { useBookingStore } from '@/stores/useBookingStore';
import type { TariffRule } from '@/lib/tariff-period';
import BookingPage from './page';
const mocks = vi.hoisted(() => ({
  schedule: vi.fn(),
  tariffs: [] as TariffRule[],
  now: '2030-01-02 09:00:00',
  pathname: '/booking/tennis'
}));
vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: vi.fn() })
}));
vi.mock('@/components/headers/MainHeader', () => ({ default: () => null }));
vi.mock('@/components/booking/CourtDetailsDialog', () => ({ default: () => null }));
vi.mock('@/hooks/useCourtBookingSchedule', () => ({ useCourtBookingSchedule: mocks.schedule }));
vi.mock('@/hooks/useTariffPeriods', () => ({ useTariffPeriods: () => ({ rules: mocks.tariffs }) }));
vi.mock('@/queries/membership', () => ({
  myMembershipQueryOptions: { queryKey: ['test-membership'], queryFn: async () => null }
}));
vi.mock('@/hooks/useHasMounted', () => ({ useHasMounted: () => true }));
vi.mock('@/lib/dayjs', async (original) => {
  const actual = await original<typeof import('@/lib/dayjs')>();
  return { ...actual, nowJakarta: () => actual.default.tz(mocks.now, 'Asia/Jakarta') };
});
const slot = (id: string, courtId: string, name: string, isAvailable = false) => ({
  id,
  courtId,
  court: { id: courtId, name },
  startAt: '2030-01-02 10:00:00',
  endAt: '2030-01-02 11:00:00',
  price: 150000,
  isAvailable,
  availabilityStatus: isAvailable ? 'AVAILABLE' : 'BOOKED'
});
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <BookingPage />
    </QueryClientProvider>
  );
  return client;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.now = '2030-01-02 09:00:00';
  mocks.tariffs = [];
  mocks.pathname = '/booking/tennis';
  useAuthStore.setState({ isAuth: true, user: { id: 'me' } as never });
  useBranchStore.setState({
    branch: { id: 'cemara', name: 'Cemara', isActive: true, address: '' }
  });
  useBookingStore.setState({ bookingItems: [] });
  mocks.schedule.mockReturnValue({
    withinWindow: true,
    windowQuery: { data: { startDate: '2030-01-02', endDate: '2030-02-02', months: 1 } },
    slotQuery: {
      data: [
        slot('mine', 'a', 'Court A'),
        slot('other', 'b', 'Court B'),
        slot('free', 'c', 'Court C', true),
        {
          ...slot('last', 'c', 'Court C'),
          startAt: '2030-01-02 23:00:00',
          endAt: '2030-01-03 00:00:00'
        }
      ],
      isLoading: false,
      refetch: vi.fn()
    }
  });
});
afterEach(() => {
  cleanup();
  useAuthStore.getState().logout();
  useBookingStore.setState({ bookingItems: [] });
});
it('keeps existing bookings disabled without offering any user court-change action', () => {
  const client = mount();
  expect(screen.getByRole('button', { name: 'Court A, 10:00, Booked' })).toBeDisabled();
  expect(screen.queryByText('Booking Anda')).not.toBeInTheDocument();
  expect(screen.queryByText(/Ganti lapangan|Pindah court/)).not.toBeInTheDocument();
  expect(useBookingStore.getState().bookingItems).toEqual([]);
  client.clear();
});
it('keeps other customers booked slots disabled and allows ordinary booking of empty slots', async () => {
  const client = mount();
  expect(screen.getByRole('button', { name: 'Court A, 10:00, Booked' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Court C, 10:00, Available' }));
  await waitFor(() =>
    expect(useBookingStore.getState().bookingItems.map((item) => item.slotId)).toEqual(['free'])
  );
  expect(screen.queryByRole('dialog', { name: 'Ganti lapangan' })).not.toBeInTheDocument();
  client.clear();
});
it('does not expose private booking labels to signed-out users', async () => {
  useAuthStore.getState().logout();
  const client = mount();
  expect(screen.getByRole('button', { name: 'Court A, 10:00, Booked' })).toBeDisabled();
  expect(screen.queryByText('Booking Anda')).not.toBeInTheDocument();
  client.clear();
});

it.each(['/booking', '/booking/tennis'])(
  'automatically hides elapsed court rows at 30 minutes in %s',
  async (pathname) => {
    mocks.pathname = pathname;
    mocks.now = '2030-01-02 10:29:59';
    const client = mount();
    expect(screen.getByText('10:00', { selector: 'td' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Court C, 10:00, Unavailable' })).toBeDisabled();
    await act(async () => {
      mocks.now = '2030-01-02 10:30:00';
      window.dispatchEvent(new Event('focus'));
    });
    expect(screen.queryByText('10:00', { selector: 'td' })).not.toBeInTheDocument();
    expect(screen.getByText('11:00', { selector: 'td' })).toBeInTheDocument();
    client.clear();
  }
);

it('switches to the new Jakarta day and keeps its future hours visible after midnight', async () => {
  const client = mount();
  expect(screen.getByText('10:00', { selector: 'td' })).toBeInTheDocument();
  await act(async () => {
    mocks.now = '2030-01-03 00:00:00';
    window.dispatchEvent(new Event('focus'));
  });
  expect(mocks.schedule).toHaveBeenLastCalledWith('2030-01-03', '2030-01-03', 'TENNIS');
  expect(screen.getByText('10:00', { selector: 'td' })).toBeInTheDocument();
  client.clear();
});

it.each(['/booking', '/booking/tennis'])(
  'opens the next day after the last hour has disappeared in %s',
  async (pathname) => {
    mocks.pathname = pathname;
    mocks.now = '2030-01-02 23:45:00';
    const client = mount();
    await waitFor(() =>
      expect(mocks.schedule).toHaveBeenLastCalledWith(
        '2030-01-03',
        '2030-01-02',
        pathname.includes('tennis') ? 'TENNIS' : 'PADEL'
      )
    );
    expect(screen.getByRole('button', { name: '03 Jan 2030' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    client.clear();
  }
);
it('advances an open court schedule exactly when its final row expires', async () => {
  mocks.now = '2030-01-02 23:29:59';
  const client = mount();
  expect(screen.getByRole('button', { name: '02 Jan 2030' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await act(async () => {
    mocks.now = '2030-01-02 23:30:00';
    window.dispatchEvent(new Event('focus'));
  });
  expect(screen.getByRole('button', { name: '03 Jan 2030' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  client.clear();
});
it('preserves a future date chosen by the customer when today closes', async () => {
  const client = mount();
  fireEvent.click(screen.getByRole('button', { name: '05 Jan 2030' }));
  await act(async () => {
    mocks.now = '2030-01-02 23:45:00';
    window.dispatchEvent(new Event('focus'));
  });
  expect(screen.getByRole('button', { name: '05 Jan 2030' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  client.clear();
});
it('does not skip today because the availability request failed', async () => {
  mocks.now = '2030-01-02 23:45:00';
  const schedule = mocks.schedule();
  mocks.schedule.mockReturnValue({
    ...schedule,
    slotQuery: { ...schedule.slotQuery, isError: true }
  });
  const client = mount();
  expect(screen.getByRole('button', { name: '02 Jan 2030' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Jadwal belum dapat dimuat');
  client.clear();
});

it('uses current operating bands rather than legacy rows outside the closing time', async () => {
  mocks.now = '2030-01-02 20:29:59';
  mocks.tariffs = [
    {
      id: 'early-close',
      branchId: 'cemara',
      sport: 'TENNIS',
      effectiveFrom: '2030-01-01',
      happyStart: 6,
      happyEnd: 15,
      peakStart: 15,
      peakEnd: 21
    }
  ];
  const schedule = mocks.schedule();
  mocks.schedule.mockReturnValue({
    ...schedule,
    slotQuery: {
      ...schedule.slotQuery,
      data: [
        ...schedule.slotQuery.data,
        {
          ...slot('closing', 'c', 'Court C'),
          startAt: '2030-01-02 20:00:00',
          endAt: '2030-01-02 21:00:00'
        }
      ]
    }
  });
  const client = mount();
  expect(screen.getByRole('button', { name: '02 Jan 2030' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await act(async () => {
    mocks.now = '2030-01-02 20:30:00';
    window.dispatchEvent(new Event('focus'));
  });
  expect(screen.getByRole('button', { name: '03 Jan 2030' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  client.clear();
});
