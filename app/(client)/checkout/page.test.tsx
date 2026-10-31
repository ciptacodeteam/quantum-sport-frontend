import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useBookingStore } from '@/stores/useBookingStore';
const mocks = vi.hoisted(() => ({
  methods: [] as any[],
  membership: false,
  mutate: vi.fn(),
  confirm: vi.fn().mockResolvedValue(true),
  user: { id: 'customer' },
  checkoutSuccess: null as null | ((data: any) => void),
  pending: false
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/components/headers/MainHeader', () => ({ default: () => null }));
vi.mock('@/hooks/useMembershipDiscount', async () => {
  const { selectMembershipSlots } = await import('@/lib/membership-slot-selection');
  return {
    useMembershipDiscount: (
      _id: string,
      items: any[],
      _data: any,
      _isUser: boolean,
      sport: any,
      _use: boolean,
      requested: string[] | null
    ) => {
      const activeMembership = mocks.membership
        ? {
            id: 'membership-user',
            startDate: '2020-01-01',
            endDate: '2035-01-01',
            remainingSessions: 5,
            remainingDuration: 30,
            isExpired: false,
            isSuspended: false,
            membership: {
              id: 'pack',
              name: 'All Hour',
              price: 1000000,
              sessions: 10,
              sport: 'PADEL' as const,
              type: 'ALL_HOUR' as const
            }
          }
        : null;
      return {
        activeMembership,
        remainingSessions: activeMembership?.remainingSessions ?? 0,
        ...selectMembershipSlots(items, activeMembership, requested, sport)
      };
    }
  };
});
vi.mock('@/hooks/useXenditTokenization', () => ({
  useXenditCardCollection: () => ({ collectCard: vi.fn(), isLoading: false })
}));
vi.mock('@/components/ui/confirm-dialog', () => ({ useConfirm: () => mocks.confirm }));
vi.mock('@/components/forms/payment/SavedCardSelector', () => ({ default: () => null }));
vi.mock('@/components/forms/payment/CreditCardForm', () => ({ default: () => null }));
vi.mock('@/queries/profile', () => ({ profileQueryOptions: { queryKey: ['profile'] } }));
vi.mock('@/queries/paymentMethod', () => ({
  paymentMethodsQueryOptions: () => ({ queryKey: ['payment-methods'] })
}));
vi.mock('@/mutations/booking', () => ({
  checkoutMutationOptions: (options: { onSuccess: (data: any) => void }) => {
    mocks.checkoutSuccess = options.onSuccess;
    return {};
  },
  applyPromoMutationOptions: () => ({})
}));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useQuery: (options: { queryKey: string[] }) => ({
    data: options.queryKey[0] === 'profile' ? mocks.user : mocks.methods,
    isPending: false
  }),
  useMutation: () => ({
    mutate: mocks.mutate,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    isPending: mocks.pending
  })
}));
import CheckoutPage from './page';
afterEach(() => {
  cleanup();
  mocks.pending = false;
  mocks.membership = false;
  mocks.methods = [];
  mocks.mutate.mockClear();
  useBookingStore.getState().clearAll();
});
it('ignores a legacy equipment-only cart and hides add-on ordering', () => {
  useBookingStore.getState().clearAll();
  useBookingStore.getState().addInventory({
    inventoryId: 'balls',
    inventoryName: 'Tennis Balls',
    quantity: 2,
    price: 50000,
    timeSlot: 'default'
  });
  render(<CheckoutPage />);
  expect(screen.getByText('Belum ada pesanan')).toBeInTheDocument();
  expect(screen.queryByText('Tennis Balls')).toBeNull();
  expect(screen.queryByText('Tambah Add-Ons')).toBeNull();
});

it('shows payment loading after checkout even when the cart is cleared before navigation', () => {
  addMembershipCourt();
  render(<CheckoutPage />);
  act(() => mocks.checkoutSuccess?.({ data: { invoiceNumber: 'INV-TEST' } }));
  expect(screen.getByText('Menyiapkan pesanan')).toBeInTheDocument();
  expect(screen.queryByText('Belum ada pesanan')).toBeNull();
});
it('shows a processing indicator while the checkout request is pending', () => {
  mocks.pending = true;
  addMembershipCourt();
  render(<CheckoutPage />);
  expect(screen.getByText('Mengonfirmasi pesanan')).toBeInTheDocument();
});

