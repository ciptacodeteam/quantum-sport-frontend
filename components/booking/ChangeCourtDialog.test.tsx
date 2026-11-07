import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ChangeCourtDialog from './ChangeCourtDialog';
const mocks = vi.hoisted(() => ({ options: vi.fn(), change: vi.fn(), close: vi.fn() }));
vi.mock('@/api/court-change', () => ({
  getCourtChangeOptionsApi: mocks.options,
  changeCourtApi: mocks.change
}));
const booking = {
  detailId: 'detail',
  slotId: 'old',
  courtId: 'a',
  courtName: 'Court A',
  startAt: '2030-01-02 10:00:00',
  endAt: '2030-01-02 11:00:00'
};
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ChangeCourtDialog booking={booking} branchId="cemara" userId="me" onClose={mocks.close} />
    </QueryClientProvider>
  );
  return client;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.options.mockResolvedValue([{ slotId: 'new', courtId: 'b', courtName: 'Court B' }]);
  mocks.change.mockResolvedValue({ slotId: 'new' });
});
afterEach(cleanup);
it('requires choosing and confirming a court while retaining the original time', async () => {
  const client = mount();
  expect(screen.getByRole('button', { name: 'Konfirmasi pindah' })).toBeDisabled();
  expect(screen.getByText(/10:00–11:00 WIB/)).toBeInTheDocument();
  fireEvent.click(await screen.findByRole('radio', { name: 'Court B' }));
  expect(mocks.change).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi pindah' }));
  await waitFor(() => expect(mocks.change).toHaveBeenCalledWith('detail', 'old', 'new'));
  await waitFor(() => expect(mocks.close).toHaveBeenCalled());
  client.clear();
});
it('keeps the original booking and reports a concurrent booking conflict', async () => {
  mocks.change.mockRejectedValue({ message: 'Lapangan baru saja dipesan.' });
  const client = mount();
  fireEvent.click(await screen.findByRole('radio', { name: 'Court B' }));
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi pindah' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Lapangan baru saja dipesan');
  expect(mocks.close).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Konfirmasi pindah' })).toBeDisabled();
  client.clear();
});
it('blocks a second submission and closing while the move is pending', async () => {
  mocks.change.mockReturnValue(new Promise(() => {}));
  const client = mount();
  fireEvent.click(await screen.findByRole('radio', { name: 'Court B' }));
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi pindah' }));
  expect(await screen.findByRole('button', { name: 'Memindahkan...' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Batal' })).toBeDisabled();
  expect(screen.getByRole('radio', { name: 'Court B' })).toBeDisabled();
  client.clear();
});
it('does not permit moving when no eligible court is empty', async () => {
  mocks.options.mockResolvedValue([]);
  const client = mount();
  expect(await screen.findByRole('status')).toHaveTextContent('Memuat lapangan kosong');
  expect(
    await screen.findByText('Tidak ada lapangan kosong dengan jam dan tarif yang sama.')
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Konfirmasi pindah' })).toBeDisabled();
  client.clear();
});
it('does not permit moving when the options request fails', async () => {
  mocks.options.mockRejectedValue(new Error('offline'));
  const client = mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('offline');
  expect(screen.getByRole('button', { name: 'Konfirmasi pindah' })).toBeDisabled();
  client.clear();
});
