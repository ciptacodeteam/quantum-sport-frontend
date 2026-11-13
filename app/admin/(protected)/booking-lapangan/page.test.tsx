import type * as ReactQuery from '@tanstack/react-query';
vi.mock('@/components/admin/booking/RecurringBookingRules', () => ({ default: () => null }));
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import BookingLapangan from './page';
import { useBookingStore } from '@/stores/useBookingStore';

const fixtures = vi.hoisted(() => ({
  queries: [] as any[],
  mutate: vi.fn(),
  push: vi.fn(),
  mutationOptions: {} as any,
  pending: false,
  coachAvailability: vi.fn(),
  membership: null as any,
  slots: ['court-a', 'court-b'].map((id) => ({
    id: `slot-${id}`,
    courtId: id,
    court: { id, name: id === 'court-a' ? 'Court A' : 'Court B' },
    startAt: '2040-01-02T12:00:00Z',
    endAt: '2040-01-02T13:00:00Z',
    price: 150000,
    isAvailable: true
  }))
}));
vi.mock('@/lib/adminApi', () => ({ adminApi: { get: fixtures.coachAvailability } }));
vi.mock('@/components/admin/booking/BookingCoachSelection', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  default: ({ sessions, onSelect }: any) => (
    <section aria-label="Pilihan coach">
      <button
        onClick={() =>
          onSelect(sessions[0], {
            coachId: 'coach-a',
            coachName: 'Coach A',
            slotId: 'coach-slot',
            price: 200000,
            date: sessions[0].date,
            timeSlot: sessions[0].timeSlot,
            courtSport: 'PADEL',
            startAt: '2040-01-02 12:00:00',
            endAt: '2040-01-02 13:00:00'
          })
        }
      >
        Pilih Coach A
      </button>
      <button onClick={() => onSelect(sessions[0], null)}>Tanpa coach</button>
    </section>
  )
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: fixtures.push }),
  useSearchParams: () => new URLSearchParams()
}));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof ReactQuery>()),
  useQuery: (options: any) => {
    fixtures.queries.push(options);
    return { data: fixtures.slots, isLoading: false };
  },
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: (options: any) => {
    fixtures.mutationOptions = options;
    return { mutate: fixtures.mutate, isPending: fixtures.pending };
  }
}));
vi.mock('@/components/admin/booking/BookingSummary', () => ({
  default: ({ bookingControls, recurringControls, primaryAction, coachControls }: any) => (
    <aside aria-label="Booking Summary">
      {bookingControls}
      {recurringControls}
      {coachControls}
      <button
        disabled={primaryAction.disabled || primaryAction.loading}
        onClick={primaryAction.onClick}
      >
        {primaryAction.label}
      </button>
    </aside>
  )
}));
vi.mock('@/hooks/useMembershipDiscount', () => ({
  useMembershipDiscount: () => ({
    discountAmount: 0,
    discountedTotal: 0,
    originalTotal: 0,
    activeMembership: fixtures.membership
  })
}));

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.clearAllMocks();
  fixtures.pending = false;
  fixtures.membership = null;
  fixtures.queries = [];
  fixtures.slots.forEach((slot) => {
    slot.startAt = '2040-01-02T12:00:00Z';
    slot.endAt = '2040-01-02T13:00:00Z';
  });
  useBookingStore.getState().clearAll();
  useBookingStore.setState({ selectedDate: new Date(2040, 0, 2) });
});

