import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Dialog } from '@/components/ui/dialog';
import { BookingStatus } from '@/lib/constants';
import type { Booking } from '@/types/model';
import BookingDetailsDialog from './BookingDetailsDialog';
vi.mock('./RescheduleCourtDialog', () => ({ RescheduleCourtDialog: () => null }));
afterEach(cleanup);
function mount(booking: Partial<Booking>) {
  render(
    <Dialog open>
      <BookingDetailsDialog
        booking={
          {
            id: 'booking',
            status: BookingStatus.CONFIRMED,
            totalPrice: 150000,
            processingFee: 0,
            createdAt: new Date('2026-11-06T03:00:00Z'),
            details: [],
            ...booking
          } as Booking
        }
        status={BookingStatus.CONFIRMED}
        onRescheduleSuccess={vi.fn()}
      />
    </Dialog>
  );
}
it.each(['Cash', 'QRIS', 'Transfer', 'EDC'])(
  'shows the actual %s payment method in the booking detail',
  (name) => {
    mount({ invoice: { number: 'INV-1', status: 'PAID', payment: { method: { name } } } as any });
    expect(screen.getByText('Metode pembayaran').parentElement).toHaveTextContent(name);
    expect(screen.getByText('Status pembayaran').parentElement).toHaveTextContent('Lunas');
  }
);
it('labels internal reservations without suggesting a payment method', () => {
  mount({ purpose: 'COACH_TRAINING', activityName: 'Andi', totalPrice: 0 });
  expect(screen.getByText('Metode pembayaran').parentElement).toHaveTextContent('Tanpa pembayaran');
});
it('distinguishes membership usage from a missing payment record', () => {
  mount({ membershipUserId: 'pack', totalPrice: 0 });
  expect(screen.getByText('Metode pembayaran').parentElement).toHaveTextContent(
    'Membership / Value Pack'
  );
});
it('handles a booking without payment information', () => {
  mount({});
  expect(screen.getByText('Metode pembayaran').parentElement).toHaveTextContent('Belum tersedia');
});
