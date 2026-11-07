import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { PropsWithChildren } from 'react';
import { useBranchStore } from '@/stores/useBranchStore';
import { useCourtBookingSchedule } from './useCourtBookingSchedule';
const mocks = vi.hoisted(() => ({ window: vi.fn(), slots: vi.fn() }));
vi.mock('@/api/court', () => ({
  getCourtBookingWindowApi: mocks.window,
  getCourtsSlotsApi: mocks.slots,
  getCourtApi: vi.fn(),
  getCourtsApi: vi.fn(),
  getCourtSlotsApi: vi.fn()
}));
const branch = (id: string) => ({ id, name: id, address: '', isActive: true });
const windowData = { startDate: '2030-10-22', endDate: '2030-11-22', months: 1 };
function mount(
  date = '2030-10-22',
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
) {
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    ...renderHook(() => useCourtBookingSchedule(date, '2030-10-22', 'TENNIS'), { wrapper }),
    client
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  useBranchStore.setState({ branch: branch('cemara') });
  mocks.window.mockResolvedValue(windowData);
  mocks.slots.mockResolvedValue({
    data: [{ id: 'slot', isAvailable: false, availabilityStatus: 'BOOKED' }]
  });
});
afterEach(cleanup);
it('starts fetching slots without waiting for the booking window, retaining the server availability status', async () => {
  let finishWindow!: (value: typeof windowData) => void;
  mocks.window.mockReturnValue(
    new Promise((resolve) => {
      finishWindow = resolve;
    })
  );
  const { result, client } = mount();
  await waitFor(() => expect(result.current.slotQuery.data).toHaveLength(1));
  expect(mocks.window).toHaveBeenCalledOnce();
  expect(mocks.slots).toHaveBeenCalledOnce();
  expect(mocks.slots).toHaveBeenCalledWith({
    startAt: '2030-10-22 00:00:00',
    endAt: '2030-10-22 23:59:59',
    courtSport: 'TENNIS',
    includeUnavailable: 'true'
  });
  expect(result.current.windowQuery.isPending).toBe(true);
  expect(result.current.withinWindow).toBe(false);
  expect(result.current.slotQuery.data?.[0]).toMatchObject({
    isAvailable: false,
    availabilityStatus: 'BOOKED'
  });
  await act(async () => finishWindow(windowData));
  await waitFor(() => expect(result.current.withinWindow).toBe(true));
  client.clear();
});
it('uses separate cached schedules for each branch', async () => {
  const { result, client } = mount();
  await waitFor(() => expect(result.current.slotQuery.data?.[0].id).toBe('slot'));
  mocks.slots.mockResolvedValue({ data: [{ id: 'other-branch-slot', isAvailable: true }] });
  act(() => useBranchStore.setState({ branch: branch('other') }));
  await waitFor(() => expect(result.current.slotQuery.data?.[0].id).toBe('other-branch-slot'));
  expect(mocks.slots).toHaveBeenCalledTimes(2);
  expect(client.getQueriesData({ queryKey: ['courts', 'slots'] })).toHaveLength(2);
  client.clear();
});
it('does not request slots outside an already known booking window', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60000 } }
  });
  client.setQueryData(['courts', 'booking-window', 'cemara', 'TENNIS'], windowData);
  const { result } = mount('2031-01-01', client);
  expect(result.current.withinWindow).toBe(false);
  expect(mocks.slots).not.toHaveBeenCalled();
  client.clear();
});
