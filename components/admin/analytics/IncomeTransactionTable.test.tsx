import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import IncomeTransactionTable, { type IncomeTransaction } from './IncomeTransactionTable';

afterEach(cleanup);
const transaction = (index: number, source = 'Online'): IncomeTransaction => ({
  id: `invoice-${index}`,
  invoiceNumber: `INV-${index}`,
  customerName: `Customer ${index}`,
  branchName: 'Cemara',
  source,
  paymentMethod: 'QRIS',
  paidAt: '2026-09-30T17:30:00Z',
  amount: 10000,
  processingFee: 100,
  netAmount: 9900
});

it('shows the customer, invoice link, payment date in WIB, and amounts composing revenue', () => {
  render(<IncomeTransactionTable transactions={[transaction(1), transaction(2, 'Cashier')]} />);
  expect(screen.getByRole('link', { name: 'INV-1' })).toHaveAttribute(
    'href',
    '/admin/kelola-transaksi/invoice-1'
  );
  expect(screen.getByRole('link', { name: 'INV-1' })).toHaveAttribute('target', '_blank');
  const row = screen.getByRole('row', { name: /Customer 1 INV-1/ });
  expect(row).toHaveTextContent(/01 Okt 2026.*00[.:]30 WIB/);
  expect(row).toHaveTextContent(/Cemara.*Online Booking.*QRIS/);
  const total = screen.getByRole('row', { name: /Total periode/ });
  expect(total).toHaveTextContent(/2 transaksi.*20\.000.*200.*19\.800/);
});

it('paginates while keeping totals for all matching invoices and resets the page on search', () => {
  render(
    <IncomeTransactionTable
      transactions={Array.from({ length: 25 }, (_, index) => transaction(index + 1))}
    />
  );
  expect(screen.queryByText('Customer 25')).not.toBeInTheDocument();
  expect(screen.getByRole('row', { name: /Total periode/ })).toHaveTextContent(
    /25 transaksi.*250\.000.*2\.500.*247\.500/
  );
  fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
  expect(screen.getByText('Customer 25')).toBeInTheDocument();
  expect(screen.queryByText('Customer 1')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Cari transaksi customer'), {
    target: { value: 'INV-1 ' }
  });
  expect(screen.getByText('Customer 1')).toBeInTheDocument();
  expect(screen.getByText(/Halaman 1/)).toBeInTheDocument();
});

it('filters by source and recalculates the filtered total', () => {
  HTMLElement.prototype.scrollIntoView = () => {};
  render(<IncomeTransactionTable transactions={[transaction(1), transaction(2, 'Membership')]} />);
  fireEvent.keyDown(screen.getByLabelText('Sumber transaksi'), { key: 'Enter' });
  fireEvent.click(screen.getByRole('option', { name: 'Membership' }));
  const table = screen.getByRole('table', { name: 'Transaksi customer pembentuk revenue' });
  expect(within(table).queryByText('Customer 1')).not.toBeInTheDocument();
  expect(within(table).getByText('Customer 2')).toBeInTheDocument();
  expect(screen.getByRole('row', { name: /Total hasil filter/ })).toHaveTextContent(
    /1 transaksi.*10\.000.*100.*9\.900/
  );
});

it('shows an explicit empty state for search results', () => {
  render(<IncomeTransactionTable transactions={[transaction(1)]} />);
  fireEvent.change(screen.getByLabelText('Cari transaksi customer'), {
    target: { value: 'not-found' }
  });
  expect(screen.getByText('Tidak ada transaksi yang sesuai filter.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Berikutnya' })).toBeDisabled();
});

