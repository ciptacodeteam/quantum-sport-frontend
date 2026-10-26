import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useBookingStore } from '@/stores/useBookingStore';
import BookingAddOns from './page';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  queries: vi.fn(),
  inventory: [
    { id: 'racket', name: 'Racket', price: 50000, availableQuantity: 10, totalQuantity: 10 }
  ]
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: (options: any) => {
    mocks.queries(options.queryKey);
    return { data: mocks.inventory };
  },
  useQueries: ({ queries }: any) =>
    queries.map(() => ({ data: mocks.inventory, isPending: false, isError: false })),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: () => ({ mutate: mocks.mutate, isPending: false })
}));
vi.mock('@/hooks/useMembershipDiscount', () => ({
  useMembershipDiscount: () => ({
    canUseMembership: false,
    originalTotal: 300000,
    discountedTotal: 300000,
    discountAmount: 0
  })
}));
vi.mock('@/components/admin/booking/BookingSummary', () => ({
  default: ({ primaryAction }: any) => (
    <button onClick={primaryAction.onClick}>Confirm Booking</button>
  )
}));

beforeEach(() => {
  vi.clearAllMocks();
  useBookingStore.getState().clearAll();
  useBookingStore.setState({
    selectedCustomerId: 'customer',
    bookingItems: [19, 20, 21].map((hour) => ({
      courtId: 'court',
      courtName: 'Court 1',
      sport: 'PADEL',
      slotId: `slot-${hour}`,
      date: '2026-10-27',
      timeSlot: `${hour}:00 - ${hour + 1}:00`,
      endTime: `${hour + 1}:00`,
      price: 100000,
      startAt: `2026-10-27T${hour}:00:00+07:00`,
      endAt: `2026-10-27T${hour + 1}:00:00+07:00`
    }))
  });
});
afterEach(cleanup);

it('shows equipment once, does not fetch coach or ballboy data, and submits equipment for the booked sessions', () => {
  render(<BookingAddOns />);
  expect(screen.getAllByText('Racket')).toHaveLength(1);
  expect(screen.queryByText(/Select coaches|Coach Padel|Ballboy/i)).not.toBeInTheDocument();
  expect(mocks.queries.mock.calls.every(([key]) => key.includes('inventory'))).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Racket' }));
  expect(useBookingStore.getState().selectedInventories).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'Confirm Booking' }));
  const payload = mocks.mutate.mock.calls[0][0];
  expect(payload.inventories).toEqual(
    [19, 20, 21].map((hour) => ({
      inventoryId: 'racket',
      quantity: 1,
      courtSlotId: `slot-${hour}`
    }))
  );
  expect(payload).not.toHaveProperty('coachSlots');
  expect(payload).not.toHaveProperty('ballboySlots');
});

it('cleans retired items from the persisted cart', () => {
  useBookingStore.setState({
    selectedCoaches: [{ coachId: 'old' }] as any,
    selectedBallboys: [{ ballboyId: 'old' }] as any,
    coachTotal: 100000,
    ballboyTotal: 50000,
    coachDescription: 'old note'
  });
  render(<BookingAddOns />);
  expect(useBookingStore.getState()).toMatchObject({
    selectedCoaches: [],
    selectedBallboys: [],
    coachTotal: 0,
    ballboyTotal: 0,
    coachDescription: null
  });
});

it('books equipment by date without a time picker', () => {
  useBookingStore.getState().setBookingItems([]);
  render(<BookingAddOns />);
  expect(screen.getByText('Equipment booking')).toBeInTheDocument();
  expect(screen.queryByRole('combobox', { name: 'Time' })).not.toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Sport' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Racket' }));
  const selection = useBookingStore.getState().selectedInventories[0];
  expect(selection.quantity).toBe(1);
  expect(new Date(selection.endAt!).getTime() - new Date(selection.startAt!).getTime()).toBe(
    86400000
  );
  fireEvent.click(screen.getByRole('button', { name: 'Confirm Booking' }));
  expect(mocks.mutate.mock.calls[0][0].inventories[0]).toMatchObject({
    inventoryId: 'racket',
    quantity: 1,
    startAt: selection.startAt,
    endAt: selection.endAt
  });

  expect(screen.queryByText('Select Date & Time for Add-Ons')).not.toBeInTheDocument();
});
