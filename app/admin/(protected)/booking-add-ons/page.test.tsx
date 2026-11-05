import type * as ReactQuery from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useBookingStore } from '@/stores/useBookingStore';
import BookingAddOns from './page';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  push: vi.fn(),
  availability: vi.fn(),
  options: {} as any,
  summary: {} as any,
  queries: vi.fn(),
  inventory: [
    { id: 'racket', name: 'Racket', price: 50000, availableQuantity: 10, totalQuantity: 10 }
  ]
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/lib/adminApi', () => ({ adminApi: { get: mocks.availability } }));
vi.mock('@/components/admin/booking/BookingCoachSelection', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  default: ({ sessions, onSelect, selected }: any) => (
    <section aria-label="Pilihan coach">
      <span>{selected[0]?.coachName}</span>
      <button
        onClick={() =>
          onSelect(sessions[0], {
            coachId: 'coach',
            coachName: 'Coach A',
            slotId: 'coach-slot',
            date: sessions[0].date,
            timeSlot: sessions[0].timeSlot,
            startAt: sessions[0].startAt,
            endAt: sessions[0].endAt,
            courtSport: sessions[0].sport,
            price: 200000
          })
        }
      >
        Pilih Coach A
      </button>
      <button onClick={() => onSelect(sessions[0], null)}>Tanpa coach</button>
    </section>
  )
}));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof ReactQuery>()),
  useQuery: (options: any) => {
    mocks.queries(options.queryKey);
    return { data: mocks.inventory };
  },
  useQueries: ({ queries }: any) =>
    queries.map(() => ({ data: mocks.inventory, isPending: false, isError: false })),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: (options: any) => {
    mocks.options = options;
    return { mutate: mocks.mutate, isPending: false };
  }
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
  default: (props: any) => {
    mocks.summary = props;
    return (
      <aside>
        <button
          disabled={props.primaryAction.disabled || props.primaryAction.loading}
          onClick={props.primaryAction.onClick}
        >
          {props.primaryAction.label}
        </button>
        {props.secondaryActions.map((action: any) => (
          <button key={action.label} onClick={action.onClick}>
            {action.label}
          </button>
        ))}
      </aside>
    );
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-20T00:00:00+07:00'));
  mocks.availability.mockResolvedValue({
    data: { data: [{ slotId: 'coach-slot', price: 200000 }] }
  });
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
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('shows coach choices on the services page and submits equipment for booked sessions', () => {
  render(<BookingAddOns />);
  expect(screen.getAllByText('Racket')).toHaveLength(1);
  expect(screen.getByRole('region', { name: 'Pilihan coach' })).toBeInTheDocument();
  expect(mocks.queries.mock.calls.every(([key]) => key.includes('inventory'))).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Racket' }));
  expect(useBookingStore.getState().selectedInventories).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Booking' }));
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
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Booking' }));
  expect(mocks.mutate.mock.calls[0][0].inventories[0]).toMatchObject({
    inventoryId: 'racket',
    quantity: 1,
    startAt: selection.startAt,
    endAt: selection.endAt
  });

  expect(screen.queryByText('Select Date & Time for Add-Ons')).not.toBeInTheDocument();
});

it('checks coach availability then confirms courts and coach together with customer and note', async () => {
  useBookingStore.setState({ bookingAdminNote: 'Catatan admin', useMembership: false });
  render(<BookingAddOns />);
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach A' }));
  expect(useBookingStore.getState().selectedCoaches).toHaveLength(1);
  expect(mocks.summary.totalAmount).toBe(500000);
  expect(mocks.summary.coachTotal).toBe(200000);
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Booking' }))
  );
  expect(mocks.availability).toHaveBeenCalledWith('/coach/availability', expect.anything());
  expect(mocks.mutate).toHaveBeenCalledWith(
    expect.objectContaining({
      userId: 'customer',
      courtSlots: ['slot-19', 'slot-20', 'slot-21'],
      coachSlots: ['coach-slot'],
      totalHours: 3,
      adminNote: 'Catatan admin',
      useMembership: false
    })
  );
  expect(useBookingStore.getState().bookingItems).toHaveLength(3);
  act(() => mocks.options.onSuccess({}));
  expect(useBookingStore.getState().bookingItems).toEqual([]);
  expect(mocks.push).toHaveBeenCalledWith('/admin/kelola-pemesanan/lapangan?courtSport=PADEL');
});
it('blocks an unavailable coach and allows confirmation without a coach', async () => {
  mocks.availability.mockResolvedValue({ data: { data: [] } });
  render(<BookingAddOns />);
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach A' }));
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Booking' }))
  );
  expect(mocks.mutate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Tanpa coach' }));
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Booking' }));
  expect(mocks.mutate).toHaveBeenCalledOnce();
  expect(mocks.mutate.mock.calls[0][0]).not.toHaveProperty('coachSlots');
});
it('preserves selected coaches across return navigation and removes orphaned coach sessions', () => {
  const view = render(<BookingAddOns />);
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach A' }));
  fireEvent.click(screen.getByRole('button', { name: 'Kembali ke Pilihan Lapangan' }));
  expect(mocks.push).toHaveBeenCalledWith('/admin/booking-lapangan?courtSport=PADEL');
  view.unmount();
  render(<BookingAddOns />);
  expect(screen.getByText('Coach A')).toBeInTheDocument();
  act(() => useBookingStore.getState().removeBookingItem('court', '19:00 - 20:00', '2026-10-27'));
  expect(useBookingStore.getState().selectedCoaches).toEqual([]);
});
it('retains the cart when checking coach availability fails', async () => {
  mocks.availability.mockRejectedValue(new Error('offline'));
  render(<BookingAddOns />);
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach A' }));
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Booking' }))
  );
  expect(mocks.mutate).not.toHaveBeenCalled();
  expect(useBookingStore.getState().bookingItems).toHaveLength(3);
});

it('confirms walk-in court bookings without requiring a service', () => {
  useBookingStore.setState({
    selectedCustomerId: null,
    walkInName: 'Budi',
    walkInPhone: '08123456789',
    bookingAdminNote: 'Walk-in sore'
  });
  render(<BookingAddOns />);
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Booking' }));
  expect(mocks.mutate).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'Budi',
      phone: '08123456789',
      adminNote: 'Walk-in sore',
      totalHours: 3
    })
  );
  expect(mocks.mutate.mock.calls[0][0]).not.toHaveProperty('coachSlots');
});
it('checks the court booking cutoff again on the services page before confirmation', () => {
  vi.setSystemTime(new Date('2026-10-28T00:00:00+07:00'));
  render(<BookingAddOns />);
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Booking' }));
  expect(mocks.mutate).not.toHaveBeenCalled();
  expect(useBookingStore.getState().bookingItems).toHaveLength(3);
});
