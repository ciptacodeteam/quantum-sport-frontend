vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn(), export: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: any) => {
    mocks.query(options);
    return { data: [{ id: 'debt', remainingSessions: -4 }], isPending: false };
  }
}));
vi.mock('@/queries/admin/membershipTransaction', () => ({
  adminMembershipTransactionsQueryOptions: (params: any) => ({ queryKey: ['transactions', params] })
}));
vi.mock('@/mutations/admin/membershipTransaction', () => ({
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
      <p>
        {columns.some((c: any) => c.id === 'actions')
          ? 'Ada aksi pengelolaan'
          : 'Daftar pemantauan'}
      </p>
    </div>
  )
}));
import MembershipTransactionTable from './MembershipTransactionTable';
beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('uses the shared negative balance report with a debt summary and no mutation actions', () => {
  render(<MembershipTransactionTable debtsOnly />);
  expect(mocks.query.mock.lastCall?.[0].queryKey.at(-1)).toEqual({ balance: 'negative' });
  expect(screen.getByText(/4 jam belum tertutup/)).toBeInTheDocument();
  expect(screen.queryByLabelText('Status Value Pack')).toBeNull();
  expect(screen.getByText('Daftar pemantauan')).toBeInTheDocument();
});
it('uses the nonnegative balance filter for the ordinary transaction page', () => {
  render(<MembershipTransactionTable />);
  expect(mocks.query.mock.lastCall?.[0].queryKey.at(-1)).toEqual({ balance: 'nonnegative' });
  expect(screen.getByLabelText('Status Value Pack')).toBeInTheDocument();
});

it.each([false, true])(
  'filters package purchase dates and exports the same dates with debtsOnly=%s',
  (debtsOnly) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 3, 12));
    render(<MembershipTransactionTable debtsOnly={debtsOnly} />);
    fireEvent.click(screen.getByRole('button', { name: /^Date range:/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    const expected = {
      balance: debtsOnly ? 'negative' : 'nonnegative',
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
