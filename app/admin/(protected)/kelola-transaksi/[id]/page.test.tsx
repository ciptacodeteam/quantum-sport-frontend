import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  invoice: undefined as any,
  pending: false,
  error: false,
  refetch: vi.fn()
}));
vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'invoice-1' }) }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: mocks.invoice,
    isPending: mocks.pending,
    isError: mocks.error,
    refetch: mocks.refetch
  })
}));
vi.mock('@/queries/admin/invoice', () => ({ adminInvoiceQueryOptions: () => ({}) }));
import InvoiceDetailPage from './page';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.pending = false;
  mocks.error = false;
  const slot = {
    id: 'slot',
    startAt: '2026-11-01T14:00:00.000Z',
    endAt: '2026-11-01T15:00:00.000Z'
  };
  mocks.invoice = {
    id: 'invoice-1',
    number: 'INV-261101-TEST',
    type: 'BOOKING',
    status: 'PAID',
    issuedAt: '2026-11-01T06:46:00Z',
    dueDate: '2026-11-01T06:51:00Z',
    paidAt: '2026-11-01T06:46:00Z',
    user: { name: 'Erica', phone: '+628111111111', email: 'erica@example.test' },
    subtotal: 250000,
    processingFee: 0,
    total: 250000,
    booking: {
      status: 'CONFIRMED',
      totalPrice: 250000,
      courtDiscountPrice: 250000,
      courts: [{ court: { name: 'Court 1 Tennis' }, slot, price: 250000, discountPrice: 250000 }],
      coaches: [
        { staff: { name: 'Coach A' }, coachType: { name: 'Private' }, slot, price: 100000 }
      ],
      ballboys: [{ staff: { name: 'Ballboy A' }, slot, price: 50000 }],
      inventories: []
    }
  };
});
afterEach(cleanup);

it.each([
  ['2026-11-01T14:00:00.000Z', '2026-11-01T15:00:00.000Z'],
  ['2026-11-01 14:00:00', '2026-11-01 15:00:00']
])('matches schedule wall times for API slots %s', (startAt, endAt) => {
  for (const section of ['courts', 'coaches', 'ballboys'])
    mocks.invoice.booking[section][0].slot = { startAt, endAt };
  render(<InvoiceDetailPage />);
  const table = screen.getByRole('table', { name: 'Jadwal lapangan dan layanan' });
  for (const [kind, name] of [
    ['Lapangan', 'Court 1 Tennis'],
    ['Coach', 'Coach A'],
    ['Ballboy', 'Ballboy A']
  ]) {
    const row = within(table).getByRole('row', { name: new RegExp(`^${kind} ${name}`) });
    expect(row).toHaveTextContent('14:00–15:00');
    expect(row).toHaveTextContent('01 Nov 2026');
    expect(row).not.toHaveTextContent('21:00');
  }
  expect(within(table).getByRole('columnheader', { name: 'Jam (WIB)' })).toBeInTheDocument();
  expect(screen.getByText('Diterbitkan').parentElement).toHaveTextContent(
    '01 Nov 2026 · 13:46 WIB'
  );
  expect(screen.getByText('Dibayar').parentElement).toHaveTextContent('01 Nov 2026 · 13:46 WIB');
  expect(screen.getByText('Jatuh tempo').parentElement).toHaveTextContent(
    '01 Nov 2026 · 13:51 WIB'
  );
});

it('shows both playing dates for a slot crossing midnight', () => {
  mocks.invoice.booking.courts[0].slot = {
    startAt: '2026-10-31T23:00:00Z',
    endAt: '2026-11-01T00:00:00Z'
  };
  render(<InvoiceDetailPage />);
  const table = screen.getByRole('table', { name: 'Jadwal lapangan dan layanan' });
  const row = within(table).getByRole('row', { name: /^Lapangan Court 1 Tennis/ });
  expect(row).toHaveTextContent('31 Okt 2026');
  expect(row).toHaveTextContent('s.d. 01 Nov 2026');
  expect(row).toHaveTextContent('23:00–00:00');
});

it('does not replace missing timestamps with the current time', () => {
  mocks.invoice.issuedAt = null;
  mocks.invoice.dueDate = null;
  mocks.invoice.paidAt = null;
  render(<InvoiceDetailPage />);
  for (const label of ['Diterbitkan', 'Jatuh tempo', 'Dibayar'])
    expect(screen.getByText(label).parentElement).toHaveTextContent('—');
});

it('shows zero court payment for a value-pack booking and reads the nested package name', () => {
  mocks.invoice.booking.membershipUserId = 'wallet';
  mocks.invoice.booking.courts[0].discountPrice = 0;
  mocks.invoice.membership = {
    membership: { name: 'Happy Hour Pack', duration: 30, sessions: 10 }
  };
  render(<InvoiceDetailPage />);
  const table = screen.getByRole('table', { name: 'Jadwal lapangan dan layanan' });
  const row = within(table).getByRole('row', { name: /^Lapangan Court 1 Tennis/ });
  expect(row).toHaveTextContent(/Rp\s*0/);
  expect(row).not.toHaveTextContent('250.000');
  expect(within(row).getByText('Menggunakan Value Pack')).toBeInTheDocument();
  expect(screen.getByText('Happy Hour Pack')).toBeInTheDocument();
});

it('offers retry for API errors', () => {
  mocks.error = true;
  render(<InvoiceDetailPage />);
  expect(screen.getByRole('alert')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
  expect(mocks.refetch).toHaveBeenCalled();
});

it('presents courts and services in one aligned table with the booking total below', () => {
  mocks.invoice.booking.coaches[0].coachType.name = 'Default';
  mocks.invoice.booking.coaches[0].price = 0;
  mocks.invoice.booking.courts[0].discountPrice = 150000;
  mocks.invoice.booking.totalPrice = 200000;
  render(<InvoiceDetailPage />);
  const section = screen.getByRole('region', { name: 'Jadwal booking' });
  expect(within(section).getAllByRole('table')).toHaveLength(1);
  expect(
    within(section)
      .getAllByRole('columnheader')
      .map((header) => header.textContent)
  ).toEqual(['Jenis', 'Lapangan / layanan', 'Tanggal main', 'Jam (WIB)', 'Harga']);
  const table = within(section).getByRole('table');
  const court = within(table).getByRole('row', { name: /^Lapangan Court 1 Tennis/ });
  expect(court).toHaveTextContent(/250\.000.*150\.000/);
  expect(within(table).getByRole('row', { name: /Coach A/ })).toHaveTextContent(/Rp\s*0/);
  expect(within(section).queryByText('Default')).toBeNull();
  expect(within(section).getByText('Total nilai booking').closest('footer')).toHaveTextContent(
    /200\.000/
  );
  expect(section.querySelector('[data-slot="card"]')).toBeNull();
});
