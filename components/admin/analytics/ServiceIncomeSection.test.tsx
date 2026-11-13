import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import ServiceIncomeSection from './ServiceIncomeSection';
import type { ServiceIncomeReport } from '@/types/service-income';

afterEach(cleanup);
export const serviceIncomeFixture: ServiceIncomeReport = {
  dateRange: { startDate: '2026-10-31T17:00:00Z', endDate: '2026-11-30T16:59:59.999Z' },
  summary: {
    totalAmount: 180000,
    coachAmount: 135000,
    ballboyAmount: 45000,
    unassignedAmount: 45000,
    invoiceCount: 1,
    sessions: 2,
    clubCount: 1
  },
  clubs: [
    {
      id: 'club-a',
      name: 'Club A',
      coachAmount: 135000,
      ballboyAmount: 0,
      totalAmount: 135000,
      sessions: 1,
      hours: 1
    },
    {
      id: 'unassigned',
      name: 'Tanpa Club',
      coachAmount: 0,
      ballboyAmount: 45000,
      totalAmount: 45000,
      sessions: 1,
      hours: 1
    }
  ],
  staff: [
    {
      id: 'coach-a',
      name: 'Coach Andi',
      service: 'COACH',
      clubName: 'Club A',
      sessions: 1,
      hours: 1,
      amount: 135000
    },
    {
      id: 'ballboy-a',
      name: 'Ballboy Budi',
      service: 'BALLBOY',
      clubName: 'Tanpa Club',
      sessions: 1,
      hours: 1,
      amount: 45000
    }
  ],
  rows: [
    {
      id: 'coach-a',
      invoiceId: 'invoice-a',
      invoiceNumber: 'INV-001',
      bookingId: 'booking-a',
      customerName: 'Customer Anita',
      branchId: 'cemara',
      branchName: 'Cemara',
      paidAt: '2026-11-05T17:30:00Z',
      service: 'COACH',
      staffId: 'coach-a',
      staffName: 'Coach Andi',
      clubId: 'club-a',
      clubName: 'Club A',
      startAt: '2026-11-10 12:00:00',
      endAt: '2026-11-10 13:00:00',
      hours: 1,
      servicePrice: 150000,
      discount: 15000,
      amount: 135000
    },
    {
      id: 'ballboy-a',
      invoiceId: 'invoice-a',
      invoiceNumber: 'INV-001',
      bookingId: 'booking-a',
      customerName: 'Customer Anita',
      branchId: 'cemara',
      branchName: 'Cemara',
      paidAt: '2026-11-05T17:30:00Z',
      service: 'BALLBOY',
      staffId: 'ballboy-a',
      staffName: 'Ballboy Budi',
      clubId: null,
      clubName: 'Tanpa Club',
      startAt: '2026-11-10 12:00:00',
      endAt: '2026-11-10 13:00:00',
      hours: 1,
      servicePrice: 50000,
      discount: 5000,
      amount: 45000
    }
  ],
  options: {
    clubs: [
      { id: 'club-a', name: 'Club A' },
      { id: 'unassigned', name: 'Tanpa Club' }
    ],
    staff: [
      { id: 'coach-a', name: 'Coach Andi' },
      { id: 'ballboy-a', name: 'Ballboy Budi' }
    ]
  }
};

it('shows the income hierarchy, 100% entitlement and the unassigned amount clearly', () => {
  render(<ServiceIncomeSection data={serviceIncomeFixture} isLoading={false} />);
  const summary = screen.getByRole('region', { name: 'Ringkasan hak club' });
  expect(summary).toHaveTextContent(/180.000/);
  expect(summary).toHaveTextContent('100% untuk club');
  expect(summary).toHaveTextContent('1 invoice lunas · 2 sesi jasa');
  expect(screen.getByRole('note', { name: 'Pendapatan tanpa club' })).toHaveTextContent(/45.000/);
  const clubs = screen.getByRole('table', { name: 'Rekap hak per club' });
  expect(within(clubs).getByRole('row', { name: /Club A/ })).toHaveTextContent(/135.000/);
  expect(within(clubs).getByRole('row', { name: /^Total/ })).toHaveTextContent(/180.000/);
});

