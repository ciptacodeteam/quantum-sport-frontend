import type * as ReactQuery from '@tanstack/react-query';
vi.mock('@/components/admin/booking/RecurringBookingRules', () => ({ default: () => null }));
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import BookingLapangan from './page';
import { useBookingStore } from '@/stores/useBookingStore';

const fixtures = vi.hoisted(() => ({
  queries: [] as any[],
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
  ...(await importOriginal<typeof ReactQuery>()),
  useQuery: (options: any) => {
    fixtures.queries.push(options);
    return { data: fixtures.slots, isLoading: false };
  },
  useQueryClient: () => ({ invalidateQueries: vi.fn() })
}));
vi.mock('@/components/admin/booking/BookingSummary', () => ({
  default: ({ recurringControls }: { recurringControls: React.ReactNode }) => (
    <aside aria-label="Booking Summary">{recurringControls}</aside>
  )
}));
vi.mock('@/hooks/useMembershipDiscount', () => ({
  useMembershipDiscount: () => ({ discountAmount: 0, discountedTotal: 0, originalTotal: 0 })
}));

beforeEach(() => {
  fixtures.queries = [];
  fixtures.slots.forEach((slot) => {
    slot.startAt = '2040-01-02T12:00:00Z';
    slot.endAt = '2040-01-02T13:00:00Z';
  });
  useBookingStore.getState().clearAll();
  useBookingStore.setState({ selectedDate: new Date(2040, 0, 2) });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('hides the current hour at exactly start +15 minutes while the admin tab stays open', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2040-01-02T13:14:59+07:00'));
  fixtures.slots.forEach((slot) => {
    slot.startAt = '2040-01-02T13:00:00Z';
    slot.endAt = '2040-01-02T14:00:00Z';
  });
  render(<BookingLapangan />);
  fireEvent.click(screen.getByRole('button', { name: /Court A/ }));
  expect(screen.getByRole('button', { name: '13:00' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: '13:00' }));
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(screen.queryByRole('button', { name: '13:00' })).toBeNull();
  expect(screen.queryByRole('button', { name: /Add to Booking/ })).toBeNull();
});

it('removes an added slot from the admin cart once its grace period expires', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2040-01-02T12:14:59+07:00'));
  render(<BookingLapangan />);
  fireEvent.click(screen.getByRole('button', { name: /Court A/ }));
  fireEvent.click(screen.getByRole('button', { name: '12:00' }));
  fireEvent.click(screen.getByRole('button', { name: /Add to Booking/ }));
  expect(useBookingStore.getState().bookingItems).toHaveLength(1);
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(useBookingStore.getState().bookingItems).toEqual([]);
});

it('opens today in WIB instead of a persisted October 31 before the first slots query', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-31T18:00:00Z'));
  // JSON persistence restores Date values as strings.
  useBookingStore.setState({
    selectedDate: new Date(2026, 9, 31).toISOString() as unknown as Date
  });
  render(<BookingLapangan />);
  expect(useBookingStore.getState().selectedDate).toEqual(new Date(2026, 10, 1));
  const selected = within(screen.getByLabelText('Booking dates'))
    .getAllByRole('button')
    .find((button) => button.getAttribute('aria-pressed') === 'true')!;
  expect(selected).toHaveTextContent('1');
  expect(selected).toHaveTextContent('Nov');
  const firstQuery = fixtures.queries.find((options) => options.queryKey[0] === 'courts');
  expect(firstQuery.queryKey[2]).toMatchObject({
    startAt: '2026-11-01T00:00:00.000Z',
    endAt: '2026-11-01T23:59:59.999Z'
  });
});

it('advances a stale selected date when returning to the tab after Jakarta midnight', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-31T16:59:00Z'));
  useBookingStore.setState({ selectedDate: new Date(2026, 9, 31) });
  render(<BookingLapangan />);
  vi.setSystemTime(new Date('2026-10-31T17:01:00Z'));
  act(() => {
    window.dispatchEvent(new Event('focus'));
  });
  expect(useBookingStore.getState().selectedDate).toEqual(new Date(2026, 10, 1));
});

it('preserves a future selection when returning to the tab', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-31T18:00:00Z'));
  const future = new Date(2026, 10, 2);
  useBookingStore.setState({ selectedDate: future });
  render(<BookingLapangan />);
  act(() => {
    window.dispatchEvent(new Event('focus'));
  });
  expect(useBookingStore.getState().selectedDate).toEqual(future);
});

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

it('keeps weekly booking controls inside the booking summary', () => {
  render(<BookingLapangan />);
  const summary = screen.getByRole('complementary', { name: 'Booking Summary' });
  expect(within(summary).getByRole('button', { name: 'Ulangi mingguan' })).toBeDisabled();
  expect(within(summary).getByText('Booking rutin')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Ulangi mingguan' })).toHaveLength(1);
});
