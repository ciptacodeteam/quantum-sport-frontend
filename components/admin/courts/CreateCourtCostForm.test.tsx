import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  court: {
    data: {
      bookingWindowMonths: 2,
      rollingPricing: {
        courtId: 'court',
        months: 2,
        days: [1, 2, 3, 4, 5, 6, 7],
        happyHourPrice: 100000,
        happyHourDiscountPrice: 80000,
        peakHourPrice: 200000,
        peakHourDiscountPrice: 150000,
        closedHours: [12]
      }
    },
    isPending: false,
    isError: false
  }
}));
vi.mock('@/components/ui/dialog-context', () => ({ useDialog: () => ({ closeDialog: vi.fn() }) }));
vi.mock('@/queries/admin/court', () => ({ adminCourtQueryOptions: () => ({}) }));
vi.mock('@/mutations/admin/court', () => ({ adminCreateCourtCostMutationOptions: () => ({}) }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => mocks.court,
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: () => ({ mutate: mocks.mutate, isPending: false })
}));
import CreateCourtCostForm from './CreateCourtCostForm';
beforeEach(() => vi.clearAllMocks());
it('loads the saved duration and submits a rolling schedule without fixed dates', async () => {
  render(<CreateCourtCostForm courtId="court" />);
  const months = screen.getByLabelText('Buka booking sampai (bulan ke depan)');
  expect(months).toHaveValue('2');
  expect(screen.queryByText('Mulai Dari')).toBeNull();
  expect(screen.queryByText('Sampai pada')).toBeNull();
  fireEvent.change(months, { target: { value: '3' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
  await waitFor(() =>
    expect(mocks.mutate).toHaveBeenCalledWith({ ...mocks.court.data.rollingPricing, months: 3 })
  );
  expect(mocks.mutate.mock.calls[0][0]).not.toHaveProperty('fromDate');
});
it('blocks a discounted price greater than the normal price', async () => {
  render(<CreateCourtCostForm courtId="court" />);
  fireEvent.change(screen.getByLabelText('Happy Hour Discount Price'), {
    target: { value: '110000' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
  await screen.findByText('Harga diskon tidak boleh melebihi harga normal.');
  expect(mocks.mutate).not.toHaveBeenCalled();
});
