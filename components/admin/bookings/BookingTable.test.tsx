vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
import type * as ReactQuery from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import BookingTable from './BookingTable';

const mocks = vi.hoisted(() => ({
  queries: vi.fn(),
  exportBookings: vi.fn(),
  empty: { items: [], total: 0 },
  table: {} as any
}));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof ReactQuery>()),
  useQuery: (options: any) => {
    mocks.queries(options.queryKey);
    return { data: mocks.empty, isPending: false };
  },
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() })
}));
vi.mock('@/hooks/useConfirmDialog', () => ({
  useConfirmMutation: () => ({ confirmAndMutate: vi.fn() })
}));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@/api/admin/booking', () => ({
  getCourtBookingTableApi: vi.fn(),
  exportBookingsApi: mocks.exportBookings,
  getBookingsApi: vi.fn(),
  getBookingApi: vi.fn(),
  getOngoingBookingsApi: vi.fn(),
  getScheduleApi: vi.fn(),
  approveBookingApi: vi.fn(),
  cancelBookingApi: vi.fn(),
  updateBookingStatusApi: vi.fn()
}));
vi.mock('@/components/ui/data-table', () => ({
  DataTable: (props: any) => {
    mocks.table = props;
    return <div>{props.rightActions}</div>;
  }
}));
const OriginalURL = URL;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.exportBookings.mockResolvedValue(new Blob(['test']));
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  vi.stubGlobal(
    'URL',
    class extends OriginalURL {
      static createObjectURL = vi.fn(() => 'blob:export');
      static revokeObjectURL = vi.fn();
    }
  );
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
async function choose(label: string) {
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Jenis pemesanan' }), { key: 'Enter' });
  fireEvent.click(await screen.findByRole('option', { name: label }));
}
it.each([
  ['Reguler', 'regular'],
  ['Membership', 'membership'],
  ['Training Coach', 'coach_training'],
  ['Event', 'event']
])('filters the table and export by %s checkout', async (label, value) => {
  render(<BookingTable courtSport="PADEL" />);
  expect(screen.getAllByRole('combobox')).toHaveLength(1);
  await choose(label);
  expect(mocks.queries.mock.lastCall?.[0].at(-1)).toEqual({
    courtSport: 'PADEL',
    checkoutType: value,
    page: '1',
    limit: '10',
    sortBy: 'createdAt',
    order: 'desc'
  });
  fireEvent.click(screen.getByRole('button', { name: 'Export' }));
  await waitFor(() =>
    expect(mocks.exportBookings).toHaveBeenCalledWith({
      courtSport: 'PADEL',
      checkoutType: value,
      sortBy: 'createdAt',
      order: 'desc'
    })
  );
});
it('removes the checkout filter when all checkouts are selected', async () => {
  render(<BookingTable courtSport="TENNIS" />);
  await choose('Membership');
  await choose('Semua pemesanan');
  expect(mocks.queries.mock.lastCall?.[0].at(-1)).toEqual({
    courtSport: 'TENNIS',
    page: '1',
    limit: '10',
    sortBy: 'createdAt',
    order: 'desc'
  });
});

it.each(['PADEL', 'TENNIS'] as const)(
  'filters playing dates for %s, exports the same range, and resets without clearing checkout type',
  async (courtSport) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 3, 12));
    render(<BookingTable courtSport={courtSport} />);
    await choose('Membership');
    fireEvent.click(screen.getByRole('button', { name: /^Date range:/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
    const expected = {
      courtSport,
      checkoutType: 'membership',
      dateFrom: '2026-10-28',
      dateTo: '2026-11-03',
      sortBy: 'createdAt',
      order: 'desc'
    };
    expect(mocks.queries.mock.lastCall?.[0].at(-1)).toEqual({
      ...expected,
      page: '1',
      limit: '10'
    });
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    await waitFor(() => expect(mocks.exportBookings).toHaveBeenCalledWith(expected));
    fireEvent.click(screen.getByRole('button', { name: 'Reset filter tanggal' }));
    expect(mocks.queries.mock.lastCall?.[0].at(-1)).toEqual({
      courtSport,
      checkoutType: 'membership',
      page: '1',
      limit: '10',
      sortBy: 'createdAt',
      order: 'desc'
    });
  }
);

it('requests only the selected page and resets pagination when dates or checkout filters change', async () => {
  render(<BookingTable courtSport="PADEL" />);
  expect(mocks.table.serverSide).toBe(true);
  act(() => mocks.table.onPaginationChange(3, 20));
  expect(mocks.queries.mock.lastCall?.[0].at(-1)).toMatchObject({ page: '3', limit: '20' });
  await choose('Membership');
  expect(mocks.queries.mock.lastCall?.[0].at(-1)).toMatchObject({
    page: '1',
    limit: '20',
    checkoutType: 'membership'
  });
});
it('debounces server search, resets the page and forwards supported sorting to the whole dataset', () => {
  vi.useFakeTimers();
  render(<BookingTable courtSport="TENNIS" />);
  act(() => mocks.table.onPaginationChange(4, 10));
  act(() => mocks.table.onSearchChange('INV-009'));
  expect(mocks.table.loading).toBe(true);
  act(() => vi.advanceTimersByTime(300));
  expect(mocks.queries.mock.lastCall?.[0].at(-1)).toMatchObject({
    search: 'INV-009',
    page: '1',
    limit: '10'
  });
  act(() => mocks.table.onSortChange([{ id: 'user_name', desc: false }]));
  expect(mocks.queries.mock.lastCall?.[0].at(-1)).toMatchObject({
    search: 'INV-009',
    page: '1',
    sortBy: 'customer',
    order: 'asc'
  });
});
