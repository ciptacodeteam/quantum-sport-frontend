import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Dialog } from '@/components/ui/dialog';
import type { AdminBookedInventoryDetail } from '@/queries/admin/bookedInventory';
import {
  BookedInventoryDetailsDialog,
  CancelBookedInventoryDialog
} from './BookedInventoryDialogs';
const mocks = vi.hoisted(() => ({ data: undefined as unknown, isError: false, refetch: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({
  queryOptions: (options: unknown) => options,
  useQuery: () => ({
    data: mocks.data,
    isPending: false,
    isError: mocks.isError,
    refetch: mocks.refetch
  })
}));
const item: AdminBookedInventoryDetail = {
  id: 'item',
  inventory: {
    id: 'racket',
    name: 'Raket Padel',
    description: null,
    quantity: 5,
    price: 0,
    isActive: true
  },
  quantity: 0,
  unitPrice: 0,
  totalPrice: 0,
  booking: {
    id: 'booking',
    status: 'CONFIRMED',
    totalPrice: 0,
    customer: null,
    invoice: null,
    courtSlots: []
  },
  createdAt: '',
  updatedAt: '',
  coaches: []
};
beforeEach(() => {
  mocks.data = item;
  mocks.isError = false;
  vi.clearAllMocks();
});
afterEach(cleanup);
it('omits empty customer, invoice, schedule, method, and description sections while keeping real zero amounts', () => {
  render(
    <Dialog open>
      <BookedInventoryDetailsDialog item={item} />
    </Dialog>
  );
  expect(screen.queryByText('Pelanggan')).not.toBeInTheDocument();
  expect(screen.queryByText('Pembayaran')).not.toBeInTheDocument();
  expect(screen.queryByText('Metode')).not.toBeInTheDocument();
  expect(screen.queryByText('Jadwal')).not.toBeInTheDocument();
  expect(screen.queryByText('Dibuat pada')).not.toBeInTheDocument();
  expect(screen.getAllByText('Rp 0').length).toBeGreaterThan(0);
  expect(screen.queryByText(/^-$|N\/A|Invalid Date/)).not.toBeInTheDocument();
});
it('shows an existing invoice without an empty payment method field', () => {
  mocks.data = {
    ...item,
    booking: {
      ...item.booking,
      customer: { id: 'customer', name: 'Dewi' },
      invoice: { id: 'invoice', number: 'INV-001', status: 'PAID', total: 0 }
    }
  };
  render(
    <Dialog open>
      <BookedInventoryDetailsDialog item={item} />
    </Dialog>
  );
  expect(screen.getByText('Dewi')).toBeInTheDocument();
  expect(screen.getByText('INV-001')).toBeInTheDocument();
  expect(screen.getByText('Lunas')).toBeInTheDocument();
  expect(screen.queryByText('Metode')).not.toBeInTheDocument();
});
it('shows a retry state instead of perpetual loading when detail fails', () => {
  mocks.data = undefined;
  mocks.isError = true;
  render(
    <Dialog open>
      <BookedInventoryDetailsDialog item={item} />
    </Dialog>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
  expect(mocks.refetch).toHaveBeenCalledOnce();
  expect(screen.queryByText('Memuat detail...')).not.toBeInTheDocument();
});
it('requires confirmation to cancel and disables repeated submission while pending', () => {
  const confirm = vi.fn();
  const view = render(
    <CancelBookedInventoryDialog
      item={item}
      pending={false}
      onClose={vi.fn()}
      onConfirm={confirm}
    />
  );
  expect(confirm).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Ya, batalkan' }));
  expect(confirm).toHaveBeenCalledOnce();
  view.rerender(
    <CancelBookedInventoryDialog item={item} pending onClose={vi.fn()} onConfirm={confirm} />
  );
  expect(screen.getByRole('button', { name: 'Ya, batalkan' })).toBeDisabled();
});
