import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useBookingStore } from '@/stores/useBookingStore';
import CartSheet from './CartSheet';
const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
afterEach(() => {
  cleanup();
  useBookingStore.getState().clearAll();
  useBookingStore.getState().setCartOpen(false);
  vi.clearAllMocks();
});
function addLegacyEquipment() {
  useBookingStore
    .getState()
    .addInventory({
      inventoryId: 'balls',
      inventoryName: 'Tennis Balls',
      quantity: 2,
      price: 50000,
      timeSlot: 'default'
    });
}
it('does not offer equipment-only checkout from a legacy cart', () => {
  addLegacyEquipment();
  render(<CartSheet />);
  fireEvent.click(screen.getByRole('button', { name: 'Buka keranjang booking' }));
  expect(screen.queryByText('Tennis Balls')).toBeNull();
  expect(screen.getByRole('button', { name: /Checkout/ })).toBeDisabled();
});
it('checks out courts without including legacy equipment in the subtotal', () => {
  addLegacyEquipment();
  useBookingStore
    .getState()
    .setBookingItems([
      {
        courtId: 'court',
        courtName: 'Padel 1',
        slotId: 'slot',
        date: '2030-10-23',
        timeSlot: '08:00',
        endTime: '09:00',
        price: 200000
      }
    ]);
  render(<CartSheet />);
  fireEvent.click(screen.getByRole('button', { name: 'Buka keranjang booking' }));
  expect(screen.getByText('Padel 1')).toBeInTheDocument();
  expect(screen.queryByText('Tennis Balls')).toBeNull();
  expect(screen.queryByText('Rp250.000')).toBeNull();
  const checkout = screen.getByRole('button', { name: /Checkout/ });
  expect(checkout).toBeEnabled();
  fireEvent.click(checkout);
  expect(mocks.push).toHaveBeenCalledWith('/checkout');
  expect(useBookingStore.getState().selectedInventories).toHaveLength(1);
});