it.each([
  ['Training Coach', 'COACH_TRAINING', 'Nama coach'],
  ['Event', 'EVENT', 'Nama event']
])(
  'saves %s directly without navigating to add-ons or payment',
  async (label, purpose, fieldLabel) => {
    useBookingStore.setState({ selectedCustomerId: 'customer', useMembership: true });
    render(<BookingLapangan />);
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Jenis booking' }), { key: 'Enter' });
    fireEvent.click(await screen.findByRole('option', { name: label }));
    expect(useBookingStore.getState().useMembership).toBe(false);
    expect(useBookingStore.getState().recurringBooking).toBeNull();
    expect(screen.getByRole('button', { name: 'Simpan Booking' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(fieldLabel), { target: { value: '  Andi  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Court A/ }));
    fireEvent.click(screen.getByRole('button', { name: '12:00' }));
    fireEvent.click(screen.getByRole('button', { name: /Add to Booking/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Simpan Booking' }));
    expect(fixtures.mutate).toHaveBeenCalledWith({
      purpose,
      activityName: 'Andi',
      userId: 'customer',
      courtSlots: ['slot-court-a']
    });
    expect(fixtures.push).not.toHaveBeenCalled();
    act(() => fixtures.mutationOptions.onSuccess());
    expect(useBookingStore.getState().bookingItems).toEqual([]);
    expect(fixtures.push).toHaveBeenCalledWith('/admin/schedule?courtSport=PADEL');
  }
);

it('preserves the existing regular booking route', () => {
  useBookingStore.setState({ selectedCustomerId: 'customer' });
  render(<BookingLapangan />);
  fireEvent.click(screen.getByRole('button', { name: /Court A/ }));
  fireEvent.click(screen.getByRole('button', { name: '12:00' }));
  fireEvent.click(screen.getByRole('button', { name: /Add to Booking/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Layanan' }));
  expect(fixtures.mutate).not.toHaveBeenCalled();
  expect(fixtures.push).toHaveBeenCalledWith('/admin/booking-add-ons?courtSport=PADEL');
});

it.each([
  ['Training Coach', 'COACH_TRAINING', 'Nama coach'],
  ['Event', 'EVENT', 'Nama event']
])('allows %s without selecting a customer or walk-in', async (label, purpose, fieldLabel) => {
  render(<BookingLapangan />);
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Jenis booking' }), { key: 'Enter' });
  fireEvent.click(await screen.findByRole('option', { name: label }));
  fireEvent.change(screen.getByLabelText(fieldLabel), { target: { value: 'Latihan atau event' } });
  fireEvent.click(screen.getByRole('button', { name: /Court A/ }));
  fireEvent.click(screen.getByRole('button', { name: '12:00' }));
  fireEvent.click(screen.getByRole('button', { name: /Add to Booking/ }));
  expect(screen.getByRole('button', { name: 'Simpan Booking' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Booking' }));
  expect(fixtures.mutate).toHaveBeenCalledWith({
    purpose,
    activityName: 'Latihan atau event',
    courtSlots: ['slot-court-a']
  });
  expect(useBookingStore.getState().selectedCustomerId).toBeNull();
});

it('still requires a customer for regular bookings', () => {
  render(<BookingLapangan />);
  fireEvent.click(screen.getByRole('button', { name: /Court A/ }));
  fireEvent.click(screen.getByRole('button', { name: '12:00' }));
  fireEvent.click(screen.getByRole('button', { name: /Add to Booking/ }));
  expect(screen.getByRole('button', { name: 'Tambah Layanan' })).toBeDisabled();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('hides the current hour at exactly start +30 minutes while the admin tab stays open', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2040-01-02T13:29:59+07:00'));
  fixtures.slots.forEach((slot) => {
    slot.startAt = '2040-01-02T13:00:00Z';
    slot.endAt = '2040-01-02T14:00:00Z';
  });
  render(<BookingLapangan />);
  fireEvent.click(screen.getByRole('button', { name: /Court A/ }));
  expect(screen.getByRole('button', { name: '13:00' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: '13:00' }));
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(screen.queryByRole('button', { name: '13:00' })).toBeNull();
  expect(screen.queryByRole('button', { name: /Add to Booking/ })).toBeNull();
});

it('removes an added slot from the admin cart once its grace period expires', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2040-01-02T12:29:59+07:00'));
  render(<BookingLapangan />);
  fireEvent.click(screen.getByRole('button', { name: /Court A/ }));
  fireEvent.click(screen.getByRole('button', { name: '12:00' }));
  fireEvent.click(screen.getByRole('button', { name: /Add to Booking/ }));
  expect(useBookingStore.getState().bookingItems).toHaveLength(1);
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(useBookingStore.getState().bookingItems).toEqual([]);
});

it('opens today in WIB instead of a persisted October 31 before the first slots query', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-31T18:00:00Z'));
  // JSON persistence restores Date values as strings.
  useBookingStore.setState({
    selectedDate: new Date(2026, 9, 31).toISOString() as unknown as Date
  });
  render(<BookingLapangan />);
  expect(useBookingStore.getState().selectedDate).toEqual(new Date(2026, 10, 1));
  const selected = within(screen.getByLabelText('Booking dates'))
    .getAllByRole('button')
    .find((button) => button.getAttribute('aria-pressed') === 'true')!;
  expect(selected).toHaveTextContent('1');
  expect(selected).toHaveTextContent('Nov');
  const firstQuery = fixtures.queries.find(
    (options) => options.queryKey[0] === 'admin' && options.queryKey[1] === 'court-costing'
  );
  expect(firstQuery.queryKey.at(-1)).toMatchObject({
    startAt: '2026-11-01T00:00:00.000Z',
    endAt: '2026-11-01T23:59:59.999Z'
  });
});

it('advances a stale selected date when returning to the tab after Jakarta midnight', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-31T16:59:00Z'));
  useBookingStore.setState({ selectedDate: new Date(2026, 9, 31) });
  render(<BookingLapangan />);
  vi.setSystemTime(new Date('2026-10-31T17:01:00Z'));
  act(() => {
    window.dispatchEvent(new Event('focus'));
  });
  expect(useBookingStore.getState().selectedDate).toEqual(new Date(2026, 10, 1));
});

it('preserves a future selection when returning to the tab', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-31T18:00:00Z'));
  const future = new Date(2026, 10, 2);
  useBookingStore.setState({ selectedDate: future });
  render(<BookingLapangan />);
  act(() => {
    window.dispatchEvent(new Event('focus'));
  });
  expect(useBookingStore.getState().selectedDate).toEqual(future);
});

it('deselects a court on a second click and clears its pending time slots', () => {
  render(<BookingLapangan />);
  const court = screen.getByRole('button', { name: /Court A/ });
  fireEvent.click(court);
  fireEvent.click(screen.getByRole('button', { name: '12:00' }));
  expect(screen.getByRole('button', { name: /Add to Booking/ })).toBeInTheDocument();

  fireEvent.click(court);
  expect(court).toHaveAttribute('aria-pressed', 'false');
  expect(screen.queryByRole('button', { name: /Add to Booking/ })).not.toBeInTheDocument();
  expect(screen.getByText('Select a court first to view time slots')).toBeInTheDocument();

  fireEvent.click(court);
  expect(court).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: '12:00' })).toHaveAttribute('aria-pressed', 'false');
});

it('clears pending times when switching to another court', () => {
  render(<BookingLapangan />);
  const first = screen.getByRole('button', { name: /Court A/ });
  const second = screen.getByRole('button', { name: /Court B/ });
  fireEvent.click(first);
  fireEvent.click(screen.getByRole('button', { name: '12:00' }));
  fireEvent.click(second);
  expect(first).toHaveAttribute('aria-pressed', 'false');
  expect(second).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: '12:00' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.queryByRole('button', { name: /Add to Booking/ })).not.toBeInTheDocument();
});

it('keeps weekly booking controls inside the booking summary', () => {
  useBookingStore.setState({ selectedCustomerId: 'customer', useMembership: true });
  fixtures.membership = {
    id: 'membership-user',
    isSuspended: false,
    membership: { id: 'pack', name: 'Value Pack', sport: 'PADEL' }
  };
  render(<BookingLapangan />);
  const summary = screen.getByRole('complementary', { name: 'Booking Summary' });
  expect(within(summary).getByRole('button', { name: 'Ulangi mingguan' })).toBeDisabled();
  expect(within(summary).getByText('Booking rutin')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Ulangi mingguan' })).toHaveLength(1);
});

function prepareCourtBooking(customer = true) {
  useBookingStore.setState({
    selectedDate: new Date(2040, 0, 2),
    selectedCustomerId: customer ? 'customer' : null,
    walkInName: customer ? null : 'Budi',
    walkInPhone: customer ? null : '08123456789',
    bookingAdminNote: 'Booking langsung',
    useMembership: false,
    bookingItems: [
      {
        courtId: 'court-a',
        courtName: 'Court A',
        slotId: 'slot-court-a',
        sport: 'PADEL',
        date: '2040-01-02',
        timeSlot: '12:00 - 13:00',
        endTime: '13:00',
        startAt: '2040-01-02T12:00:00Z',
        endAt: '2040-01-02T13:00:00Z',
        price: 150000
      }
    ],
    selectedInventories: [{ inventoryId: 'stale-inventory', quantity: 1 }] as any,
    selectedCoaches: [{ slotId: 'stale-coach' }] as any,
    selectedBallboys: [{ slotId: 'stale-ballboy' }] as any
  });
}
it('continues to services without creating a booking or clearing court selections', () => {
  prepareCourtBooking();
  render(<BookingLapangan />);
  expect(screen.queryByRole('region', { name: 'Pilihan coach' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Konfirmasi Booking' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Layanan' }));
  expect(fixtures.push).toHaveBeenCalledWith('/admin/booking-add-ons?courtSport=PADEL');
  expect(fixtures.mutate).not.toHaveBeenCalled();
  expect(useBookingStore.getState().bookingItems).toHaveLength(1);
  expect(useBookingStore.getState().selectedCustomerId).toBe('customer');
});
it('preserves walk-in details and notes when continuing to services', () => {
  prepareCourtBooking(false);
  render(<BookingLapangan />);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Layanan' }));
  expect(fixtures.push).toHaveBeenCalledWith('/admin/booking-add-ons?courtSport=PADEL');
  expect(useBookingStore.getState()).toMatchObject({
    walkInName: 'Budi',
    walkInPhone: '08123456789',
    bookingAdminNote: 'Booking langsung'
  });
});
it('keeps the services action disabled until a customer and court booking are selected', () => {
  render(<BookingLapangan />);
  expect(screen.getByRole('button', { name: 'Tambah Layanan' })).toBeDisabled();
});
it('preserves weekly booking rules when continuing to services', () => {
  prepareCourtBooking();
  const rule = {
    mode: 'ROLLING' as const,
    startDate: '2040-01-02',
    previewThrough: '2040-02-02',
    weekdays: [1],
    sourceSlotIds: ['slot-court-a']
  };
  useBookingStore.setState({ recurringBooking: rule });
  render(<BookingLapangan />);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Layanan' }));
  expect(useBookingStore.getState().recurringBooking).toEqual(rule);
  expect(fixtures.mutate).not.toHaveBeenCalled();
});

it('hides recurring booking controls for customers without a membership and for walk-ins', () => {
  prepareCourtBooking();
  useBookingStore.setState({ useMembership: true });
  const view = render(<BookingLapangan />);
  expect(
    screen.queryByRole('region', { name: 'Pengaturan booking rutin' })
  ).not.toBeInTheDocument();
  view.unmount();
  prepareCourtBooking(false);
  useBookingStore.setState({ useMembership: true });
  render(<BookingLapangan />);
  expect(
    screen.queryByRole('region', { name: 'Pengaturan booking rutin' })
  ).not.toBeInTheDocument();
});

it('shows recurring controls only after selecting a customer with a membership and hides them for regular payment', () => {
  prepareCourtBooking();
  useBookingStore.setState({ useMembership: true });
  fixtures.membership = {
    id: 'membership-user',
    isSuspended: false,
    membership: { id: 'pack', name: 'Value Pack', sport: 'PADEL' }
  };
  render(<BookingLapangan />);
  expect(screen.getByRole('region', { name: 'Pengaturan booking rutin' })).toBeInTheDocument();
  act(() => useBookingStore.setState({ useMembership: false }));
  expect(
    screen.queryByRole('region', { name: 'Pengaturan booking rutin' })
  ).not.toBeInTheDocument();
});

it('selects all available slots for the current court and date, excluding booked, closed and already added slots', () => {
  const original = [...fixtures.slots];
  const base = fixtures.slots[0];
  fixtures.slots.push(
    { ...base, id: 'available-13', startAt: '2040-01-02T13:00:00Z', endAt: '2040-01-02T14:00:00Z' },
    {
      ...base,
      id: 'booked-14',
      startAt: '2040-01-02T14:00:00Z',
      endAt: '2040-01-02T15:00:00Z',
      isAvailable: false
    },
    {
      ...base,
      id: 'closed-15',
      startAt: '2040-01-02T15:00:00Z',
      endAt: '2040-01-02T16:00:00Z',
      scheduleClosed: true
    } as any,
    { ...base, id: 'another-day', startAt: '2040-01-03T16:00:00Z', endAt: '2040-01-03T17:00:00Z' }
  );
  try {
    render(<BookingLapangan />);
    expect(screen.queryByRole('button', { name: 'Pilih semua slot tersedia' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Court A/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Pilih semua slot tersedia' }));
    expect(screen.getByText('2 slot dipilih')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '12:00' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '13:00' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '14:00 · Booked' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '15:00 · Booked' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Batalkan pilihan' }));
    expect(screen.queryByText('2 slot dipilih')).toBeNull();
    expect(screen.queryByRole('button', { name: /Add to Booking/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pilih semua slot tersedia' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add to Booking (2)' }));
    expect(useBookingStore.getState().bookingItems.map((item) => item.slotId)).toEqual([
      'slot-court-a',
      'available-13'
    ]);
    expect(screen.getByRole('button', { name: /Court A/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Pilih semua slot tersedia' })).toBeNull();
  } finally {
    fixtures.slots.splice(0, fixtures.slots.length, ...original);
  }
});