function addMembershipCourt() {
  mocks.membership = true;
  useBookingStore.getState().setBookingItems([
    {
      slotId: 'court-slot',
      courtId: 'court',
      courtName: 'Court 1',
      timeSlot: '08:00',
      endTime: '09:00',
      date: '2030-10-23',
      startAt: '2030-10-23T08:00:00Z',
      endAt: '2030-10-23T09:00:00Z',
      price: 200000
    }
  ]);
}
it('confirms membership-covered bookings without a selected payment method', async () => {
  addMembershipCourt();
  render(<CheckoutPage />);
  expect(screen.queryByText('Pilih Metode Pembayaran')).toBeNull();
  expect(screen.queryByText('Kode Promo')).toBeNull();
  const button = screen.getAllByRole('button', { name: 'Konfirmasi booking' })[0];
  expect(button).toBeEnabled();
  fireEvent.click(button);
  await waitFor(() => expect(mocks.mutate).toHaveBeenCalled());
  expect(mocks.mutate.mock.calls[0][0]).toMatchObject({
    courtSlots: ['court-slot'],
    useMembership: true
  });
  expect(mocks.mutate.mock.calls[0][0]).not.toHaveProperty('paymentMethodId');
});
it('ignores legacy add-ons when confirming a membership-covered court', async () => {
  addMembershipCourt();
  useBookingStore.getState().addInventory({
    inventoryId: 'towel',
    inventoryName: 'Towel',
    quantity: 1,
    price: 20000,
    timeSlot: 'default'
  });
  render(<CheckoutPage />);
  expect(screen.queryByText('Towel')).toBeNull();
  expect(screen.queryByText('Pilih Metode Pembayaran')).toBeNull();
  expect(screen.queryByText('Subtotal add-ons')).toBeNull();
  fireEvent.click(screen.getAllByRole('button', { name: 'Konfirmasi booking' })[0]);
  await waitFor(() => expect(mocks.mutate).toHaveBeenCalled());
  const payload = mocks.mutate.mock.calls[0][0];
  expect(payload.courtSlots).toEqual(['court-slot']);
  for (const key of ['inventories', 'coachSlots', 'ballboySlots'])
    expect(payload).not.toHaveProperty(key);
});
it('does not require a stored card for a zero-rupiah membership booking', async () => {
  addMembershipCourt();
  mocks.methods = [{ id: 'card', name: 'Kartu', channel: 'CARDS', fees: 5000, percentage: '2' }];
  render(<CheckoutPage />);
  await waitFor(() =>
    expect(screen.getAllByRole('button', { name: 'Konfirmasi booking' })[0]).toBeEnabled()
  );
  fireEvent.click(screen.getAllByRole('button', { name: 'Konfirmasi booking' })[0]);
  await waitFor(() => expect(mocks.mutate).toHaveBeenCalled());
  expect(mocks.mutate.mock.calls[0][0]).not.toHaveProperty('cardPayment');
  expect(screen.queryByText('Ganti Metode')).toBeNull();
});

