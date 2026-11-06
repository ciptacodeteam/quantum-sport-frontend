import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CoachBallboyIncomePage from './page';

const mocks = vi.hoisted(() => ({ get: vi.fn(), export: vi.fn() }));
vi.mock('@/api/admin/analytics', () => ({
  getServiceIncomeApi: mocks.get,
  exportServiceIncomeApi: mocks.export
}));
vi.mock('@/components/admin/analytics/ServiceIncomeSection', () => ({
  default: ({ data, isLoading }: any) => (
    <p>{isLoading ? 'Memuat laporan' : `Hak ${data?.summary.totalAmount}`}</p>
  )
}));
vi.mock('@/components/ui/date-range-input', () => ({
  default: ({ onValueChange }: any) => (
    <button
      onClick={() => onValueChange({ from: new Date(2026, 10, 6), to: new Date(2026, 10, 6) })}
    >
      Pilih 6 November
    </button>
  )
}));
const data = {
  summary: { totalAmount: 150000 },
  options: {
    clubs: [
      { id: 'club-a', name: 'Club A' },
      { id: 'unassigned', name: 'Tanpa Club' }
    ],
    staff: [{ id: 'staff-a', name: 'Coach Andi' }]
  }
};
const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <CoachBallboyIncomePage />
    </QueryClientProvider>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockResolvedValue(data);
  mocks.export.mockResolvedValue(new Blob(['xlsx']));
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.restoreAllMocks();
});
async function select(label: string, value: string) {
  fireEvent.keyDown(screen.getByRole('combobox', { name: label }), { key: 'Enter' });
  fireEvent.click(await screen.findByRole('option', { name: value }));
}
it('uses exact WIB payment-day boundaries when changing the period', async () => {
  mount();
  await screen.findByText('Hak 150000');
  fireEvent.click(screen.getByRole('button', { name: 'Pilih 6 November' }));
  await waitFor(() =>
    expect(mocks.get).toHaveBeenLastCalledWith(
      '2026-11-05T17:00:00.000Z',
      '2026-11-06T16:59:59.999Z',
      {}
    )
  );
});
it('applies service, club and staff filters to the report and Excel export', async () => {
  mount();
  await screen.findByText('Hak 150000');
  await select('Jenis jasa', 'Coach');
  await select('Club / Grup Coaching', 'Club A');
  await select('Coach / Ballboy', 'Coach Andi');
  await waitFor(() =>
    expect(mocks.get.mock.lastCall?.[2]).toEqual({
      service: 'COACH',
      clubId: 'club-a',
      staffId: 'staff-a'
    })
  );
  const create = vi.fn(() => 'blob:report'),
    revoke = vi.fn();
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: create });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  await waitFor(() => expect(screen.getByRole('button', { name: 'Export Excel' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Export Excel' }));
  await waitFor(() => expect(mocks.export).toHaveBeenCalledWith(...mocks.get.mock.lastCall!));
  expect(revoke).toHaveBeenCalledWith('blob:report');
});
it('offers Tanpa Club and resets filters when changing the date range', async () => {
  mount();
  await screen.findByText('Hak 150000');
  await select('Club / Grup Coaching', 'Tanpa Club');
  await waitFor(() => expect(mocks.get.mock.lastCall?.[2]).toEqual({ clubId: 'unassigned' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pilih 6 November' }));
  await waitFor(() => expect(mocks.get.mock.lastCall?.[2]).toEqual({}));
});

it('retains filter labels while hiding the previous totals during a new request', async () => {
  mount();
  await screen.findByText('Hak 150000');
  mocks.get.mockReturnValue(new Promise(() => {}));
  await select('Club / Grup Coaching', 'Club A');
  await screen.findByText('Memuat laporan');
  expect(screen.queryByText('Hak 150000')).toBeNull();
  expect(screen.getByRole('combobox', { name: 'Club / Grup Coaching' })).toHaveTextContent(
    'Club A'
  );
  expect(screen.getByRole('button', { name: 'Export Excel' })).toBeDisabled();
});
it('shows an actionable error state and allows retry without displaying false zero income', async () => {
  mocks.get.mockRejectedValueOnce({ message: 'Koneksi terputus' });
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('Koneksi terputus');
  expect(screen.queryByText('Hak 0')).toBeNull();
  expect(screen.getByRole('button', { name: 'Export Excel' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
  await screen.findByText('Hak 150000');
});
