import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBookingStore } from '@/stores/useBookingStore';

const mocks = vi.hoisted(() => ({ push: vi.fn(), inventoryQuery: vi.fn() }));
const inventory = {
  id: 'balls',
  name: 'Tennis Balls',
  sport: 'TENNIS',
  price: 25000,
  availableQuantity: 2,
  totalQuantity: 2,
  image: null
};
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push, back: vi.fn() }) }));
vi.mock('@/components/headers/MainHeader', () => ({ default: () => null }));
vi.mock('@/queries/inventory', () => ({
  inventoryAvailabilityQueryOptions: (params: unknown) => {
    mocks.inventoryQuery(params);
    return { queryKey: ['inventory'] };
  }
}));
vi.mock('@/queries/ballboy', () => ({
  ballboyAvailabilityQueryOptions: () => ({ queryKey: ['ballboy'] })
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: { queryKey: string[] }) => ({
    data: options.queryKey[0] === 'inventory' ? [inventory] : [],
    isPending: false,
    isError: false
  }),
  useQueries: () => []
}));
import AddOnsPage from './page';

describe('equipment purchases', () => {
  beforeEach(() => {
    useBookingStore.getState().clearAll();
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
    useBookingStore.getState().clearAll();
  });

  it('adds equipment and continues to checkout without a court booking', () => {
    render(<AddOnsPage />);
    expect(screen.getByText('Tennis Balls')).toBeInTheDocument();
    expect(mocks.inventoryQuery).toHaveBeenCalledWith({});
    const next = screen.getByRole('button', { name: 'Lanjutkan' });
    expect(next).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /^Tambah Tennis Balls/ }));
    const state = useBookingStore.getState();
    expect(state.bookingItems).toHaveLength(0);
    expect(state.selectedInventories).toEqual([
      expect.objectContaining({
        inventoryId: 'balls',
        quantity: 1,
        price: 25000,
        timeSlot: 'default',
        courtSlotId: undefined
      })
    ]);
    expect(next).toBeEnabled();
    fireEvent.click(next);
    expect(mocks.push).toHaveBeenCalledWith('/checkout');
  });

  it('respects available stock and removes equipment when quantity reaches zero', () => {
    render(<AddOnsPage />);
    const plus = screen.getByRole('button', { name: /^Tambah Tennis Balls/ });
    fireEvent.click(plus);
    fireEvent.click(plus);
    expect(plus).toBeDisabled();
    expect(useBookingStore.getState().inventoryTotal).toBe(50000);
    const minus = screen.getByRole('button', { name: /^Kurangi Tennis Balls/ });
    fireEvent.click(minus);
    fireEvent.click(minus);
    expect(useBookingStore.getState().selectedInventories).toHaveLength(0);
    expect(useBookingStore.getState().inventoryTotal).toBe(0);
    expect(screen.getByRole('button', { name: 'Lanjutkan' })).toBeDisabled();
  });

  it('keeps equipment attached to the court session when a booking exists', () => {
    useBookingStore.setState({
      bookingItems: [
        {
          slotId: 'court-slot',
          courtId: 'court',
          courtName: 'Court 1',
          timeSlot: '10:00',
          endTime: '11:00',
          date: '2030-10-22',
          sport: 'PADEL',
          price: 100000
        }
      ]
    });
    render(<AddOnsPage />);
    fireEvent.click(screen.getByRole('button', { name: /^Tambah Tennis Balls/ }));
    expect(useBookingStore.getState().selectedInventories[0]).toMatchObject({
      courtSlotId: 'court-slot',
      courtId: 'court',
      timeSlot: 'court-slot',
      quantity: 1
    });
  });
  it('reserves stock for standalone equipment when adding a court session later', () => {
    useBookingStore.getState().addInventory({
      inventoryId: 'balls',
      inventoryName: 'Tennis Balls',
      quantity: 1,
      price: 25000,
      timeSlot: 'default'
    });
    useBookingStore.setState({
      bookingItems: [
        {
          slotId: 'court-slot',
          courtId: 'court',
          courtName: 'Court 1',
          timeSlot: '10:00',
          endTime: '11:00',
          date: '2030-10-22',
          sport: 'TENNIS',
          price: 100000
        }
      ]
    });
    render(<AddOnsPage />);
    fireEvent.click(screen.getByRole('button', { name: /^Peralatan/ }));
    const plus = screen.getByRole('button', { name: /^Tambah Tennis Balls/ });
    fireEvent.click(plus);
    expect(plus).toBeDisabled();
    expect(
      useBookingStore
        .getState()
        .selectedInventories.reduce((total, item) => total + item.quantity, 0)
    ).toBe(2);
  });
});
