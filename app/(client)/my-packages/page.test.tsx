import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { TrackedPackage } from '@/types/membership-tracking';
import type { CoachingPackage } from '@/types/coaching-tracking';
const mocks = vi.hoisted(() => ({
  user: { id: 'customer' } as { id: string; role?: string } | null,
  packs: [] as TrackedPackage[],
  coachPacks: [] as CoachingPackage[],
  error: null as { code: number } | null,
  options: vi.fn(),
  refetch: vi.fn()
}));
vi.mock('@/components/headers/MainHeader', () => ({ default: () => null }));
vi.mock('@/components/footers/MainBottomNavigation', () => ({ default: () => null }));
vi.mock('@/queries/profile', () => ({ profileQueryOptions: { queryKey: ['profile'] } }));
vi.mock('@/queries/membership', () => ({
  myMembershipTrackingQueryOptions: (id: string) => ({ queryKey: ['tracking', id] })
}));
vi.mock('@/queries/coaching-packages', () => ({
  myCoachingPackagesQueryOptions: (id: string) => ({ queryKey: ['coach-tracking', id] })
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: { queryKey: string[] }) => {
    if (options.queryKey[0] === 'profile') return { data: mocks.user, isPending: false };
    mocks.options(options);
    return {
      data: mocks.error
        ? undefined
        : { packages: options.queryKey[0] === 'coach-tracking' ? mocks.coachPacks : mocks.packs },
      isPending: false,
      isFetching: false,
      isError: !!mocks.error,
      error: mocks.error,
      refetch: mocks.refetch
    };
  }
}));
import MyPackagesPage from './page';
const pack: TrackedPackage = {
  id: 'pack-user',
  name: 'Silver Member',
  sport: 'PADEL',
  type: 'ALL_HOUR',
  status: 'ACTIVE',
  totalHours: 10,
  remainingHours: 6,
  usedHours: 3,
  heldHours: 1,
  startDate: '2026-10-01T00:00:00Z',
  endDate: '2030-01-01T00:00:00Z',
  remainingDays: 100,
  purchaseInvoice: { number: 'INV-PACK', status: 'PAID' },
  usage: [
    {
      id: 'used',
      status: 'CONFIRMED',
      hours: 2,
      createdAt: '2026-10-23T00:00:00Z',
      invoiceNumber: 'INV-COURT',
      details: [
        {
          court: { id: 'court', name: 'Court 2' },
          slot: { startAt: '2026-10-23T00:00:00Z', endAt: '2026-10-23T01:00:00Z' }
        },
        {
          court: { id: 'court', name: 'Court 2' },
          slot: { startAt: '2026-10-23T01:00:00Z', endAt: '2026-10-23T02:00:00Z' }
        }
      ]
    }
  ]
};
beforeEach(() => {
  mocks.user = { id: 'customer' };
  mocks.packs = [];
  mocks.coachPacks = [];
  mocks.error = null;
  vi.clearAllMocks();
});
afterEach(cleanup);
it('shows the current balance and grouped court usage with an invoice link', () => {
  mocks.packs = [pack];
  render(<MyPackagesPage />);
  expect(screen.getByText('Silver Member')).toBeInTheDocument();
  expect(screen.getByText('Court 2')).toBeInTheDocument();
  expect(screen.getByText('00.00 - 02.00')).toBeInTheDocument();
  expect(screen.getByText('−2 jam')).toBeInTheDocument();
  expect(screen.getByText('Sisa waktu bermain').parentElement).toHaveTextContent('6 / 10 jam');
  expect(screen.getByRole('link', { name: /INV-COURT/ })).toHaveAttribute(
    'href',
    '/invoice/INV-COURT'
  );
});
it('switches balances and usage when a different owned package is selected', async () => {
  // jsdom does not implement the scrolling used by Radix keyboard navigation.
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn()
  });
  mocks.packs = [
    pack,
    {
      ...pack,
      id: 'tennis',
      name: 'Tennis Pack',
      sport: 'TENNIS',
      remainingHours: 8,
      usage: [],
      heldHours: 0
    }
  ];
  render(<MyPackagesPage />);
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Pilih paket' }), { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('option', { name: /Tennis Pack/ }));
  expect(screen.getByRole('heading', { name: 'Tennis Pack' })).toBeInTheDocument();
  expect(screen.getByText('Sisa waktu bermain').parentElement).toHaveTextContent('8 / 10 jam');
  expect(screen.queryByText('INV-COURT')).toBeNull();
  expect(screen.getByRole('link', { name: 'Gunakan paket' })).toHaveAttribute(
    'href',
    '/booking/tennis'
  );
});
it('keeps every playing date under its invoice with a single hours debit', () => {
  mocks.packs = [
    {
      ...pack,
      usage: [
        {
          ...pack.usage[0],
          hours: 4,
          details: [
            ...pack.usage[0].details,
            ...[24, 25].map((date) => ({
              court: { id: 'court-3', name: 'Court 3' },
              slot: {
                startAt: `2026-10-${date}T07:00:00Z`,
                endAt: `2026-10-${date}T08:00:00Z`
              }
            }))
          ]
        },
        { ...pack.usage[0], id: 'second', invoiceNumber: 'INV-SECOND', hours: 2 }
      ]
    }
  ];
  render(<MyPackagesPage />);
  const invoice = within(screen.getByRole('link', { name: /INV-COURT/ }));
  expect(invoice.getByRole('heading', { name: 'INV-COURT' })).toBeInTheDocument();
  expect(invoice.getByText('23 Okt 2026')).toBeInTheDocument();
  expect(invoice.getByText('24 Okt 2026')).toBeInTheDocument();
  expect(invoice.getByText('25 Okt 2026')).toBeInTheDocument();
  expect(invoice.getAllByText('−4 jam')).toHaveLength(1);
  expect(invoice.queryByText('INV-SECOND')).toBeNull();
  expect(
    within(screen.getByRole('link', { name: /INV-SECOND/ })).getByText('−2 jam')
  ).toBeInTheDocument();
});
it('does not treat canceled bookings as a debit', () => {
  mocks.packs = [{ ...pack, usage: [{ ...pack.usage[0], status: 'CANCELLED' }] }];
  render(<MyPackagesPage />);
  expect(screen.getByText('Dibatalkan')).toBeInTheDocument();
  expect(screen.queryByText('−2 jam')).toBeNull();
});
it('does not load private tracking data for guests or staff', () => {
  mocks.user = null;
  const view = render(<MyPackagesPage />);
  expect(mocks.options).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }));
  expect(screen.getByRole('button', { name: 'Masuk ke akun' })).toBeInTheDocument();
  mocks.user = { id: 'staff', role: 'ADMIN' };
  view.rerender(<MyPackagesPage />);
  expect(mocks.options).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }));
  expect(screen.getByText('Paket untuk akun pelanggan')).toBeInTheDocument();
});
it('offers recovery for failures and explains an empty package list', () => {
  mocks.error = { code: 500 };
  const view = render(<MyPackagesPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
  expect(mocks.refetch).toHaveBeenCalledOnce();
  mocks.error = null;
  view.rerender(<MyPackagesPage />);
  expect(screen.getByText('Belum ada paket')).toBeInTheDocument();
});
it.each(['PENDING', 'CANCELLED', 'FAILED', 'EXPIRED', 'REFUNDED'])(
  'shows the empty state instead of an owned package for a %s purchase',
  (paymentStatus) => {
    mocks.packs = [
      {
        ...pack,
        status: paymentStatus === 'PENDING' ? 'PENDING' : 'PAYMENT_FAILED',
        purchaseInvoice: { number: 'INV-INCOMPLETE', status: paymentStatus },
        usage: []
      }
    ];
    render(<MyPackagesPage />);
    expect(screen.getByText('Belum ada paket')).toBeInTheDocument();
    expect(screen.queryByText('Silver Member')).not.toBeInTheDocument();
    expect(screen.queryByText('Pembelian tidak selesai')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Lanjutkan pembayaran' })).not.toBeInTheDocument();
  }
);
it('shows only paid packages when failed purchases are returned alongside an owned package', () => {
  mocks.packs = [
    {
      ...pack,
      id: 'failed',
      name: 'Failed Pack',
      status: 'PAYMENT_FAILED',
      purchaseInvoice: { number: 'INV-FAILED', status: 'CANCELLED' }
    },
    pack
  ];
  render(<MyPackagesPage />);
  expect(screen.getByText('Silver Member')).toBeInTheDocument();
  expect(screen.queryByText('Failed Pack')).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox', { name: 'Pilih paket' })).not.toBeInTheDocument();
});

it('shows debt settled by a newly purchased package separately from played hours', () => {
  mocks.packs = [{ ...pack, remainingHours: 8, usedHours: 0, debtSettledHours: 2, usage: [] }];
  render(<MyPackagesPage />);
  expect(screen.getByText('Kuota untuk pelunasan minus')).toBeInTheDocument();
});

const coachingPack: CoachingPackage = {
  id: 'coach-pack',
  name: 'Coaching 5 Jam',
  coachName: 'Coach Andi',
  coachType: 'PADEL',
  branchName: 'Cemara',
  status: 'ACTIVE',
  totalHours: 5,
  remainingHours: 4,
  usedHours: 1,
  createdAt: '2026-11-16T02:00:00Z',
  purchaseInvoice: { number: 'INV-COACH-PACK', status: 'PAID' },
  usage: [
    {
      id: 'usage',
      hours: 1,
      participants: 2,
      createdAt: '2026-11-17T02:00:00Z',
      restoredAt: null,
      status: 'CONFIRMED',
      startAt: '2026-11-18T15:00:00Z',
      endAt: '2026-11-18T16:00:00Z',
      courtName: 'Court 1',
      branchName: 'Cemara',
      invoiceNumber: 'INV-COACH'
    }
  ]
};
function selectTab(name: string) {
  fireEvent.mouseDown(screen.getByRole('tab', { name }), { button: 0, ctrlKey: false });
}
it('switches between court and coach packages with coaching balances and session tracking', () => {
  mocks.packs = [pack];
  mocks.coachPacks = [coachingPack];
  render(<MyPackagesPage />);
  expect(screen.getByRole('tab', { name: 'Lapangan' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.queryByText('Coaching 5 Jam')).not.toBeInTheDocument();
  selectTab('Coach');
  expect(screen.getByText('Coaching 5 Jam')).toBeInTheDocument();
  expect(screen.getByText('Coach Andi')).toBeInTheDocument();
  expect(screen.getByText('Sisa waktu coaching').parentElement).toHaveTextContent('4 / 5 jam');
  expect(screen.getByText(/15:00–16:00 WIB/)).toBeInTheDocument();
  expect(screen.getByText('−1 jam')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'INV-COACH' })).toHaveAttribute(
    'href',
    '/invoice/INV-COACH'
  );
  expect(screen.queryByText('Silver Member')).not.toBeInTheDocument();
  selectTab('Lapangan');
  expect(screen.getByText('Silver Member')).toBeInTheDocument();
});
it('shows returned coaching quota without treating a cancelled session as usage', () => {
  mocks.coachPacks = [
    {
      ...coachingPack,
      usage: [{ ...coachingPack.usage[0], status: 'RESTORED', restoredAt: '2026-11-18T02:00:00Z' }]
    }
  ];
  render(<MyPackagesPage />);
  selectTab('Coach');
  expect(screen.getByText('Dibatalkan · kuota dikembalikan')).toBeInTheDocument();
  expect(screen.getByText('0 jam')).toBeInTheDocument();
  expect(screen.getByText(/\+1 jam dikembalikan/)).toBeInTheDocument();
  expect(screen.queryByText('−1 jam')).not.toBeInTheDocument();
});
it('offers a coach empty state independently of court packages and supports retry', () => {
  mocks.packs = [pack];
  const view = render(<MyPackagesPage />);
  selectTab('Coach');
  expect(screen.getByText('Belum ada paket coaching')).toBeInTheDocument();
  mocks.error = { code: 500 };
  view.rerender(<MyPackagesPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
  expect(mocks.refetch).toHaveBeenCalledOnce();
});
it.each([null, { id: 'staff', role: 'ADMIN' }])(
  'does not request coach tracking for guests or staff: %j',
  (user) => {
    mocks.user = user;
    render(<MyPackagesPage />);
    selectTab('Coach');
    expect(
      mocks.options.mock.calls.some(([options]) => options.queryKey[0] === 'coach-tracking')
    ).toBe(false);
    expect(
      screen.getByText(user ? 'Paket untuk akun pelanggan' : 'Masuk untuk melihat paket')
    ).toBeInTheDocument();
  }
);

it('switches between coaching packages and shows unused quota independently', async () => {
  mocks.coachPacks = [
    coachingPack,
    {
      ...coachingPack,
      id: 'other',
      name: 'Coaching Tennis',
      coachName: 'Coach Budi',
      coachType: 'TENNIS',
      remainingHours: 5,
      usedHours: 0,
      usage: []
    }
  ];
  render(<MyPackagesPage />);
  selectTab('Coach');
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Pilih paket coach' }), {
    key: 'ArrowDown'
  });
  fireEvent.click(await screen.findByRole('option', { name: /Coaching Tennis/ }));
  expect(screen.getByRole('heading', { name: 'Coaching Tennis' })).toBeInTheDocument();
  expect(screen.getByText('Sisa waktu coaching').parentElement).toHaveTextContent('5 / 5 jam');
  expect(screen.getByText('Belum ada pemakaian coaching tercatat')).toBeInTheDocument();
  expect(screen.queryByText('INV-COACH')).not.toBeInTheDocument();
});

it('asks the customer to sign in again when coach tracking returns an expired session', () => {
  mocks.error = { code: 401 };
  render(<MyPackagesPage />);
  selectTab('Coach');
  expect(screen.getByText('Sesi Anda telah berakhir')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Masuk ke akun' })).toBeInTheDocument();
  expect(screen.queryByText('Coaching 5 Jam')).not.toBeInTheDocument();
});
