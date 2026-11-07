import type * as ReactQuery from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useBookingStore } from '@/stores/useBookingStore';
import BookingAddOns from './page';

const mocks = vi.hoisted(() => ({
  payable: 300000,
  mutate: vi.fn(),
  push: vi.fn(),
  availability: vi.fn(),
  options: {} as any,
  summary: {} as any,
  queries: vi.fn(),
  methods: [
    { id: 'cash', name: 'Tunai Kasir', isActive: true, isOffline: true, channel: null },
    { id: 'online', name: 'Online QRIS', isActive: true, isOffline: false, channel: 'QRIS' },
    { id: 'inactive', name: 'Offline Nonaktif', isActive: false, isOffline: true, channel: null }
  ],
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
            coachingGroupId: 'academy',
            coachingGroupName: 'SR Academy',
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
      <button
        onClick={() =>
          onSelect(sessions[0], {
            coachId: 'coach-b',
            coachName: 'Coach B',
            slotId: 'coach-slot-b',
            date: sessions[0].date,
            timeSlot: sessions[0].timeSlot,
            startAt: sessions[0].startAt,
            endAt: sessions[0].endAt,
            courtSport: sessions[0].sport,
            price: 250000
          })
        }
      >
        Pilih Coach B
      </button>
      <button onClick={() => onSelect(sessions[0], null)}>Tanpa coach</button>
    </section>
  )
}));
vi.mock('@/components/admin/booking/BookingBallboySelection', () => ({
  default: ({ sessions, onSelect }: any) => (
    <section aria-label="Pilihan ballboy">
      <button
        onClick={() =>
          onSelect(sessions[0], {
            ballboyId: 'ballboy',
            ballboyName: 'Budi',
            slotId: 'ballboy-slot',
            price: 45000,
            date: sessions[0].date,
            timeSlot: sessions[0].timeSlot,
            startAt: sessions[0].startAt,
            endAt: sessions[0].endAt,
            courtId: sessions[0].courtId,
            courtName: sessions[0].courtName,
            courtSlotId: sessions[0].slotId,
            courtSport: sessions[0].sport
          })
        }
      >
        Pilih Ballboy
      </button>
    </section>
  )
}));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof ReactQuery>()),
  useQuery: (options: any) => {
    mocks.queries(options.queryKey);
    return {
      data: options.queryKey.includes('payment-methods') ? mocks.methods : mocks.inventory,
      isPending: false,
      isError: false
    };
  },
  useQueries: ({ queries }: any) =>
    queries.map(() => ({ data: mocks.inventory, isPending: false, isError: false })),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: (options: any) => {
    mocks.options = options;
    return { mutate: mocks.mutate, isPending: false };
  }
}));
vi.mock('@/hooks/useTariffPeriods', () => ({ useTariffPeriods: () => ({ rules: [] }) }));
vi.mock('@/hooks/useMembershipDiscount', () => ({
  useMembershipDiscount: () => ({
    canUseMembership: false,
    originalTotal: 300000,
    discountedTotal: mocks.payable,
    discountAmount: 0
  })
}));
vi.mock('@/components/admin/booking/BookingSummary', () => ({
  default: (props: any) => {
    mocks.summary = props;
    return (
      <aside>
        {props.paymentControls}
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

function choosePayment() {
  const selector = screen.queryByRole('combobox', { name: 'Metode pembayaran offline' });
  if (!selector) return;
  if (!selector.textContent?.includes('Tunai Kasir')) {
    fireEvent.click(selector);
    fireEvent.click(screen.getByRole('option', { name: 'Tunai Kasir' }));
  }
}
function confirmBooking() {
  choosePayment();
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Booking' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.payable = 300000;
  HTMLElement.prototype.scrollIntoView = vi.fn();
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

it('shows coach and ballboy choices without equipment or inventory availability requests', () => {
  render(<BookingAddOns />);
  expect(screen.getByRole('region', { name: 'Pilihan coach' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Pilihan ballboy' })).toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Equipment' })).not.toBeInTheDocument();
  expect(screen.queryByText('Racket')).not.toBeInTheDocument();
  expect(mocks.queries.mock.calls.every(([key]) => !key.includes('inventory'))).toBe(true);
  confirmBooking();
  expect(mocks.mutate.mock.calls[0][0]).not.toHaveProperty('inventories');
});

it('cleans retired items from the persisted cart', () => {
  useBookingStore.setState({
    selectedCoaches: [{ coachId: 'old' }] as any,
    selectedBallboys: [{ ballboyId: 'old' }] as any,
    coachTotal: 100000,
    ballboyTotal: 50000,
    coachDescription: 'old note',
    selectedInventories: [{ inventoryId: 'racket', quantity: 2, price: 100000 }] as any,
    inventoryTotal: 100000
  });
  render(<BookingAddOns />);
  expect(useBookingStore.getState()).toMatchObject({
    selectedCoaches: [],
    selectedBallboys: [],
    coachTotal: 0,
    ballboyTotal: 0,
    coachDescription: null,
    selectedInventories: [],
    inventoryTotal: 0
  });
});

it('requires a court booking and cannot confirm a persisted equipment-only cart', () => {
  useBookingStore.getState().setBookingItems([]);
  useBookingStore.setState({
    selectedInventories: [{ inventoryId: 'racket', quantity: 1, price: 50000 }] as any,
    inventoryTotal: 50000
  });
  render(<BookingAddOns />);
  expect(screen.getByText(/Pilih lapangan dan jam bermain terlebih dahulu/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Konfirmasi Booking' })).toBeDisabled();
  expect(useBookingStore.getState().selectedInventories).toEqual([]);
  expect(mocks.mutate).not.toHaveBeenCalled();
});

it('checks coach availability then confirms courts and coach together with customer and note', async () => {
  useBookingStore.setState({ bookingAdminNote: 'Catatan admin', useMembership: false });
  render(<BookingAddOns />);
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach A' }));
  expect(useBookingStore.getState().selectedCoaches).toHaveLength(1);
  expect(mocks.summary.totalAmount).toBe(500000);
  expect(mocks.summary.coachTotal).toBe(200000);
  choosePayment();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Booking' }))
  );
  expect(mocks.availability).toHaveBeenCalledWith('/coach/availability', expect.anything());
  expect(mocks.mutate).toHaveBeenCalledWith(
    expect.objectContaining({
      userId: 'customer',
      courtSlots: ['slot-19', 'slot-20', 'slot-21'],
      coachSlots: ['coach-slot'],
      coachGroups: [{ slotId: 'coach-slot', coachingGroupId: 'academy' }],
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
  choosePayment();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Booking' }))
  );
  expect(mocks.mutate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Tanpa coach' }));
  confirmBooking();
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
  choosePayment();
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
  confirmBooking();
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
  confirmBooking();
  expect(mocks.mutate).not.toHaveBeenCalled();
  expect(useBookingStore.getState().bookingItems).toHaveLength(3);
});

it('excludes persisted equipment from displayed totals and the submitted booking', () => {
  useBookingStore.setState({
    selectedInventories: [{ inventoryId: 'racket', quantity: 2, price: 100000 }] as any,
    inventoryTotal: 100000
  });
  render(<BookingAddOns />);
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach A' }));
  expect(mocks.summary.totalAmount).toBe(500000);
  expect(mocks.summary.selectedInventories).toBeUndefined();
  expect(useBookingStore.getState().inventoryTotal).toBe(0);
});

it.each(['PADEL', 'TENNIS'] as const)(
  'confirms a %s booking with an optional ballboy and no coach',
  async (sport) => {
    useBookingStore.setState({
      bookingItems: useBookingStore.getState().bookingItems.map((item) => ({ ...item, sport }))
    });
    mocks.availability.mockResolvedValue({
      data: { data: [{ slotId: 'ballboy-slot', price: 45000 }] }
    });
    render(<BookingAddOns />);
    fireEvent.click(screen.getByRole('button', { name: 'Pilih Ballboy' }));
    expect(mocks.summary.ballboyTotal).toBe(45000);
    expect(mocks.summary.totalAmount).toBe(345000);
    choosePayment();
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Booking' }))
    );
    expect(mocks.availability).toHaveBeenCalledWith(
      '/ballboy/availability',
      expect.objectContaining({ params: expect.objectContaining({ courtSport: sport }) })
    );
    expect(mocks.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        ballboySlots: [{ slotId: 'ballboy-slot', courtSlotId: 'slot-19' }]
      })
    );
    expect(mocks.mutate.mock.calls[0][0]).not.toHaveProperty('coachSlots');
  }
);

it('offers only active offline methods and confirms walk-in checkout without a checkbox', () => {
  useBookingStore.setState({
    selectedCustomerId: null,
    walkInName: 'Budi',
    walkInPhone: '08123456789'
  });
  render(<BookingAddOns />);
  const confirm = screen.getByRole('button', { name: 'Konfirmasi Booking' });
  expect(confirm).toBeDisabled();
  fireEvent.click(screen.getByRole('combobox', { name: 'Metode pembayaran offline' }));
  expect(screen.queryByRole('option', { name: 'Online QRIS' })).not.toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'Offline Nonaktif' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('option', { name: 'Tunai Kasir' }));
  expect(confirm).toBeEnabled();
  expect(
    screen.queryByRole('checkbox', { name: /Pembayaran sudah diterima/ })
  ).not.toBeInTheDocument();
  fireEvent.click(confirm);
  expect(mocks.mutate).toHaveBeenCalledWith(
    expect.objectContaining({ paymentMethodId: 'cash', name: 'Budi' })
  );
});
it('retains the chosen offline method when a service changes the payable total', () => {
  render(<BookingAddOns />);
  choosePayment();
  expect(screen.getByRole('button', { name: 'Konfirmasi Booking' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach A' }));
  expect(
    screen.queryByRole('checkbox', { name: /Pembayaran sudah diterima/ })
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Konfirmasi Booking' })).toBeEnabled();
});

it('allows fully covered or free bookings without selecting a payment method', () => {
  mocks.payable = 0;
  render(<BookingAddOns />);
  expect(screen.getByText('Tidak ada pembayaran tambahan untuk booking ini.')).toBeInTheDocument();
  expect(
    screen.queryByRole('combobox', { name: 'Metode pembayaran offline' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Booking' }));
  expect(mocks.mutate).toHaveBeenCalledOnce();
  expect(mocks.mutate.mock.calls[0][0]).not.toHaveProperty('paymentMethodId');
});

it('keeps multiple coaches for one hour, updates totals on toggle, and submits every coach slot', async () => {
  mocks.availability.mockResolvedValue({
    data: {
      data: [
        { slotId: 'coach-slot', price: 200000 },
        { slotId: 'coach-slot-b', price: 250000 }
      ]
    }
  });
  render(<BookingAddOns />);
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach A' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach B' }));
  expect(useBookingStore.getState().selectedCoaches).toHaveLength(2);
  expect(mocks.summary.coachTotal).toBe(450000);
  expect(mocks.summary.totalAmount).toBe(750000);
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach A' }));
  expect(useBookingStore.getState().selectedCoaches.map((coach) => coach.coachId)).toEqual([
    'coach-b'
  ]);
  expect(mocks.summary.coachTotal).toBe(250000);
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach A' }));
  choosePayment();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Booking' }))
  );
  expect(mocks.mutate).toHaveBeenCalledWith(
    expect.objectContaining({
      coachSlots: ['coach-slot-b', 'coach-slot'],
      coachGroups: [{ slotId: 'coach-slot', coachingGroupId: 'academy' }]
    })
  );
});
it('clears every coach for the hour when selecting Tanpa coach', () => {
  render(<BookingAddOns />);
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach A' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach B' }));
  fireEvent.click(screen.getByRole('button', { name: 'Tanpa coach' }));
  expect(useBookingStore.getState().selectedCoaches).toEqual([]);
  expect(mocks.summary.coachTotal).toBe(0);
});
