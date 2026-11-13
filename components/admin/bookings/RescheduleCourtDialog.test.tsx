import type * as ReactQuery from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { RescheduleCourtDialog, type BookingDetailWithSlot } from './RescheduleCourtDialog';

const mocks = vi.hoisted(() => ({
  isSuperAdmin: false,
  quoteError: null as unknown,
  refetchQuote: vi.fn(),
  quote: {
    priceDifference: 0,
    courtDifference: 0,
    serviceDifference: 0,
    previousCourtPrice: 150000,
    targetCourtPrice: 150000
  },
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
        startAt: '2040-01-05T10:00:00Z',
        endAt: '2040-01-05T11:00:00Z',
        price: 150000
      })),
      {
        id: 'booked-padel',
        courtId: 'padel',
        isAvailable: false,
        availabilityStatus: 'BOOKED',
        startAt: '2040-01-05T11:00:00Z',
        endAt: '2040-01-05T12:00:00Z',
        price: 150000
      },
      {
        id: 'old-slot',
        courtId: 'padel',
        isAvailable: false,
        availabilityStatus: 'BOOKED',
        startAt: '2040-01-05T09:00:00Z',
        endAt: '2040-01-05T10:00:00Z',
        price: 150000
      }
    ]
  }
}));
vi.mock('@/hooks/useRoleAccess', () => ({ useIsSuperAdmin: () => mocks.isSuperAdmin }));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof ReactQuery>()),
  useQuery: (options: any) => {
    mocks.queries(options);
    return {
      data: options.queryKey.includes('court-reschedule-quote')
        ? mocks.quote
        : options.queryKey.includes('payment-methods')
          ? [{ id: 'cash', name: 'Tunai', isActive: true, isOffline: true }]
          : options.queryKey.includes('slots')
            ? mocks.data
            : { sport: mocks.sourceSport },
      isFetching: false,
      isError: options.queryKey.includes('court-reschedule-quote') && !!mocks.quoteError,
      error: options.queryKey.includes('court-reschedule-quote') ? mocks.quoteError : null,
      refetch: mocks.refetchQuote
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
      startAt: '2040-01-05T09:00:00Z',
      endAt: '2040-01-05T10:00:00Z'
    }
  } as unknown as BookingDetailWithSlot;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.sourceSport = undefined;
  mocks.isSuperAdmin = false;
  mocks.quoteError = null;
  mocks.quote = {
    priceDifference: 0,
    courtDifference: 0,
    serviceDifference: 0,
    previousCourtPrice: 150000,
    targetCourtPrice: 150000
  };
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

it('allows super admin to reschedule after the original deadline, including an ongoing session', () => {
  mocks.isSuperAdmin = true;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2040-01-05T02:29:59Z'));
  try {
    render(<RescheduleCourtDialog detail={detail('PADEL')} canReschedule />);
    const trigger = screen.getByRole('button', { name: 'Reschedule' });
    expect(trigger).toBeEnabled();
    fireEvent.click(trigger);
    expect(screen.getByText(/Super Admin dapat reschedule hingga sebelum 30 menit/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /10:00–11:00/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Simpan jadwal' }));
    expect(mocks.mutate).toHaveBeenCalledWith('new-padel');
  } finally {
    vi.useRealTimers();
  }
});

it('allows a more expensive slot and requires a payment method for the quoted increase', () => {
  mocks.quote = {
    priceDifference: 50000,
    courtDifference: 50000,
    serviceDifference: 0,
    previousCourtPrice: 150000,
    targetCourtPrice: 200000
  };
  render(<RescheduleCourtDialog detail={detail('PADEL')} canReschedule />);
  fireEvent.click(screen.getByRole('button', { name: /Reschedule/ }));
  fireEvent.click(screen.getByRole('button', { name: /10:00–11:00/ }));
  expect(screen.getByLabelText('Selisih biaya reschedule')).toHaveTextContent('50.000');
  const save = screen.getByRole('button', { name: 'Simpan jadwal' });
  expect(save).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Metode pembayaran selisih'), {
    target: { value: 'cash' }
  });
  expect(save).toBeEnabled();
  fireEvent.click(save);
  expect(mocks.mutate).toHaveBeenCalledWith('new-padel');
});
it('allows a cheaper destination with no refund and no extra payment', () => {
  mocks.quote = {
    priceDifference: 0,
    courtDifference: 0,
    serviceDifference: 0,
    previousCourtPrice: 250000,
    targetCourtPrice: 150000
  };
  render(<RescheduleCourtDialog detail={detail('PADEL')} canReschedule />);
  fireEvent.click(screen.getByRole('button', { name: /Reschedule/ }));
  fireEvent.click(screen.getByRole('button', { name: /10:00–11:00/ }));
  expect(screen.getByLabelText('Selisih biaya reschedule')).toHaveTextContent('hangus');
  expect(screen.queryByLabelText('Metode pembayaran selisih')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Simpan jadwal' })).toBeEnabled();
});

it('automatically disables the super-admin trigger at 30 minutes after the start', () => {
  mocks.isSuperAdmin = true;
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2040-01-05T02:29:59Z'));
  try {
    render(<RescheduleCourtDialog detail={detail('PADEL')} canReschedule />);
    expect(screen.getByRole('button', { name: 'Reschedule' })).toBeEnabled();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('button', { name: 'Reschedule' })).toBeDisabled();
  } finally {
    vi.useRealTimers();
  }
});

it('prevents super admin saving when the 30-minute cutoff passes with the dialog open', () => {
  mocks.isSuperAdmin = true;
  const time = vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2040-01-05T02:29:59Z'));
  try {
    render(<RescheduleCourtDialog detail={detail('PADEL')} canReschedule />);
    fireEvent.click(screen.getByRole('button', { name: 'Reschedule' }));
    fireEvent.click(screen.getByRole('button', { name: /10:00–11:00/ }));
    time.mockReturnValue(Date.parse('2040-01-05T02:30:00Z'));
    fireEvent.click(screen.getByRole('button', { name: 'Simpan jadwal' }));
    expect(mocks.mutate).not.toHaveBeenCalled();
  } finally {
    time.mockRestore();
  }
});

it('automatically closes cashier rescheduling at the H-2 boundary in WIB', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2040-01-03T09:00:00+07:00'));
  try {
    render(<RescheduleCourtDialog detail={detail('PADEL')} canReschedule />);
    expect(screen.getByRole('button', { name: 'Reschedule' })).toBeEnabled();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('button', { name: 'Reschedule' })).toBeDisabled();
  } finally {
    vi.useRealTimers();
  }
});

it.each([
  { message: 'Coach yang dipesan tidak tersedia pada jadwal pengganti. Pilih jadwal lain.' },
  { msg: 'Jam pengganti tidak sesuai ketentuan membership.' }
])('shows the normalized quote rejection and allows retrying the same slot: %o', (error) => {
  mocks.quoteError = error;
  render(<RescheduleCourtDialog detail={detail('PADEL')} canReschedule />);
  fireEvent.click(screen.getByRole('button', { name: 'Reschedule' }));
  fireEvent.click(screen.getByRole('button', { name: /10:00–11:00/ }));
  expect(screen.getByRole('alert')).toHaveTextContent(error.message ?? error.msg!);
  expect(screen.getByRole('button', { name: 'Simpan jadwal' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
  expect(mocks.refetchQuote).toHaveBeenCalledOnce();
  expect(mocks.mutate).not.toHaveBeenCalled();
});
