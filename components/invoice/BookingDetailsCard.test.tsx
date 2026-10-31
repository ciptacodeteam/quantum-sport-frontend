import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import BookingDetailsCard from './BookingDetailsCard';
const slot = (start: string, end: string, courtId = 'court-2') => ({
  price: 200000,
  discountPrice: 150000,
  court: { id: courtId, name: 'Court 2' },
  slot: { startAt: `2026-10-23T${start}:00Z`, endAt: `2026-10-23T${end}:00Z` }
});
afterEach(cleanup);
it('combines consecutive slots in chronological order and sums their actual prices', () => {
  render(<BookingDetailsCard details={[slot('01:00', '02:00'), slot('00:00', '01:00')]} />);
  expect(screen.getByText('00.00 - 02.00')).toBeInTheDocument();
  expect(screen.getByText('Rp300.000')).toBeInTheDocument();
  expect(screen.queryByText('00.00 - 01.00')).toBeNull();
});
it('keeps gaps separate rather than implying a continuous booking', () => {
  render(<BookingDetailsCard details={[slot('00:00', '01:00'), slot('02:00', '03:00')]} />);
  expect(screen.getByText('00.00 - 01.00')).toBeInTheDocument();
  expect(screen.getByText('02.00 - 03.00')).toBeInTheDocument();
  expect(screen.queryByText('00.00 - 03.00')).toBeNull();
});
it('does not merge separate courts that share a display name', () => {
  render(
    <BookingDetailsCard
      details={[slot('00:00', '01:00', 'court-a'), slot('01:00', '02:00', 'court-b')]}
    />
  );
  expect(screen.getAllByText('Court 2')).toHaveLength(2);
  expect(screen.queryByText('00.00 - 02.00')).toBeNull();
});

it('labels membership-covered court time without showing a cash charge', () => {
  render(
    <BookingDetailsCard
      details={[slot('00:00', '01:00'), slot('01:00', '02:00')]}
      coveredByMembership
    />
  );
  expect(screen.getByText('00.00 - 02.00')).toBeInTheDocument();
  expect(screen.getByText('Value Pack')).toBeInTheDocument();
  expect(screen.queryByText('Rp300.000')).toBeNull();
});

it('keeps adjacent membership and cash slots separate in a mixed invoice', () => {
  render(
    <BookingDetailsCard
      details={[{ ...slot('00:00', '01:00'), discountPrice: 0 }, slot('01:00', '02:00')]}
      membershipApplied
    />
  );
  expect(screen.getByText('Value Pack')).toBeInTheDocument();
  expect(screen.getByText('Rp150.000')).toBeInTheDocument();
  expect(screen.getByText('00.00 - 01.00')).toBeInTheDocument();
  expect(screen.getByText('01.00 - 02.00')).toBeInTheDocument();
  expect(screen.queryByText('00.00 - 02.00')).toBeNull();
});
