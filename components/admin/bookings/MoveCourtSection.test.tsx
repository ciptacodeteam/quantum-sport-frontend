import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import MoveCourtSection from './MoveCourtSection';
import type { Booking, BookingDetail } from '@/types/model';
const mocks = vi.hoisted(() => ({ canWrite: true, options: vi.fn(), move: vi.fn() }));
vi.mock('@/hooks/useRoleAccess', () => ({ useHasRole: () => mocks.canWrite }));
vi.mock('@/hooks/useBookingClock', () => ({
  useBookingClock: () => Date.parse('2030-01-02T09:00:00+07:00')
}));
vi.mock('@/api/admin/bookedCourt', () => ({
  getAdminCourtChangeOptionsApi: mocks.options,
  changeAdminCourtApi: mocks.move
}));
const detail = {
  id: 'detail',
  slotId: 'old',
  court: { name: 'Court A' },
  slot: { startAt: '2030-01-02 10:00:00', endAt: '2030-01-02 11:00:00' }
} as unknown as BookingDetail;
const booking = { status: 'CONFIRMED', purpose: 'REGULAR', invoice: { status: 'PAID' } } as Booking;
function mount(source = booking) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MoveCourtSection detail={detail} booking={source} />
    </QueryClientProvider>
  );
  return client;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.canWrite = true;
  mocks.options.mockResolvedValue([{ slotId: 'new', courtId: 'b', courtName: 'Court B' }]);
  mocks.move.mockResolvedValue({ slotId: 'new' });
});
afterEach(cleanup);
it('shows the move action immediately and loads available courts only after clicking it', async () => {
  const client = mount();
  expect(mocks.options).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Pindah court' }));
  fireEvent.click(await screen.findByRole('radio', { name: 'Court B' }));
  expect(mocks.move).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi pindah court' }));
  await waitFor(() => expect(mocks.move).toHaveBeenCalledWith('detail', 'old', 'new'));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Pindah court' })).toBeInTheDocument()
  );
  client.clear();
});
it('refreshes the admin schedule and related bookings after a successful move', async () => {
  const client = mount();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  fireEvent.click(screen.getByRole('button', { name: 'Pindah court' }));
  fireEvent.click(await screen.findByRole('radio', { name: 'Court B' }));
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi pindah court' }));
  await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'schedule'] }));
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'coaching'] });
  client.clear();
});
it('hides the move action for read-only roles', () => {
  mocks.canWrite = false;
  const client = mount();
  expect(screen.queryByRole('region', { name: 'Pindah court' })).not.toBeInTheDocument();
  expect(mocks.options).not.toHaveBeenCalled();
  client.clear();
});
it('explains why unpaid bookings cannot be moved', () => {
  const client = mount({ ...booking, invoice: { status: 'PENDING' } } as Booking);
  expect(screen.getByRole('button', { name: 'Pindah court' })).toBeDisabled();
  expect(screen.getByText(/terkonfirmasi, lunas, dan belum mulai/)).toBeInTheDocument();
  client.clear();
});
it('blocks confirmation when no eligible court is empty', async () => {
  mocks.options.mockResolvedValue([]);
  const client = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Pindah court' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Mencari court kosong');
  expect(await screen.findByText(/Tidak ada court kosong/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Konfirmasi pindah court' })).toBeDisabled();
  client.clear();
});
it('keeps the original booking when another request takes the chosen court', async () => {
  mocks.move.mockRejectedValue({ message: 'Court baru saja dipesan.' });
  const client = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Pindah court' }));
  fireEvent.click(await screen.findByRole('radio', { name: 'Court B' }));
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi pindah court' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Court baru saja dipesan');
  expect(screen.getByRole('button', { name: 'Konfirmasi pindah court' })).toBeDisabled();
  client.clear();
});
