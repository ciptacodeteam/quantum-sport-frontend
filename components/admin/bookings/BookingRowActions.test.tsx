import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import type { Booking } from '@/types/model';
import { BookingStatus } from '@/lib/constants';
import BookingRowActions from './BookingRowActions';

const mocks = vi.hoisted(() => ({ get: vi.fn(), details: vi.fn(), manage: vi.fn() }));
vi.mock('@/api/admin/booking', () => ({
  getBookingApi: mocks.get,
  getCourtBookingTableApi: vi.fn(),
  getBookingsApi: vi.fn(),
  getOngoingBookingsApi: vi.fn(),
  getScheduleApi: vi.fn()
}));
vi.mock('./BookingDetailsDialog', () => ({
  default: (props: any) => {
    mocks.details(props);
    return <div>Complete booking detail</div>;
  }
}));
vi.mock('./BookingStatusDialog', () => ({
  default: (props: any) => {
    mocks.manage(props);
    return <button onClick={props.onApprove}>Confirm complete booking</button>;
  }
}));
const summary = { id: 'booking-1', invoice: { number: 'INV-001' } } as Booking;
const full = { ...summary, coaches: [{ id: 'coach-1' }], status: BookingStatus.HOLD };
const clients: QueryClient[] = [];
function setup(status: BookingStatus = BookingStatus.HOLD) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const onApprove = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <BookingRowActions
        booking={summary}
        status={status}
        approving={false}
        onApprove={onApprove}
        onCancel={vi.fn()}
        onRescheduleSuccess={vi.fn()}
      />
    </QueryClientProvider>
  );
  return { onApprove };
}
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.resetAllMocks();
});

it.each(['Lihat detail INV-001', 'Kelola INV-001'])(
  'fetches complete data only when opening %s',
  async (button) => {
    let finish!: (value: any) => void;
    mocks.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const { onApprove } = setup();
    expect(mocks.get).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: button }));
    expect(await screen.findByRole('status')).toHaveTextContent('Memuat detail pemesanan');
    expect(mocks.get).toHaveBeenCalledWith('booking-1', expect.any(AbortSignal));
    expect(mocks.details).not.toHaveBeenCalled();
    expect(mocks.manage).not.toHaveBeenCalled();
    finish({ data: full });
    if (button.startsWith('Lihat')) {
      await screen.findByText('Complete booking detail');
      expect(mocks.details.mock.lastCall?.[0].booking).toEqual(full);
    } else {
      fireEvent.click(await screen.findByRole('button', { name: 'Confirm complete booking' }));
      expect(mocks.manage.mock.lastCall?.[0].booking).toEqual(full);
      expect(onApprove).toHaveBeenCalledOnce();
    }
  }
);
it('shows an error and allows retrying instead of rendering incomplete management data', async () => {
  mocks.get.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce({ data: full });
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Kelola INV-001' }));
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(mocks.manage).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
  await waitFor(() => expect(mocks.manage).toHaveBeenCalled());
  expect(mocks.get).toHaveBeenCalledTimes(2);
});
it('keeps management hidden for cancelled bookings without loading their details', () => {
  setup(BookingStatus.CANCELLED);
  expect(screen.queryByRole('button', { name: 'Kelola INV-001' })).not.toBeInTheDocument();
  expect(mocks.get).not.toHaveBeenCalled();
});
