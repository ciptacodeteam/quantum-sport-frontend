import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import IncomeBySourceSection from './IncomeBySourceSection';

afterEach(cleanup);
const report = () => ({
  summary: {
    totalIncome: 4124000,
    totalGrossAmount: 4136075,
    totalProcessingFees: 12075,
    totalNetAmount: 4124000,
    totalTransactions: 36,
    onlineBookingIncome: 1509000,
    cashierBookingIncome: 2615000,
    membershipIncome: 0,
    classBookingIncome: 0
  },
  bySource: {
    Online: { count: 5, total: 1509000, processingFee: 12075 },
    Cashier: { count: 31, total: 2615000, processingFee: 0 }
  } as Record<string, { count: number; total: number; processingFee: number }>,
  dateRange: { startDate: '2026-09-30T17:00:00.000Z', endDate: '2026-10-01T16:59:59.999Z' }
});

it('removes the class card and reconciles gross payments, fees and net revenue per source', () => {
  render(<IncomeBySourceSection data={report()} isLoading={false} />);
  expect(screen.getAllByRole('article').map((card) => card.getAttribute('aria-label'))).toEqual([
    'Online Booking',
    'Cashier Booking',
    'Membership'
  ]);
  expect(screen.queryByText('Class Bookings')).not.toBeInTheDocument();
  const calculation = screen.getByLabelText('Perhitungan total revenue');
  expect(calculation).toHaveTextContent(/4\.136\.075.*−.*12\.075.*=.*4\.124\.000/);
  const table = screen.getByRole('table', { name: 'Rincian revenue per sumber' });
  const online = within(table).getByRole('row', { name: /Online Booking/ });
  expect(online).toHaveTextContent(/1\.521\.075/);
  expect(online).toHaveTextContent(/12\.075/);
  expect(online).toHaveTextContent(/1\.509\.000/);
  const cashier = within(table).getByRole('row', { name: /Cashier Booking/ });
  expect(cashier).toHaveTextContent(/31.*2\.615\.000/);
  expect(screen.getByRole('region', { name: 'Ringkasan revenue' })).toHaveTextContent(
    '36 transaksi lunas'
  );
  expect(screen.getByText(/01 Okt 2026.*01 Okt 2026 WIB/)).toBeInTheDocument();
});

it('keeps actual class income in the reconciliation table without restoring a class card', () => {
  const data = report();
  data.summary.totalNetAmount += 100000;
  data.summary.totalIncome += 100000;
  data.summary.totalGrossAmount += 105000;
  data.summary.totalProcessingFees += 5000;
  data.summary.totalTransactions++;
  data.bySource['Class Bookings'] = { count: 1, total: 100000, processingFee: 5000 };
  render(<IncomeBySourceSection data={data} isLoading={false} />);
  expect(screen.getAllByRole('article')).toHaveLength(3);
  const row = screen.getByRole('row', { name: /Transaksi kelas/ });
  expect(row).toHaveTextContent(/105\.000.*5\.000.*100\.000/);
  expect(screen.queryByRole('row', { name: /Belum terkelompok/ })).not.toBeInTheDocument();
});

it('makes uncategorized paid revenue visible so the table still reconciles to the total', () => {
  const data = report();
  data.summary.totalNetAmount += 50000;
  data.summary.totalGrossAmount += 50000;
  data.summary.totalTransactions++;
  render(<IncomeBySourceSection data={data} isLoading={false} />);
  expect(screen.getByRole('row', { name: /Belum terkelompok/ })).toHaveTextContent(/50\.000/);
});

it('does not invent per-source processing fees when the detailed data is missing', () => {
  const data = report();
  delete data.bySource.Online;
  render(<IncomeBySourceSection data={data} isLoading={false} />);
  const table = screen.getByRole('table', { name: 'Rincian revenue per sumber' });
  const cells = within(within(table).getByRole('row', { name: /Online Booking/ })).getAllByRole(
    'cell'
  );
  expect(cells[1]).toHaveTextContent('—');
  expect(cells[2]).toHaveTextContent('—');
  expect(cells[3]).toHaveTextContent(/1\.509\.000/);
});

it('renders a successful empty period without invalid numeric values', () => {
  render(<IncomeBySourceSection data={{ summary: {}, bySource: {} }} isLoading={false} />);
  expect(screen.getByRole('region', { name: 'Ringkasan revenue' })).not.toHaveTextContent(
    /NaN|Infinity/
  );
  expect(screen.getByRole('table', { name: 'Rincian revenue per sumber' })).not.toHaveTextContent(
    /NaN|Infinity/
  );
});
