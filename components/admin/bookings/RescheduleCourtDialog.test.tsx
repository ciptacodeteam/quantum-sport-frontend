import type * as ReactQuery from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { RescheduleCourtDialog, type BookingDetailWithSlot } from './RescheduleCourtDialog';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  queries: vi.fn(),
  sourceSport: undefined as string | undefined,
  data: {
    courts: [
      { id: 'padel', name: 'Padel Court 1', sport: 'PADEL' },
      { id: 'tennis', name: 'Tennis Court 1', sport: 'TENNIS' }
    ],
    slots: [
      ...['padel', 'tennis'].map((courtId) => ({
        id: `new-${courtId}`,
        courtId,
        isAvailable: true,
        startAt: '2040-01-05T03:00:00Z',
        endAt: '2040-01-05T04:00:00Z',
        price: 150000
      })),
      {
        id: 'booked-padel',
        courtId: 'padel',
        isAvailable: false,
        availabilityStatus: 'BOOKED',
        startAt: '2040-01-05T04:00:00Z',
        endAt: '2040-01-05T05:00:00Z',
        price: 150000
      },
      {
        id: 'old-slot',
        courtId: 'padel',
        isAvailable: false,
        availabilityStatus: 'BOOKED',
        startAt: '2040-01-05T02:00:00Z',
        endAt: '2040-01-05T03:00:00Z',
        price: 150000
      }
    ]
  }
}));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof ReactQuery>()),
  useQuery: (options: any) => {
    mocks.queries(options);
    return {
      data: options.queryKey.includes('slots') ? mocks.data : { sport: mocks.sourceSport },
      isFetching: false,
      isError: false
    };
  },
  useMutation: () => ({ mutate: mocks.mutate, isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() })
}));
function detail(sport?: 'PADEL' | 'TENNIS') {
  const courtId = sport === 'TENNIS' ? 'tennis' : 'padel';
  return {
    id: 'detail',
    price: 150000,
    courtId,
    court: { id: courtId, name: sport === 'TENNIS' ? 'Tennis Court 1' : 'Padel Court 1', sport },
    slot: {
      id: 'old-slot',
      courtId,
      startAt: '2040-01-05T02:00:00Z',
      endAt: '2040-01-05T03:00:00Z'
    }
  } as unknown as BookingDetailWithSlot;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.sourceSport = undefined;
});
afterEach(cleanup);
it.each(['PADEL', 'TENNIS'] as const)(
  'only offers and submits %s slots even if the API accidentally returns both sports',
  (sport) => {
    render(<RescheduleCourtDialog detail={detail(sport)} canReschedule />);
    fireEvent.click(screen.getByRole('button', { name: 'Reschedule' }));
    const allowed = sport === 'PADEL' ? 'Padel Court 1' : 'Tennis Court 1';
    const excluded = sport === 'PADEL' ? 'Tennis Court 1' : 'Padel Court 1';
    expect(screen.getByRole('button', { name: new RegExp(allowed) })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: new RegExp(excluded) })).not.toBeInTheDocument();
    expect(
      mocks.queries.mock.calls.some(
        ([options]) =>
          options.queryKey.includes('slots') &&
          options.queryKey[5] === sport &&
          options.queryKey[6] === true &&
          options.enabled
      )
    ).toBe(true);
    expect(screen.getByRole('button', { name: 'Simpan jadwal' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /10:00–11:00/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Simpan jadwal' }));
    expect(mocks.mutate).toHaveBeenCalledWith(`new-${sport.toLowerCase()}`);
  }
);
it('does not guess padel or allow saving when the original sport is unknown', () => {
  render(<RescheduleCourtDialog detail={detail()} canReschedule />);
  fireEvent.click(screen.getByRole('button', { name: 'Reschedule' }));
  expect(screen.getByText('Jenis lapangan belum dapat ditentukan.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Simpan jadwal' })).toBeDisabled();
  expect(mocks.mutate).not.toHaveBeenCalled();
  expect(
    mocks.queries.mock.calls
      .filter(([options]) => options.queryKey.includes('slots'))
      .every(([options]) => !options.enabled)
  ).toBe(true);
});

it('shows booked and current sessions but never lets them be selected', () => {
  render(<RescheduleCourtDialog detail={detail('PADEL')} canReschedule />);
  fireEvent.click(screen.getByRole('button', { name: 'Reschedule' }));
  const booked = screen.getByRole('button', { name: /11:00–12:00.*Sudah dipesan/ });
  const current = screen.getByRole('button', { name: /09:00–10:00.*Jadwal saat ini/ });
  expect(booked).toBeDisabled();
  expect(current).toBeDisabled();
  fireEvent.click(booked);
  expect(screen.getByRole('button', { name: 'Simpan jadwal' })).toBeDisabled();
  expect(mocks.mutate).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: /10:00–11:00/ })).toBeEnabled();
});

it('disables rescheduling less than 48 hours before the original slot', () => {
  const source = detail('PADEL');
  source.slot!.startAt = new Date(Date.now() + 48 * 3600000 - 1000);
  render(<RescheduleCourtDialog detail={source} canReschedule />);
  expect(screen.getByRole('button', { name: 'Reschedule' })).toBeDisabled();
  expect(mocks.mutate).not.toHaveBeenCalled();
});

it('prevents saving when the H-2 deadline passes while the dialog is open', () => {
  const time = vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2040-01-03T01:59:59Z'));
  try {
    render(<RescheduleCourtDialog detail={detail('PADEL')} canReschedule />);
    fireEvent.click(screen.getByRole('button', { name: 'Reschedule' }));
    fireEvent.click(screen.getByRole('button', { name: /10:00–11:00/ }));
    time.mockReturnValue(Date.parse('2040-01-03T02:00:00.001Z'));
    fireEvent.click(screen.getByRole('button', { name: 'Simpan jadwal' }));
    expect(mocks.mutate).not.toHaveBeenCalled();
  } finally {
    time.mockRestore();
  }
});
