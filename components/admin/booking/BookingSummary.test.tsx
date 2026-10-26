import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import BookingSummary from './BookingSummary';
import { useBookingStore } from '@/stores/useBookingStore';

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: () => ({
    data: [{ id: 'new', name: 'New Customer', phone: '081234', email: '', activeMembership: null }],
    isLoading: false
  })
}));
vi.mock('@/hooks/useMembershipDiscount', () => ({
  useMembershipDiscount: () => ({
    canUseMembership: false,
    originalTotal: 0,
    discountAmount: 0,
    activeMembership: null
  })
}));

function Harness() {
  const state = useBookingStore();
  return (
    <BookingSummary
      bookingItems={[]}
      courtTotal={0}
      totalAmount={0}
      showAddOns={false}
      onWalkInSet={vi.fn()}
      onWalkInClear={vi.fn()}
      selectedCustomerId={state.selectedCustomerId}
      selectedCustomerName={state.selectedCustomerName}
      selectedCustomerPhone={state.selectedCustomerPhone}
      onCustomerClear={() => state.setSelectedCustomerId(null)}
      onCustomerSelect={(id, customer) => {
        state.setSelectedCustomerId(id);
        state.setSelectedCustomerDetails(customer.name, customer.phone);
      }}
    />
  );
}

beforeEach(() => {
  useBookingStore.getState().clearAll();
  useBookingStore.setState({
    selectedCustomerId: 'old',
    selectedCustomerName: 'Old Customer',
    selectedCustomerPhone: '089999',
    membershipDiscount: 100000
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('clears the previous identity and discount when removing a customer', () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));
  expect(useBookingStore.getState()).toMatchObject({
    selectedCustomerId: null,
    selectedCustomerName: null,
    selectedCustomerPhone: null,
    membershipDiscount: 0
  });
  expect(screen.getByRole('combobox')).toHaveTextContent('Pilih pelanggan...');
  expect(screen.queryByText('Old Customer')).not.toBeInTheDocument();
});

it('starts a clean search and replaces the old customer after a new selection', async () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole('combobox'));
  expect(screen.getByRole('button', { name: 'Walk-in' })).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Cari pelanggan (min 2 karakter)...'), {
    target: { value: 'New' }
  });
  fireEvent.click(await screen.findByRole('option', { name: /New Customer/ }));
  expect(useBookingStore.getState()).toMatchObject({
    selectedCustomerId: 'new',
    selectedCustomerName: 'New Customer',
    selectedCustomerPhone: '081234',
    membershipDiscount: 0
  });
  expect(screen.getByRole('combobox')).toHaveTextContent('New Customer');
  expect(screen.queryByText('Old Customer')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('combobox'));
  expect(screen.getByPlaceholderText('Cari pelanggan (min 2 karakter)...')).toHaveValue('');
  expect(screen.queryByRole('option')).not.toBeInTheDocument();
});

it('retains the selected customer when continuing with the same id', () => {
  useBookingStore.getState().setSelectedCustomerId('old');
  expect(useBookingStore.getState().selectedCustomerName).toBe('Old Customer');
});

it('combines equipment entries without exposing slot ids and removes all grouped sessions', () => {
  const onRemove = vi.fn();
  render(
    <BookingSummary
      bookingItems={[]}
      courtTotal={0}
      inventoryTotal={450000}
      totalAmount={450000}
      selectedCustomerId={null}
      onCustomerSelect={vi.fn()}
      onCustomerClear={vi.fn()}
      onWalkInSet={vi.fn()}
      onWalkInClear={vi.fn()}
      showCourtBookings={false}
      selectedInventories={['internal-1', 'internal-2', 'internal-3'].map((timeSlot) => ({
        inventoryId: 'balls',
        inventoryName: 'Tennis Balls',
        quantity: 6,
        timeSlot,
        date: '2026-10-27',
        price: 150000
      }))}
      onInventoryRemove={onRemove}
    />
  );
  expect(screen.getAllByText('Tennis Balls')).toHaveLength(1);
  expect(screen.getByText('Qty: 6')).toBeInTheDocument();
  expect(screen.queryByText(/internal-/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Hapus Tennis Balls' }));
  expect(onRemove.mock.calls).toEqual([
    ['balls', 'internal-1'],
    ['balls', 'internal-2'],
    ['balls', 'internal-3']
  ]);
});
