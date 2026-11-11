import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { Dialog, DialogProvider } from '@/components/ui/dialog';
import { BookingStatus } from '@/lib/constants';
import type { Booking } from '@/types/model';
import ScheduleBookingDialogLayout from './ScheduleBookingDialogLayout';
vi.mock('@/hooks/useRoleAccess', () => ({ useHasRole: () => true }));
vi.mock('@/api/admin/booking', () => ({ cancelBookingApi: vi.fn() }));
afterEach(cleanup);
function mount(status: BookingStatus = BookingStatus.CONFIRMED) {
  const client = new QueryClient();
  const booking = { id: 'booking-1', status, totalPrice: 1000000 } as Booking;
  render(
    <QueryClientProvider client={client}>
      <DialogProvider>
        <Dialog open>
          <ScheduleBookingDialogLayout
            booking={booking}
            status={status}
            dialogId="booking-1"
            summary={<p>Ringkasan pelanggan</p>}
            manageSchedule={<p>Form ubah jadwal</p>}
            addServices={<p>Form tambah layanan</p>}
          >
            <p>Jadwal booking dan layanan tersimpan</p>
          </ScheduleBookingDialogLayout>
        </Dialog>
      </DialogProvider>
    </QueryClientProvider>
  );
  return client;
}
it('opens with the booking overview and reveals only the requested management form', () => {
  mount();
  expect(screen.getByRole('complementary', { name: 'Ringkasan pemesanan' })).toHaveTextContent(
    'Ringkasan pelanggan'
  );
  expect(screen.getByText('Rp 1.000.000')).toBeInTheDocument();
  expect(screen.getByText('Jadwal booking dan layanan tersimpan')).toBeInTheDocument();
  expect(screen.queryByText('Form tambah layanan')).not.toBeInTheDocument();
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Tambah layanan' }), {
    button: 0,
    ctrlKey: false
  });
  expect(screen.getByText('Form tambah layanan')).toBeInTheDocument();
  expect(screen.queryByText('Jadwal booking dan layanan tersimpan')).not.toBeInTheDocument();
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Ubah jadwal' }), {
    button: 0,
    ctrlKey: false
  });
  expect(screen.getByText('Form ubah jadwal')).toBeInTheDocument();
  expect(screen.queryByText('Form tambah layanan')).not.toBeInTheDocument();
});
it('keeps cancelled bookings readable without management or cancellation actions', () => {
  mount(BookingStatus.CANCELLED);
  expect(screen.getByText('Jadwal booking dan layanan tersimpan')).toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Ubah jadwal' })).not.toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Tambah layanan' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Batalkan pemesanan' })).not.toBeInTheDocument();
});
