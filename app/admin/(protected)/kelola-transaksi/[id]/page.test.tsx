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
  for (const title of ['lapangan', 'coach', 'ballboy']) {
    const table = screen.getByRole('table', { name: `Jadwal ${title}` });
    expect(within(table).getByText('14:00–15:00 WIB')).toBeInTheDocument();
    expect(within(table).getByText('01 Nov 2026')).toBeInTheDocument();
    expect(table).not.toHaveTextContent('21:00');
  }
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
  const table = screen.getByRole('table', { name: 'Jadwal lapangan' });
  expect(table).toHaveTextContent('31 Okt 2026 – 01 Nov 2026');
  expect(table).toHaveTextContent('23:00–00:00 WIB');
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
  const table = screen.getByRole('table', { name: 'Jadwal lapangan' });
  expect(table).toHaveTextContent(/Rp\s*0/);
  expect(table).not.toHaveTextContent('250.000');
  expect(within(table).getByText('Menggunakan Value Pack')).toBeInTheDocument();
  expect(screen.getByText('Happy Hour Pack')).toBeInTheDocument();
});

it('offers retry for API errors', () => {
  mocks.error = true;
  render(<InvoiceDetailPage />);
  expect(screen.getByRole('alert')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
  expect(mocks.refetch).toHaveBeenCalled();
});
