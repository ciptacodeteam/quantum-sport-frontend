import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  query: vi.fn(),
  data: undefined as any,
  branch: 'cemara' as string | null,
  error: false
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: any) => {
    mocks.query(options);
    return {
      data: mocks.data,
      isLoading: false,
      isError: mocks.error,
      isFetching: false,
      refetch: vi.fn()
    };
  }
}));
vi.mock('@/lib/adminApi', () => ({ adminApi: { get: mocks.get } }));
vi.mock('@/stores/useBranchStore', () => ({
  useBranchStore: (select: any) => select({ adminBranchId: mocks.branch })
}));
vi.mock('@/stores/useAuthStore', () => ({
  default: (select: any) => select({ user: { role: 'SUPER_ADMIN' } })
}));
vi.mock('@/components/ui/date-range-input', () => ({
  default: () => <button>Kalender periode</button>
}));
import CourtPerformancePage from './page';
const totals = {
  hours: 2,
  pastHours: 1,
  upcomingHours: 1,
  paidRevenue: 200000,
  membershipAllocation: 100000,
  revenue: 300000,
  realizedRevenue: 150000,
  bookings: 1,
  unvaluedMembershipHours: 0
};
const row = {
  id: 'd1',
  bookingId: 'b1',
  invoiceId: 'i1',
  invoiceNumber: 'INV-1',
  customer: 'Andi',
  courtId: 'court1',
  court: 'Padel Court 1',
  sport: 'PADEL',
  startAt: '2026-10-01T00:00:00Z',
  endAt: '2026-10-01T01:00:00Z',
  createdAt: '2026-09-30T00:00:00Z',
  categoryId: 'regular:happyHour',
  category: 'Non-membership · Happy Hour',
  band: 'happyHour',
  hours: 1,
  pastHours: 1,
  upcomingHours: 0,
  normalPrice: 200000,
  paidRevenue: 200000,
  membershipAllocation: 0,
  revenue: 200000
};
beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
  vi.clearAllMocks();
  mocks.error = false;
  mocks.branch = 'cemara';
  mocks.data = {
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    courts: [{ id: 'court1', name: 'Padel Court 1', sport: 'PADEL' }],
    summary: {
      ...totals,
      capacityHours: 4,
      occupiedHours: 2,
      occupancy: 50,
      membershipHours: 1,
      nonMembershipHours: 1
    },
    courtSummary: [],
    categories: [
      { ...totals, id: 'regular:happyHour', name: 'Non-membership · Happy Hour' },
      { ...totals, id: 'membership:pack', name: '50-hour package' }
    ],
    rows: [
      row,
      {
        ...row,
        id: 'd2',
        customer: 'Budi',
        categoryId: 'membership:pack',
        category: '50-hour package',
        band: 'peakHour',
        paidRevenue: 0,
        membershipAllocation: 100000,
        revenue: 100000
      }
    ]
  };
});
afterEach(cleanup);
it('shows capacity, occupancy and separate payment/package valuation without a native calendar', () => {
  render(<CourtPerformancePage />);
  expect(screen.getByText('50%')).toBeInTheDocument();
  expect(screen.getByText('2 dari 4 jam kapasitas terbit')).toBeInTheDocument();
  expect(screen.getByText('Nilai pemakaian lapangan')).toBeInTheDocument();
  expect(document.querySelector('input[type="date"]')).toBeNull();
  expect(mocks.query.mock.calls[0][0].queryKey).toContain('cemara');
});
it('filters booking details by search, category and tariff independently', () => {
  render(<CourtPerformancePage />);
  const details = document.getElementById('booking-details')!;
  fireEvent.change(screen.getByLabelText('Cari booking'), { target: { value: 'Andi' } });
  expect(within(details).queryByText('Budi')).toBeNull();
  fireEvent.change(screen.getByLabelText('Cari booking'), { target: { value: '' } });
  fireEvent.keyDown(screen.getByLabelText('Kategori booking'), { key: 'Enter' });
  fireEvent.click(screen.getByRole('option', { name: '50-hour package' }));
  expect(within(details).queryByText('Andi')).toBeNull();
  expect(within(details).getByText('Budi')).toBeInTheDocument();
  fireEvent.keyDown(screen.getByLabelText('Jam tarif'), { key: 'Enter' });
  fireEvent.click(screen.getByRole('option', { name: 'Happy Hour' }));
  expect(within(details).getByText('Belum ada booking yang sesuai filter.')).toBeInTheDocument();
});
it('applies court selection only when Tampilkan is pressed', () => {
  render(<CourtPerformancePage />);
  fireEvent.keyDown(screen.getByLabelText('Lapangan'), { key: 'Enter' });
  fireEvent.click(screen.getByRole('option', { name: 'Padel Court 1 · Padel' }));
  expect(mocks.query.mock.lastCall?.[0].queryKey.at(-1).courtId).toBeUndefined();
  fireEvent.click(screen.getByRole('button', { name: 'Tampilkan' }));
  expect(mocks.query.mock.lastCall?.[0].queryKey.at(-1).courtId).toBe('court1');
});
it('surfaces missing package valuations and supports retry on failure', () => {
  mocks.data.summary.unvaluedMembershipHours = 2;
  const view = render(<CourtPerformancePage />);
  expect(screen.getByText(/2 jam Value Pack belum dapat dinilai/)).toBeInTheDocument();
  mocks.error = true;
  view.rerender(<CourtPerformancePage />);
  expect(screen.getByRole('alert')).toHaveTextContent('Data performa gagal dimuat');
  expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
});

it('shows branch comparison only in the all-branches report', () => {
  mocks.branch = null;
  mocks.data.branchSummary = [
    {
      ...totals,
      id: 'cemara',
      name: 'Cemara',
      courts: 2,
      capacityHours: 4,
      occupiedHours: 2,
      occupancy: 50,
      revenueShare: 60
    },
    {
      ...totals,
      id: 's-parman',
      name: 'S. Parman',
      courts: 2,
      capacityHours: 8,
      occupiedHours: 2,
      occupancy: 25,
      revenueShare: 40
    }
  ];
  render(<CourtPerformancePage />);
  expect(screen.getByText('Perbandingan antar cabang')).toBeInTheDocument();
  expect(screen.getByText('Cemara')).toBeInTheDocument();
  expect(screen.getByText('S. Parman')).toBeInTheDocument();
  expect(screen.getByText('60%')).toBeInTheDocument();
});
