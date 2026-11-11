import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { BookingStatus } from '@/lib/constants';
import type { Booking } from '@/types/model';
import CancelBookingDialog from './CancelBookingDialog';
const mocks = vi.hoisted(() => ({ role: 'ADMIN', cancel: vi.fn() }));
vi.mock('@/hooks/useRoleAccess', () => ({
  useHasRole: (roles: string[]) => roles.includes(mocks.role)
}));
vi.mock('@/api/admin/booking', () => ({ cancelBookingApi: mocks.cancel }));
const booking = {
  id: 'booking-1',
  status: BookingStatus.CONFIRMED,
  invoice: { number: 'INV-001' },
  details: [{ id: 'slot-1' }],
  user: { name: 'Budi' }
} as Booking;
function mount(value = booking) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidated = vi.spyOn(client, 'invalidateQueries');
  const onCancelled = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <CancelBookingDialog booking={value} onCancelled={onCancelled} />
    </QueryClientProvider>
  );
  return { client, onCancelled, invalidated };
}
beforeEach(() => {
  mocks.role = 'ADMIN';
  vi.clearAllMocks();
});
afterEach(cleanup);
it.each(['ADMIN', 'SUPER_ADMIN'])(
  'allows %s to cancel only after entering a reason and confirming',
  async (role) => {
    mocks.role = role;
    let finish!: (result: unknown) => void;
    mocks.cancel.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const { client, onCancelled, invalidated } = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Batalkan pemesanan' }));
    const confirm = screen.getByRole('button', { name: 'Ya, batalkan seluruh pemesanan' });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Alasan pembatalan/), { target: { value: '   ' } });
    expect(confirm).toBeDisabled();
    expect(mocks.cancel).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Alasan pembatalan/), {
      target: { value: '  Pelanggan batal  ' }
    });
    fireEvent.click(confirm);
    await waitFor(() => expect(mocks.cancel).toHaveBeenCalledWith('booking-1', 'Pelanggan batal'));
    expect(screen.getByRole('button', { name: 'Membatalkan…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Kembali' })).toBeDisabled();
    finish({ data: { status: 'CANCELLED' } });
    await waitFor(() => expect(onCancelled).toHaveBeenCalledOnce());
    expect(invalidated).toHaveBeenCalledWith({ queryKey: ['admin', 'bookings'] });
    expect(invalidated).toHaveBeenCalledWith({ queryKey: ['admin', 'courts'] });
    client.clear();
  }
);
it.each(['CASHIER', 'ADMIN_VIEWER', 'COACH', 'BALLBOY'])('hides cancellation for %s', (role) => {
  mocks.role = role;
  mount();
  expect(screen.queryByRole('button', { name: 'Batalkan pemesanan' })).not.toBeInTheDocument();
});
it('hides cancellation for already cancelled bookings', () => {
  mount({ ...booking, status: BookingStatus.CANCELLED as Booking['status'] });
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
it('keeps the reason and displays the server error when cancellation fails', async () => {
  mocks.cancel.mockRejectedValue(new Error('Tidak dapat dibatalkan'));
  const { onCancelled } = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Batalkan pemesanan' }));
  fireEvent.change(screen.getByLabelText(/Alasan pembatalan/), {
    target: { value: 'Pelanggan batal' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Ya, batalkan seluruh pemesanan' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Tidak dapat dibatalkan');
  expect(screen.getByLabelText(/Alasan pembatalan/)).toHaveValue('Pelanggan batal');
  expect(onCancelled).not.toHaveBeenCalled();
});
it('does not send a cancellation when the admin goes back', () => {
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Batalkan pemesanan' }));
  fireEvent.click(screen.getByRole('button', { name: 'Kembali' }));
  expect(mocks.cancel).not.toHaveBeenCalled();
});
