import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import dayjs from 'dayjs';
import { useBookingStore } from '@/stores/useBookingStore';
import BookingLapangan from './page';

const mocks = vi.hoisted(() => ({ slots: [] as any[], push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams()
}));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: () => ({ data: mocks.slots, isLoading: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() })
}));
vi.mock('@/hooks/useMembershipDiscount', () => ({
  useMembershipDiscount: () => ({
    discountAmount: 0,
    originalTotal: 0,
    finalTotal: 0,
    canUseMembership: false
  })
}));
vi.mock('@/components/admin/booking/BookingSummary', () => ({
  default: () => <div>Booking summary</div>
}));

beforeEach(() => {
  useBookingStore.getState().clearAll();
  const tomorrow = dayjs().add(1, 'day').startOf('day');
  useBookingStore.setState({ selectedDate: tomorrow.toDate(), selectedCustomerId: null });
  mocks.slots = [9, 10].map((hour) => ({
    id: `slot-${hour}`,
    courtId: 'court-a',
    court: { id: 'court-a', name: 'Court Alpha', image: null },
    startAt: `${tomorrow.format('YYYY-MM-DD')}T${hour.toString().padStart(2, '0')}:00:00+07:00`,
    endAt: `${tomorrow.format('YYYY-MM-DD')}T${(hour + 1).toString().padStart(2, '0')}:00:00+07:00`,
    price: 150000,
    discountPrice: 0,
    isAvailable: hour === 9
  }));
});
afterEach(cleanup);

it('supports court and time selection with real buttons and adds the chosen slot to the booking', () => {
  render(<BookingLapangan />);
  fireEvent.click(screen.getByRole('button', { name: /Court Alpha/ }));
  expect(screen.getByRole('button', { name: /Court Alpha/ })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  const available = screen.getByRole('button', { name: '09:00' });
  fireEvent.click(available);
  expect(available).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Add to Booking (1)' }));
  expect(useBookingStore.getState().bookingItems).toEqual([
    expect.objectContaining({
      courtId: 'court-a',
      slotId: 'slot-9',
      timeSlot: '09:00 - 10:00',
      price: 150000
    })
  ]);
});

it('prevents unavailable time slots from being selected', () => {
  render(<BookingLapangan />);
  fireEvent.click(screen.getByRole('button', { name: /Court Alpha/ }));
  const booked = screen.getByRole('button', { name: '10:00 · Booked' });
  expect(booked).toBeDisabled();
  fireEvent.click(booked);
  expect(screen.queryByRole('button', { name: /Add to Booking/ })).not.toBeInTheDocument();
});

it('keeps a continuous price range when a middle slot is already booked', () => {
  const date = dayjs(useBookingStore.getState().selectedDate).format('YYYY-MM-DD');
  mocks.slots = [15, 16, 17].map((hour) => ({
    id: `slot-${hour}`,
    courtId: 'court-a',
    court: { id: 'court-a', name: 'Court Alpha', image: null },
    startAt: `${date}T${hour}:00:00+07:00`,
    endAt: `${date}T${hour + 1}:00:00+07:00`,
    price: 200000,
    discountPrice: 0,
    isAvailable: hour !== 16
  }));
  render(<BookingLapangan />);
  expect(screen.getByText(/15:00–18:00/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Court Alpha/ }));
  expect(screen.getByRole('button', { name: '16:00 · Booked' })).toBeDisabled();
});
