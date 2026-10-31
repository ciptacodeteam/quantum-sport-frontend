import type * as ReactQuery from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import BookingTable from './BookingTable';

const mocks = vi.hoisted(() => ({ queries: vi.fn(), exportBookings: vi.fn(), empty: [] }));
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
vi.mock('@/api/admin/booking', () => ({
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
  DataTable: ({ rightActions }: any) => <div>{rightActions}</div>
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
});
async function choose(label: string) {
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Jenis pemesanan' }), { key: 'Enter' });
  fireEvent.click(await screen.findByRole('option', { name: label }));
}
it.each([
  ['Reguler', 'regular'],
  ['Membership', 'membership']
])('filters the table and export by %s checkout', async (label, value) => {
  render(<BookingTable courtSport="PADEL" />);
  expect(screen.getAllByRole('combobox')).toHaveLength(1);
  await choose(label);
  expect(mocks.queries.mock.lastCall?.[0].at(-1)).toEqual({
    courtSport: 'PADEL',
    checkoutType: value
  });
  fireEvent.click(screen.getByRole('button', { name: 'Export' }));
  await waitFor(() =>
    expect(mocks.exportBookings).toHaveBeenCalledWith({ courtSport: 'PADEL', checkoutType: value })
  );
});
it('removes the checkout filter when all checkouts are selected', async () => {
  render(<BookingTable courtSport="TENNIS" />);
  await choose('Membership');
  await choose('Semua pemesanan');
  expect(mocks.queries.mock.lastCall?.[0].at(-1)).toEqual({ courtSport: 'TENNIS' });
});
