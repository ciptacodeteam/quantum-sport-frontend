vi.mock('@/components/admin/booking/RecurringBookingRules', () => ({ default: () => null }));
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import BookingLapangan from './page';
import { useBookingStore } from '@/stores/useBookingStore';

const fixtures = vi.hoisted(() => ({
  slots: ['court-a', 'court-b'].map((id) => ({
    id: `slot-${id}`,
    courtId: id,
    court: { id, name: id === 'court-a' ? 'Court A' : 'Court B' },
    startAt: '2040-01-02T12:00:00Z',
    endAt: '2040-01-02T13:00:00Z',
    price: 150000,
    isAvailable: true
  }))
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams()
}));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: () => ({ data: fixtures.slots, isLoading: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() })
}));
vi.mock('@/components/admin/booking/BookingSummary', () => ({ default: () => null }));
vi.mock('@/hooks/useMembershipDiscount', () => ({
  useMembershipDiscount: () => ({ discountAmount: 0, discountedTotal: 0, originalTotal: 0 })
}));

beforeEach(() => {
  useBookingStore.getState().clearAll();
  useBookingStore.setState({ selectedDate: new Date(2040, 0, 2) });
});
afterEach(cleanup);

it('deselects a court on a second click and clears its pending time slots', () => {
  render(<BookingLapangan />);
  const court = screen.getByRole('button', { name: /Court A/ });
  fireEvent.click(court);
  fireEvent.click(screen.getByRole('button', { name: '12:00' }));
  expect(screen.getByRole('button', { name: /Add to Booking/ })).toBeInTheDocument();

  fireEvent.click(court);
  expect(court).toHaveAttribute('aria-pressed', 'false');
  expect(screen.queryByRole('button', { name: /Add to Booking/ })).not.toBeInTheDocument();
  expect(screen.getByText('Select a court first to view time slots')).toBeInTheDocument();

  fireEvent.click(court);
  expect(court).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: '12:00' })).toHaveAttribute('aria-pressed', 'false');
});

it('clears pending times when switching to another court', () => {
  render(<BookingLapangan />);
  const first = screen.getByRole('button', { name: /Court A/ });
  const second = screen.getByRole('button', { name: /Court B/ });
  fireEvent.click(first);
  fireEvent.click(screen.getByRole('button', { name: '12:00' }));
  fireEvent.click(second);
  expect(first).toHaveAttribute('aria-pressed', 'false');
  expect(second).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: '12:00' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.queryByRole('button', { name: /Add to Booking/ })).not.toBeInTheDocument();
});