it('lets customers pay cash for one hour while using membership for the other hours', async () => {
  addMembershipCourt();
  const first = useBookingStore.getState().bookingItems[0];
  useBookingStore.getState().setBookingItems(
    [8, 9, 10].map((hour, index) => ({
      ...first,
      slotId: `court-slot-${index}`,
      timeSlot: `${String(hour).padStart(2, '0')}:00`,
      endTime: `${String(hour + 1).padStart(2, '0')}:00`,
      startAt: `2030-10-23T${String(hour).padStart(2, '0')}:00:00+07:00`,
      endAt: `2030-10-23T${String(hour + 1).padStart(2, '0')}:00:00+07:00`
    }))
  );
  mocks.methods = [{ id: 'qris', name: 'QRIS', channel: 'QRIS', fees: 1000, percentage: '0' }];
  render(<CheckoutPage />);
  const toggles = screen.getAllByRole('checkbox');
  expect(toggles).toHaveLength(3);
  toggles.forEach((toggle) => expect(toggle).toBeChecked());
  fireEvent.click(toggles[1]);
  expect(toggles[0]).toBeChecked();
  expect(toggles[1]).not.toBeChecked();
  expect(toggles[2]).toBeChecked();
  expect(screen.getByText('Potongan Value Pack (2 jam)')).toBeInTheDocument();
  expect(screen.getAllByText('Rp201.110').length).toBeGreaterThan(0);
  fireEvent.click(screen.getAllByRole('button', { name: /Bayar Sekarang/i })[0]);
  await waitFor(() => expect(mocks.mutate).toHaveBeenCalled());
  expect(mocks.mutate.mock.calls[0][0]).toMatchObject({
    courtSlots: ['court-slot-0', 'court-slot-1', 'court-slot-2'],
    membershipCourtSlotIds: ['court-slot-0', 'court-slot-2'],
    membershipUserId: 'membership-user',
    useMembership: true,
    paymentMethodId: 'qris'
  });
});

it('selects all membership hours again using Pilih semua', async () => {
  addMembershipCourt();
  mocks.methods = [{ id: 'qris', name: 'QRIS', channel: 'QRIS', fees: 1000, percentage: '0' }];
  render(<CheckoutPage />);
  const toggle = screen.getByRole('checkbox');
  fireEvent.click(toggle);
  expect(screen.queryAllByRole('button', { name: 'Konfirmasi booking' })).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Pilih semua' }));
  expect(toggle).toBeChecked();
  expect(screen.queryByText('Termasuk membership')).toBeNull();
  fireEvent.click(screen.getAllByRole('button', { name: 'Konfirmasi booking' })[0]);
  await waitFor(() => expect(mocks.mutate).toHaveBeenCalled());
  expect(mocks.mutate.mock.calls[0][0]).toMatchObject({ membershipCourtSlotIds: ['court-slot'] });
  expect(mocks.mutate.mock.calls[0][0]).not.toHaveProperty('paymentMethodId');
});

it('shows an unavailable membership choice without hiding cash booking', () => {
  addMembershipCourt();
  mocks.membership = false;
  render(<CheckoutPage />);
  expect(screen.getByRole('checkbox')).toBeDisabled();
  expect(screen.getByText('Membership belum tersedia')).toBeInTheDocument();
});

it('clears all membership checks with Batalkan pilihan and can select them again', () => {
  addMembershipCourt();
  const first = useBookingStore.getState().bookingItems[0];
  useBookingStore
    .getState()
    .setBookingItems([
      first,
      { ...first, slotId: 'second-slot', timeSlot: '09:00', endTime: '10:00' }
    ]);
  render(<CheckoutPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Batalkan pilihan' }));
  screen.getAllByRole('checkbox').forEach((checkbox) => expect(checkbox).not.toBeChecked());
  expect(screen.queryByText('Potongan Value Pack (2 jam)')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Pilih semua' }));
  screen.getAllByRole('checkbox').forEach((checkbox) => expect(checkbox).toBeChecked());
  expect(screen.getByText('Potongan Value Pack (2 jam)')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Batalkan pilihan' })).toBeEnabled();
});

it('shows a lower regular rate comparison without changing the customer membership selection', () => {
  addMembershipCourt();
  const first = useBookingStore.getState().bookingItems[0];
  useBookingStore.getState().setBookingItems([{ ...first, price: 50000 }]);
  render(<CheckoutPage />);
  expect(screen.getByText('Harga reguler lebih rendah')).toBeInTheDocument();
  expect(screen.getByText('Rp50.000/jam')).toBeInTheDocument();
  expect(screen.getByText('Rp100.000/jam')).toBeInTheDocument();
  expect(screen.getByRole('checkbox')).toBeChecked();
});

it('does not suggest a cheaper regular rate when membership is cheaper', () => {
  addMembershipCourt();
  render(<CheckoutPage />);
  expect(screen.queryByText('Harga reguler lebih rendah')).toBeNull();
});
