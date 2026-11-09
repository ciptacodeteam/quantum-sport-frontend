vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DialogProvider } from '@/components/ui/dialog';
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  export: vi.fn(),
  row: {
    id: 'debt',
    canCancel: false,
    remainingSessions: -4,
    remainingDuration: 30,
    isExpired: false,
    isSuspended: false,
    startDate: '2026-11-01',
    endDate: '2027-07-08',
    createdAt: '2026-11-01',
    membership: { name: 'Paket Tennis 50 Jam', sport: 'TENNIS', sessions: 50 },
    user: { name: 'Robin', phone: '+6281234567890' },
    invoice: { id: 'invoice', number: 'INV-DEBT', status: 'PAID', total: 5000000 }
  }
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: any) => {
    mocks.query(options);
    return { data: [mocks.row], isPending: false };
  }
}));
vi.mock('@/queries/admin/membershipTransaction', () => ({
  adminMembershipTransactionsQueryOptions: (params: any) => ({ queryKey: ['transactions', params] })
}));
vi.mock('@/mutations/admin/membershipTransaction', () => ({
  useCancelMembershipTransactionMutation: () => ({ confirmAndMutate: vi.fn() }),
  useApproveMembershipTransactionMutation: () => ({ mutate: vi.fn() }),
  useRejectMembershipTransactionMutation: () => ({ mutate: vi.fn() }),
  useSuspendMembershipTransactionMutation: () => ({ mutate: vi.fn() }),
  useUnsuspendMembershipTransactionMutation: () => ({ mutate: vi.fn() }),
  useExportMembershipTransactionsExcel: () => ({ mutate: mocks.export })
}));
vi.mock('@/components/ui/data-table', () => ({
  DataTable: ({ rightActions, columns }: any) => (
    <div>
      {rightActions}
      {columns
        .find((column: any) => column.id === 'actions')
        ?.cell({ row: { original: mocks.row } })}
    </div>
  )
}));
import MembershipTransactionTable from './MembershipTransactionTable';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.row.invoice.status = 'PAID';
  mocks.row.canCancel = false;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('uses the shared negative balance report with a debt summary and no mutation actions', () => {
  render(<MembershipTransactionTable debtsOnly />, { wrapper: DialogProvider });
  expect(mocks.query.mock.lastCall?.[0].queryKey.at(-1)).toEqual({ balance: 'negative' });
  expect(screen.getByText(/4 jam belum tertutup/)).toBeInTheDocument();
  expect(screen.queryByLabelText('Status Value Pack')).toBeNull();
  expect(screen.getByRole('button', { name: 'Lihat detail Value Pack' })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', {
      name: /Setujui pembayaran|Tolak pembayaran|Tangguhkan|Aktifkan kembali/
    })
  ).toBeNull();
});
it('keeps all purchases visible in the ordinary transaction page', () => {
  render(<MembershipTransactionTable />, { wrapper: DialogProvider });
  expect(mocks.query.mock.lastCall?.[0].queryKey.at(-1)).toEqual({ balance: 'all' });
  expect(screen.getByLabelText('Status Value Pack')).toBeInTheDocument();
});

it.each([false, true])(
  'filters package purchase dates and exports the same dates with debtsOnly=%s',
  (debtsOnly) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 3, 12));
    render(<MembershipTransactionTable debtsOnly={debtsOnly} />, { wrapper: DialogProvider });
    fireEvent.click(screen.getByRole('button', { name: /^Date range:/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    const expected = {
      balance: debtsOnly ? 'negative' : 'all',
      dateFrom: '2026-11-03',
      dateTo: '2026-11-03'
    };
    expect(mocks.query.mock.lastCall?.[0].queryKey.at(-1)).toEqual(expected);
    fireEvent.click(screen.getByRole('button', { name: 'Export Excel' }));
    expect(mocks.export).toHaveBeenCalledWith(expected);
    fireEvent.click(screen.getByRole('button', { name: 'Reset filter tanggal' }));
    expect(mocks.query.mock.lastCall?.[0].queryKey.at(-1)).toEqual({ balance: expected.balance });
  }
);

it('opens the correct overdue package from an icon-only detail action', () => {
  render(<MembershipTransactionTable debtsOnly />, { wrapper: DialogProvider });
  const action = screen.getByRole('button', { name: 'Lihat detail Value Pack' });
  expect(action.textContent).toBe('');
  expect(action.querySelector('svg')).not.toBeNull();
  fireEvent.click(action);
  const detail = within(screen.getByRole('dialog', { name: 'Detail pemesanan Value Pack' }));
  expect(detail.getByText('Paket Tennis 50 Jam')).toBeInTheDocument();
  expect(detail.getByText('Robin')).toBeInTheDocument();
  expect(detail.getByText('Tunggakan kuota')).toBeInTheDocument();
  expect(detail.getByText('4 jam belum tertutup')).toBeInTheDocument();
  expect(detail.getByText('INV-DEBT')).toBeInTheDocument();
});

it('only offers the detail action in the debt report even when the invoice is pending', () => {
  mocks.row.invoice.status = 'PENDING';
  render(<MembershipTransactionTable debtsOnly />, { wrapper: DialogProvider });
  expect(screen.getByRole('button', { name: 'Lihat detail Value Pack' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Setujui pembayaran' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Tolak pembayaran' })).toBeNull();
});

it('shows cancellation for an eligible paid unused package', () => {
  mocks.row.canCancel = true;
  render(<MembershipTransactionTable />, { wrapper: DialogProvider });
  expect(screen.getByRole('button', { name: 'Batalkan Value Pack' })).toBeInTheDocument();
});
it.each([false, true])(
  'hides cancellation for used or debt packages with debtsOnly=%s',
  (debtsOnly) => {
    mocks.row.canCancel = debtsOnly;
    render(<MembershipTransactionTable debtsOnly={debtsOnly} />, { wrapper: DialogProvider });
    expect(screen.queryByRole('button', { name: 'Batalkan Value Pack' })).toBeNull();
  }
);
