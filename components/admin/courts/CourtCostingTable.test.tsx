import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

const mocks = vi.hoisted(() => ({
  pricing: vi.fn(),
  disable: vi.fn(),
  months: 2 as number | null
}));
vi.mock('@/components/ui/data-table', () => ({
  DataTable: ({ addButton }: { addButton: ReactNode }) => <div>{addButton}</div>
}));
vi.mock('./CreateCourtCostForm', () => ({ default: () => null }));
vi.mock('@/components/ui/multi-select-input', () => ({ default: () => <div /> }));
vi.mock('@/queries/admin/court', () => ({
  adminCourtQueryOptions: () => ({ queryKey: ['court'] }),
  adminCourtCostingQueryOptionsById: () => ({ queryKey: ['costing'] })
}));
vi.mock('@/mutations/admin/court', () => ({
  adminBulkDisableCourtSlotsMutationOptions: () => ({ kind: 'disable' }),
  adminBulkUpdateCourtSlotPricingMutationOptions: () => ({ kind: 'pricing' }),
  adminUpdateSlotPriceMutationOptions: () => ({}),
  adminUpdateSlotAvailabilityMutationOptions: () => ({})
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({
    data: queryKey[0] === 'court' ? { bookingWindowMonths: mocks.months } : [],
    isPending: false,
    isError: false
  }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: ({ kind }: { kind: string }) => ({
    mutate: kind === 'disable' ? mocks.disable : mocks.pricing,
    isPending: false
  })
}));
import { DialogProvider } from '@/components/ui/dialog-context';
import CourtCostingTable from './CourtCostingTable';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.months = 2;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-30T02:00:00Z'));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it.each([
  ['Bulk Edit Harga', 'Simpan Aturan Harga', 'pricing'],
  ['Bulk Nonaktifkan Slot', 'Simpan Aturan Penutupan', 'disable']
] as const)(
  'saves %s as a rolling rule even before matching slots exist',
  (trigger, submit, kind) => {
    render(
      <DialogProvider>
        <CourtCostingTable courtId="court" />
      </DialogProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: trigger }));
    expect(screen.getByLabelText('Ikuti rolling window')).toBeChecked();
    expect(screen.queryByText('Sampai Tanggal')).toBeNull();
    expect(screen.getByText(/Batas saat ini 30\/12\/2026/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: submit }));
    expect(mocks[kind]).toHaveBeenCalledWith({
      courtId: 'court',
      data: {
        followRollingWindow: true,
        fromDate: '2026-10-30',
        toDate: '2026-12-30',
        days: [1, 2, 3, 4, 5],
        startHour: 17,
        endHour: 22,
        ...(kind === 'pricing' ? { price: 0, discountPrice: 0 } : {})
      }
    });
  }
);

it('retains the date range mode for temporary changes and prevents submitting an empty range', () => {
  render(
    <DialogProvider>
      <CourtCostingTable courtId="court" />
    </DialogProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Bulk Nonaktifkan Slot' }));
  fireEvent.click(screen.getByLabelText('Ikuti rolling window'));
  expect(screen.getByText('Dari Tanggal')).toBeInTheDocument();
  expect(screen.getByText('Sampai Tanggal')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Nonaktifkan Slot' })).toBeDisabled();
});

it('keeps legacy courts in date range mode', () => {
  mocks.months = null;
  render(
    <DialogProvider>
      <CourtCostingTable courtId="court" />
    </DialogProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Bulk Edit Harga' }));
  expect(screen.queryByLabelText('Ikuti rolling window')).toBeNull();
  expect(screen.getByText('Sampai Tanggal')).toBeInTheDocument();
});
