import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import useAuthStore from '@/stores/useAuthStore';
import { useBranchStore } from '@/stores/useBranchStore';
import { useBookingStore } from '@/stores/useBookingStore';
import BookingPage from './page';
const mocks = vi.hoisted(() => ({ mySchedule: vi.fn(), schedule: vi.fn() }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/booking/tennis',
  useRouter: () => ({ push: vi.fn() })
}));
vi.mock('@/components/headers/MainHeader', () => ({ default: () => null }));
vi.mock('@/components/booking/CourtDetailsDialog', () => ({ default: () => null }));
vi.mock('@/components/booking/ChangeCourtDialog', () => ({
  default: ({ booking }: { booking: { detailId: string } }) => (
    <div role="dialog" aria-label="Ganti lapangan">
      {booking.detailId}
    </div>
  )
}));
vi.mock('@/api/court-change', () => ({ getMyCourtScheduleApi: mocks.mySchedule }));
vi.mock('@/hooks/useCourtBookingSchedule', () => ({ useCourtBookingSchedule: mocks.schedule }));
vi.mock('@/hooks/useTariffPeriods', () => ({ useTariffPeriods: () => ({ rules: [] }) }));
vi.mock('@/queries/membership', () => ({
  myMembershipQueryOptions: { queryKey: ['test-membership'], queryFn: async () => null }
}));
vi.mock('@/hooks/useHasMounted', () => ({ useHasMounted: () => true }));
vi.mock('@/lib/dayjs', async (original) => {
  const actual = await original<typeof import('@/lib/dayjs')>();
  return { ...actual, nowJakarta: () => actual.default.tz('2030-01-02 09:00:00', 'Asia/Jakarta') };
});
const owned = {
  detailId: 'detail',
  slotId: 'mine',
  courtId: 'a',
  courtName: 'Court A',
  startAt: '2030-01-02 10:00:00',
  endAt: '2030-01-02 11:00:00'
};
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
  useAuthStore.setState({ isAuth: true, user: { id: 'me' } as never });
  useBranchStore.setState({
    branch: { id: 'cemara', name: 'Cemara', isActive: true, address: '' }
  });
  useBookingStore.setState({ bookingItems: [] });
  mocks.mySchedule.mockResolvedValue([owned]);
  mocks.schedule.mockReturnValue({
    withinWindow: true,
    windowQuery: { data: { startDate: '2030-01-02', endDate: '2030-02-02', months: 1 } },
    slotQuery: {
      data: [
        slot('mine', 'a', 'Court A'),
        slot('other', 'b', 'Court B'),
        slot('free', 'c', 'Court C', true)
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
it('opens court changes from the owned booking without adding it to checkout', async () => {
  const client = mount();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Court A, 10:00, Booking Anda, ganti lapangan' })
  );
  expect(screen.getByRole('dialog', { name: 'Ganti lapangan' })).toHaveTextContent('detail');
  expect(useBookingStore.getState().bookingItems).toEqual([]);
  expect(screen.getByRole('button', { name: 'Court B, 10:00, Booked' })).toBeDisabled();
  expect(mocks.mySchedule).toHaveBeenCalledWith('2030-01-02', 'TENNIS');
  client.clear();
});
it('keeps other customers booked slots disabled and allows ordinary booking of empty slots', async () => {
  const client = mount();
  await screen.findByRole('button', { name: 'Court A, 10:00, Booking Anda, ganti lapangan' });
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
  expect(mocks.mySchedule).not.toHaveBeenCalled();
  expect(screen.queryByText('Booking Anda')).not.toBeInTheDocument();
  client.clear();
});
