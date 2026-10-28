import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { BusinessInsightsResponse } from '@/types/model';
import BusinessInsightsSection from './BusinessInsightsSection';

vi.mock('@/components/ui/chart', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui/chart')>();
  return { ...actual, ChartContainer: () => null };
});

afterEach(cleanup);

const data: BusinessInsightsResponse = {
  courts: {
    total: 8,
    booked: 2,
    utilization: '25.00%',
    totalBookedHours: 5.5,
    topCourts: [],
    courtHours: [],
    topHours: [],
    topDays: []
  },
  coaches: { total: 11, active: 0, totalSessions: 0, topCoaches: [] },
  inventory: { totalItems: 2, itemsUsed: 1, totalValue: 200000, utilizationRate: '50.00%' },
  memberships: { total: 6, active: 1, newInPeriod: 0, activePercentage: '16.67%' },
  bookings: { total: 6, confirmed: 2, confirmationRate: '33.33%' },
  revenue: { total: 1000000, transactions: 3, avgPerTransaction: '333333.33' },
  dateRange: { startDate: '2026-09-26T17:00:00.000Z', endDate: '2026-10-26T16:59:59.999Z' }
};

it('preserves the business metrics and supporting details in the redesigned cards', () => {
  render(<BusinessInsightsSection data={data} isLoading={false} />);
  expect(screen.getAllByRole('region')).toHaveLength(6);
  const courts = within(screen.getByRole('region', { name: 'Court Utilization' }));
  expect(courts.getByText('25.00%')).toBeInTheDocument();
  expect(courts.getByText('5,5 jam')).toBeInTheDocument();
  expect(courts.getByText('8')).toBeInTheDocument();
  const coach = within(screen.getByRole('region', { name: 'Coach Performance' }));
  expect(coach.getByText('Coaching sessions')).toBeInTheDocument();
  expect(coach.getAllByText('0')).toHaveLength(2);
  expect(
    within(screen.getByRole('region', { name: 'Revenue Overview' })).getByText(/1\.000\.000/)
  ).toBeInTheDocument();
  expect(screen.queryByText('Business Insights')).not.toBeInTheDocument();
  expect(screen.queryByText(/^Period:/)).not.toBeInTheDocument();
});

it('does not display empty chart and ranking panels when the period has no activity', () => {
  render(<BusinessInsightsSection data={data} isLoading={false} />);
  for (const title of [
    'Peak Hours',
    'Popular Days',
    'Court Performance',
    'Top Courts',
    'Top Coaches'
  ]) {
    expect(screen.queryByText(title)).not.toBeInTheDocument();
  }
});

it('distinguishes loading from an unavailable report', () => {
  const { rerender } = render(<BusinessInsightsSection data={undefined} isLoading />);
  expect(screen.getByRole('status', { name: 'Loading business insights' })).toBeInTheDocument();
  expect(screen.queryByText('Business insights unavailable')).not.toBeInTheDocument();
  rerender(<BusinessInsightsSection data={undefined} isLoading={false} />);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByText('Business insights unavailable')).toBeInTheDocument();
});

it('combines court ranking, sessions and hours without repeating the old Top Courts panel', () => {
  render(
    <BusinessInsightsSection
      isLoading={false}
      data={{
        ...data,
        courts: {
          ...data.courts,
          topCourts: [{ court: { id: 'a', name: 'Court A' }, bookings: 9 }],
          courtHours: [
            {
              court: { id: 'zero', name: 'Unused Court', sport: 'TENNIS' },
              bookingCount: 0,
              bookedHours: 0
            },
            {
              court: { id: 'a', name: 'Court A', sport: 'PADEL' },
              bookingCount: 1,
              bookedHours: 8
            },
            { court: { id: 'b', name: 'Court B', sport: 'PADEL' }, bookingCount: 5, bookedHours: 5 }
          ]
        }
      }}
    />
  );
  const table = within(screen.getByRole('table', { name: 'Court performance' }));
  expect(table.getAllByRole('rowheader').map((cell) => cell.textContent)).toEqual([
    'Court B',
    'Court A',
    'Unused Court'
  ]);
  const rows = table.getAllByRole('row').slice(1);
  expect(
    within(rows[0])
      .getAllByRole('cell')
      .map((cell) => cell.textContent)
  ).toEqual(['1', 'padel', '5', '5 jam']);
  expect(
    within(rows[1])
      .getAllByRole('cell')
      .map((cell) => cell.textContent)
  ).toEqual(['2', 'padel', '1', '8 jam']);
  expect(
    within(rows[2])
      .getAllByRole('cell')
      .map((cell) => cell.textContent)
  ).toEqual(['—', 'tennis', '0', '0 jam']);
  expect(screen.queryByText('Top Courts')).not.toBeInTheDocument();
  expect(table.queryByText('9')).not.toBeInTheDocument();
});
