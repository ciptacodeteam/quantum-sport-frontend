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
vi.mock('@/hooks/useMembershipDiscount', () => ({
  useMembershipDiscount: () => ({
    originalTotal: mocks.membership ? 200000 : 0,
    discountedTotal: 0,
    canUseMembership: mocks.membership,
    slotsToDeduct: mocks.membership ? 1 : 0,
    discountAmount: mocks.membership ? 200000 : 0,
    activeMembership: null
  })
}));
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