it('shows payment timestamps in WIB and links service rows to their invoice', () => {
  render(<ServiceIncomeSection data={serviceIncomeFixture} isLoading={false} />);
  const details = screen.getByRole('table', { name: 'Detail transaksi pendapatan jasa' });
  expect(within(details).getAllByRole('link', { name: 'INV-001' })[0]).toHaveAttribute(
    'href',
    '/admin/kelola-transaksi/invoice-a'
  );
  expect(details).toHaveTextContent(/06 Nov 2026.*00[.:]30/);
  expect(details).toHaveTextContent('2026-11-10 12:00');
});

it('searches detail rows and recalculates their footer without changing overall rights', () => {
  render(<ServiceIncomeSection data={serviceIncomeFixture} isLoading={false} />);
  fireEvent.change(screen.getByLabelText('Cari transaksi jasa'), {
    target: { value: 'Ballboy Budi' }
  });
  const details = screen.getByRole('table', { name: 'Detail transaksi pendapatan jasa' });
  expect(within(details).queryByText('Coach Andi')).toBeNull();
  expect(within(details).getByRole('row', { name: /Total hasil pencarian/ })).toHaveTextContent(
    /45.000/
  );
  expect(screen.getByRole('region', { name: 'Ringkasan hak club' })).toHaveTextContent(/180.000/);
});

it('paginates details while the footer includes all matching rows', () => {
  const rows = Array.from({ length: 25 }, (_, i) => ({
    ...serviceIncomeFixture.rows[0],
    id: `row-${i}`,
    invoiceNumber: `INVOICE-${i}`,
    amount: 1000
  }));
  render(<ServiceIncomeSection data={{ ...serviceIncomeFixture, rows }} isLoading={false} />);
  const details = screen.getByRole('table', { name: 'Detail transaksi pendapatan jasa' });
  expect(within(details).queryByText('INVOICE-24')).toBeNull();
  expect(within(details).getByRole('row', { name: /Total hak pendapatan/ })).toHaveTextContent(
    /25.000/
  );
  fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
  expect(within(details).getByText('INVOICE-24')).toBeInTheDocument();
});

it('distinguishes a loading state from an empty period and no search matches', () => {
  const { rerender } = render(<ServiceIncomeSection isLoading />);
  expect(screen.getByRole('status')).toBeInTheDocument();
  rerender(
    <ServiceIncomeSection
      data={{
        ...serviceIncomeFixture,
        summary: {
          ...serviceIncomeFixture.summary,
          totalAmount: 0,
          unassignedAmount: 0,
          sessions: 0
        },
        clubs: [],
        staff: [],
        rows: []
      }}
      isLoading={false}
    />
  );
  expect(
    screen.getByText('Belum ada pembayaran jasa lunas yang sesuai periode dan filter.')
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Cari transaksi jasa'), {
    target: { value: 'tidak ada' }
  });
  expect(screen.getByText('Tidak ada transaksi yang cocok dengan pencarian.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Berikutnya' })).toBeDisabled();
});

it('shows the booked member count alongside the recorded coach income', () => {
  const data = {
    ...serviceIncomeFixture,
    rows: serviceIncomeFixture.rows.map((row, index) => ({
      ...row,
      description: index === 0 ? 'Jumlah member: 2' : null
    }))
  };
  render(<ServiceIncomeSection data={data} isLoading={false} />);
  expect(screen.getByText('Jumlah member: 2')).toBeInTheDocument();
});

it('displays a settled coach with zero amounts and a Lunas badge', () => {
  const row = {
    ...serviceIncomeFixture.rows[0],
    service: 'COACH' as const,
    isClubSettled: true,
    servicePrice: 0,
    amount: 0,
    discount: 0
  };
  const data = { ...serviceIncomeFixture, rows: [row] };
  render(<ServiceIncomeSection data={data} isLoading={false} />);
  const table = screen.getByRole('table', { name: 'Detail transaksi pendapatan jasa' });
  expect(within(table).getByText('Lunas')).toBeInTheDocument();
  expect(within(table).getAllByText(/Rp.*0$/).length).toBeGreaterThanOrEqual(3);
});
