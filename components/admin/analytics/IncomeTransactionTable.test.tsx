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