it('distinguishes an empty paid period from unavailable transaction details', () => {
  const { rerender } = render(<IncomeTransactionTable transactions={[]} />);
  expect(screen.getByText('Tidak ada transaksi lunas pada periode ini.')).toBeInTheDocument();
  rerender(<IncomeTransactionTable />);
  expect(
    screen.getByText('Rincian transaksi belum tersedia untuk periode ini.')
  ).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

it('groups linked court, coach and ballboy invoices while keeping another booking separate', () => {
  const rows = [
    {
      ...transaction(1),
      bookingId: 'court-1',
      customerName: 'ELVI',
      amount: 300000,
      processingFee: 1000,
      netAmount: 299000
    },
    {
      ...transaction(2),
      bookingId: 'court-1',
      customerName: 'ELVI',
      amount: 50000,
      processingFee: 0,
      netAmount: 50000
    },
    {
      ...transaction(3),
      bookingId: 'court-1',
      customerName: 'ELVI',
      amount: 0,
      processingFee: 0,
      netAmount: 0
    },
    { ...transaction(4), bookingId: 'court-2', customerName: 'ELVI' }
  ];
  render(<IncomeTransactionTable transactions={rows} groupByBooking />);
  expect(screen.getAllByRole('row', { name: /ELVI/ })).toHaveLength(2);
  expect(screen.getByText('3 invoice · Lihat rincian')).toBeInTheDocument();
  const group = screen.getAllByRole('row', { name: /ELVI/ })[0];
  expect(group).toHaveTextContent(/350\.000.*1\.000.*349\.000/);
  fireEvent.click(screen.getByText('3 invoice · Lihat rincian'));
  const link = screen.getByRole('link', { name: 'INV-2' });
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  fireEvent.change(screen.getByLabelText('Cari transaksi customer'), {
    target: { value: 'INV-2' }
  });
  expect(screen.getByRole('row', { name: /Total hasil filter/ })).toHaveTextContent(
    /1 transaksi.*350\.000.*1\.000.*349\.000/
  );
});

it('shows playing schedules and service cards without revenue or payment timestamps in the details', () => {
  const schedule = { startAt: '2026-11-03T09:00:00+07:00', endAt: '2026-11-03T11:00:00+07:00' };
  render(
    <IncomeTransactionTable
      groupByBooking
      transactions={[
        {
          ...transaction(1),
          bookingId: 'court',
          playingSchedules: [{ ...schedule, label: 'Lapangan · Court A' }]
        },
        {
          ...transaction(2),
          bookingId: 'court',
          playingSchedules: [{ ...schedule, label: 'Coach' }]
        },
        {
          ...transaction(3),
          bookingId: 'court',
          playingSchedules: [
            {
              ...schedule,
              label: 'Ballboy',
              startAt: '2026-11-03T23:00:00+07:00',
              endAt: '2026-11-04T00:00:00+07:00'
            }
          ]
        }
      ]}
    />
  );
  expect(screen.getByRole('columnheader', { name: 'Dibayar (WIB)' })).toBeInTheDocument();
  expect(screen.getByText(/00[.:]30 WIB/)).toBeInTheDocument();
  expect(screen.queryByText(/09[.:]00–11[.:]00 WIB/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '3 invoice · Lihat rincian' }));
  const details = screen.getByRole('list', { name: 'Rincian invoice booking' });
  expect(within(details).getByRole('heading', { name: 'Lapangan · Court A' })).toBeInTheDocument();
  expect(within(details).getByRole('heading', { name: 'Coach' })).toBeInTheDocument();
  expect(within(details).getByRole('heading', { name: 'Ballboy' })).toBeInTheDocument();
  expect(details).not.toHaveTextContent(/revenue/i);
  expect(details).not.toHaveTextContent(/01 Okt 2026/);
  expect(details).toHaveTextContent(/03 Nov 2026/);
  expect(details).toHaveTextContent(/09[.:]00–11[.:]00 WIB/);
  expect(details).toHaveTextContent(/23[.:]00–04 Nov 2026, 00[.:]00 WIB/);
  expect(within(details).getAllByText('Nominal invoice')).toHaveLength(3);
  expect(within(details).getByRole('link', { name: 'INV-2' })).toHaveAttribute('target', '_blank');
  fireEvent.click(screen.getByRole('button', { name: '3 invoice · Tutup rincian' }));
  expect(screen.queryByRole('list', { name: 'Rincian invoice booking' })).not.toBeInTheDocument();
});

it('shows payment time in the main row even when playing schedules are unavailable', () => {
  render(<IncomeTransactionTable groupByBooking transactions={[transaction(1)]} />);
  expect(screen.queryByText('Jadwal bermain belum tersedia')).not.toBeInTheDocument();
  expect(screen.getByText(/01 Okt 2026.*00[.:]30 WIB/)).toBeInTheDocument();
});

it('uses the latest payment for a grouped booking regardless of invoice order', () => {
  render(
    <IncomeTransactionTable
      groupByBooking
      transactions={[
        { ...transaction(1), bookingId: 'court', paidAt: '2026-11-03T09:41:00Z' },
        { ...transaction(2), bookingId: 'court', paidAt: '2026-11-03T09:42:00Z' }
      ]}
    />
  );
  expect(screen.getByText(/03 Nov 2026.*16[.:]42 WIB/)).toBeInTheDocument();
  expect(screen.getByText('Pembayaran terakhir')).toBeInTheDocument();
});

it('marks a cancelled service alongside its recorded paid amount', () => {
  render(
    <IncomeTransactionTable
      transactions={[
        {
          ...transaction(1),
          amount: 45000,
          netAmount: 45000,
          processingFee: 0,
          cancellationStatus: 'CANCELLED',
          paymentStatus: 'PAID',
          cancelledServices: [
            {
              kind: 'BALLBOY',
              name: 'Topan',
              amount: 45000,
              cancelledAt: '2026-11-08T11:44:00Z',
              reason: 'Customer membatalkan'
            }
          ]
        }
      ]}
    />
  );
  const row = screen.getByRole('row', { name: /Customer 1/ });
  expect(row).toHaveTextContent('Dibatalkan');
  expect(row).toHaveTextContent('Invoice masih tercatat lunas.');
  expect(row).toHaveTextContent('Ballboy · Topan');
  expect(row).toHaveTextContent('Customer membatalkan');
  expect(screen.getByRole('row', { name: /Total periode/ })).toHaveTextContent('45.000');
});
it('shows partial cancellation when a grouped booking contains an active and a cancelled invoice', () => {
  render(
    <IncomeTransactionTable
      groupByBooking
      transactions={[
        { ...transaction(1), bookingId: 'shared', cancellationStatus: 'NONE' },
        { ...transaction(2), bookingId: 'shared', cancellationStatus: 'CANCELLED' }
      ]}
    />
  );
  expect(screen.getByText('Sebagian dibatalkan')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /2 invoice/ }));
  expect(screen.getByText('Dibatalkan')).toBeInTheDocument();
});
