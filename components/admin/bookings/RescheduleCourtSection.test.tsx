import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { Booking, BookingDetail } from '@/types/model';
const mocks = vi.hoisted(() => ({ canWrite: true, props: {} as any }));
vi.mock('@/hooks/useRoleAccess', () => ({
  useHasRole: () => mocks.canWrite,
  useIsSuperAdmin: () => false
}));
vi.mock('./RescheduleCourtDialog', () => ({
  RescheduleCourtDialog: (props: any) => {
    mocks.props = props;
    return <button disabled={!props.canReschedule}>Reschedule</button>;
  }
}));
import RescheduleCourtSection from './RescheduleCourtSection';
const detail = {
  id: 'detail',
  discountPrice: 0,
  slot: { startAt: '2040-01-05 10:00:00', endAt: '2040-01-05 11:00:00' }
} as unknown as BookingDetail;
const booking = { status: 'CONFIRMED', invoice: { status: 'PAID' } } as Booking;
afterEach(() => {
  cleanup();
  mocks.canWrite = true;
});
it('exposes the existing reschedule action in the schedule detail with the original policy', () => {
  render(<RescheduleCourtSection detail={detail} booking={booking} />);
  expect(screen.getByRole('region', { name: 'Reschedule booking lapangan' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reschedule' })).toBeEnabled();
  expect(screen.getByText(/minimal 48 jam/)).toBeInTheDocument();
  expect(mocks.props.detail).toBe(detail);
});
it('keeps rescheduling disabled until the booking is confirmed and paid', () => {
  render(
    <RescheduleCourtSection
      detail={detail}
      booking={{ ...booking, invoice: { status: 'PENDING' } } as Booking}
    />
  );
  expect(screen.getByRole('button', { name: 'Reschedule' })).toBeDisabled();
});
it('preserves membership coverage when opening the shared reschedule dialog', () => {
  render(
    <RescheduleCourtSection
      detail={detail}
      booking={{ ...booking, membershipSessionsUsed: 1, courtDiscountPrice: 0 }}
    />
  );
  expect(mocks.props.membershipCovered).toBe(true);
});
it('hides write controls from viewers', () => {
  mocks.canWrite = false;
  render(<RescheduleCourtSection detail={detail} booking={booking} />);
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
});
