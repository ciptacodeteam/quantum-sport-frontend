import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { OngoingBookingItem } from '@/types/model';
import OnGoingBookingScheduleSection from './OnGoingBookingScheduleSection';

const mocks = vi.hoisted(() => ({ bookings: [] as OngoingBookingItem[] }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: mocks.bookings, refetch: vi.fn() })
}));
vi.mock('@/queries/admin/booking', () => ({ ongoingBookingsQueryOptions: () => ({}) }));
afterEach(cleanup);

const booking = {
  id: 'booking-1',
  userId: 'user-1',
  status: 'CONFIRMED',
  totalPrice: 100000,
  processingFee: 0,
  createdAt: '2026-11-01T00:00:00Z'
};
const user = { id: 'user-1', name: 'Ivan Felix', email: null, phone: '', image: null };
const court = { courtId: 'court-3', courtName: 'Court 3', courtImage: '', price: 50000 };

it.each(['2026-11-11T20:00:00.000Z', '2026-11-11 20:00:00'])(
  'keeps the WIB hour and date for slot %s',
  (startAt) => {
    mocks.bookings = [
      {
        booking,
        user,
        schedule: {
          startAt,
          endAt: '2026-11-11T22:00:00Z',
          status: 'ongoing',
          minutesFromNow: -30,
          timeDisplay: ''
        },
        courts: [
          { ...court, slotStart: startAt, slotEnd: '2026-11-11T21:00:00Z' },
          {
            ...court,
            slotStart: '2026-11-11T21:00:00Z',
            slotEnd: '2026-11-11T22:00:00Z'
          }
        ],
        coaches: [],
        ballboys: [],
        inventories: [],
        invoice: null
      }
    ];
    render(<OnGoingBookingScheduleSection />);
    expect(screen.getByText('11 Nov')).toBeInTheDocument();
    expect(screen.getByText('20:00 - 22:00')).toBeInTheDocument();
    expect(screen.getByText('Berlangsung')).toBeInTheDocument();
    expect(screen.queryByText('12 Nov')).not.toBeInTheDocument();
  }
);

it('uses the schedule fallback for service bookings without slot details', () => {
  mocks.bookings = [
    {
      booking: { ...booking, id: 'booking-2' },
      user: { ...user, name: 'Robin' },
      schedule: {
        startAt: '2026-11-12T23:00:00Z',
        endAt: '2026-11-13T00:00:00Z',
        status: 'upcoming',
        minutesFromNow: 30,
        timeDisplay: ''
      },
      courts: [],
      coaches: [],
      ballboys: [],
      inventories: [],
      invoice: null
    }
  ];
  render(<OnGoingBookingScheduleSection />);
  expect(screen.getByText('12 Nov')).toBeInTheDocument();
  expect(screen.getByText('23:00 - 00:00')).toBeInTheDocument();
  expect(screen.getByText('Akan datang')).toBeInTheDocument();
});
