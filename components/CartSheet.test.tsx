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
it('allows checkout from a cart containing only equipment', () => {
  useBookingStore.getState().clearAll();
  useBookingStore.getState().addInventory({
    inventoryId: 'balls',
    inventoryName: 'Tennis Balls',
    quantity: 2,
    price: 50000,
    timeSlot: 'default'
  });
  render(<CartSheet />);
  fireEvent.click(screen.getByRole('button', { name: 'Buka keranjang booking' }));
  expect(screen.getByText('Tennis Balls')).toBeInTheDocument();
  expect(screen.queryByText('Jadwal Anda masih kosong')).not.toBeInTheDocument();
  const checkout = screen.getByRole('button', { name: /Checkout/ });
  expect(checkout).toBeEnabled();
  fireEvent.click(checkout);
  expect(mocks.push).toHaveBeenCalledWith('/checkout');
});

it('removes only the selected equipment session and recalculates the subtotal', () => {
  useBookingStore.getState().clearAll();
  for (const timeSlot of ['default', 'court-slot']) {
    useBookingStore.getState().addInventory({
      inventoryId: 'balls',
      inventoryName: 'Tennis Balls',
      quantity: 1,
      price: 25000,
      timeSlot
    });
  }
  render(<CartSheet />);
  fireEvent.click(screen.getByRole('button', { name: 'Buka keranjang booking' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Hapus Tennis Balls' })[0]);
  expect(useBookingStore.getState().selectedInventories).toEqual([
    expect.objectContaining({ inventoryId: 'balls', timeSlot: 'court-slot' })
  ]);
  expect(useBookingStore.getState().inventoryTotal).toBe(25000);
  fireEvent.click(screen.getByRole('button', { name: 'Hapus Tennis Balls' }));
  expect(screen.queryByText('Tennis Balls')).not.toBeInTheDocument();
  expect(useBookingStore.getState().inventoryTotal).toBe(0);
  expect(screen.getByRole('button', { name: /Checkout/ })).toBeDisabled();
});
