import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Dialog } from '@/components/ui/dialog';
import { BookingStatus } from '@/lib/constants';
import type { Booking } from '@/types/model';
import BookingDetailsDialog from './BookingDetailsDialog';
vi.mock('./RescheduleCourtDialog', () => ({
  RescheduleCourtDialog: ({ detail, canReschedule }: any) => (
    <button disabled={!canReschedule}>Reschedule {detail.id}</button>
  )
}));
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

function courtSlot(hour: number, courtId = 'court-1', date = '2026-11-21') {
  const start = new Date(`${date}T00:00:00Z`);
  start.setUTCHours(hour);
  return {
    id: `${courtId}-${date}-${hour}`,
    courtId,
    slotId: `slot-${hour}`,
    price: 10000,
    court: { id: courtId, name: courtId === 'court-1' ? 'Court 1' : 'Court 2' },
    slot: { startAt: start.toISOString(), endAt: new Date(start.getTime() + 3600000).toISOString() }
  } as any;
}
it('collapses consecutive hours into one range and keeps individual rescheduling available on expansion', () => {
  const details = Array.from({ length: 13 }, (_, index) => courtSlot(index + 6));
  mount({ details, totalPrice: 130000 });
  const schedule = screen.getByRole('region', { name: 'Jadwal lapangan' });
  expect(within(schedule).getByText('06:00–19:00 WIB')).toBeInTheDocument();
  expect(within(schedule).getByText('13 slot')).toBeInTheDocument();
  expect(within(schedule).getByText('Rp 130.000')).toBeInTheDocument();
  const disclosure = schedule.querySelector('details')!;
  expect(disclosure).not.toHaveAttribute('open');
  fireEvent.click(within(schedule).getByText('Rincian per jam & reschedule'));
  expect(disclosure).toHaveAttribute('open');
  const action = within(disclosure).getByRole('button', {
    name: 'Reschedule court-1-2026-11-21-6'
  });
  expect(action).toBeEnabled();
  expect(within(disclosure).getAllByRole('button', { name: /Reschedule/ })).toHaveLength(13);
  expect(details).toHaveLength(13);
});
it('does not merge gaps, different courts or different dates', () => {
  mount({
    details: [
      courtSlot(6),
      courtSlot(8),
      courtSlot(7, 'court-2'),
      courtSlot(7, 'court-1', '2026-11-22')
    ]
  });
  const schedule = screen.getByRole('region', { name: 'Jadwal lapangan' });
  expect(schedule.querySelectorAll('details')).toHaveLength(0);
  expect(within(schedule).getAllByText('Court 1')).toHaveLength(2);
  expect(within(schedule).getByText('Court 2')).toBeInTheDocument();
  expect(within(schedule).getByText('06:00–07:00 WIB')).toBeInTheDocument();
  expect(within(schedule).getByText('08:00–09:00 WIB')).toBeInTheDocument();
});
it('merges unsorted late hours through midnight without changing the original slots', () => {
  const details = [courtSlot(23), courtSlot(22)];
  mount({ details, totalPrice: 20000 });
  const schedule = screen.getByRole('region', { name: 'Jadwal lapangan' });
  expect(within(schedule).getByText('22:00–00:00 WIB')).toBeInTheDocument();
  expect(within(schedule).getByText('Rp 20.000')).toBeInTheDocument();
  expect(details[0].id).toBe('court-1-2026-11-21-23');
});
