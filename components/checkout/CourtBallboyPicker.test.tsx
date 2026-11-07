import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CourtBallboyPicker from './CourtBallboyPicker';
import type { BookingItem } from '@/stores/useBookingStore';
const mocks = vi.hoisted(() => ({ availability: vi.fn(), save: vi.fn(), cancel: vi.fn() }));
vi.mock('@/api/ballboy', () => ({ getBallboyAvailabilityApi: mocks.availability }));
const court = (id: string): BookingItem => ({
  slotId: id,
  courtId: id,
  courtName: id,
  date: '2030-10-23',
  timeSlot: '08:00',
  endTime: '09:00',
  startAt: '2030-10-23T08:00:00Z',
  endAt: '2030-10-23T09:00:00Z',
  sport: 'TENNIS',
  price: 200000
});
const ballboy = (name: string) => ({
  slotId: `slot-${name}`,
  ballboy: { id: name, name },
  startAt: '2030-10-23 08:00:00',
  endAt: '2030-10-23 09:00:00',
  price: 45000
});
function mount(sessions = [court('Court 1')]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <CourtBallboyPicker
        sessions={sessions}
        branchId="cemara"
        selected={[]}
        onSave={mocks.save}
        onCancel={mocks.cancel}
      />
    </QueryClientProvider>
  );
  return client;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2030-10-22T00:00:00Z'));
  mocks.availability.mockResolvedValue({ data: [ballboy('Budi'), ballboy('Andi')] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('links each ballboy to its court and blocks the same person on another court at the same time', async () => {
  const client = mount([court('Court 1'), court('Court 2')]);
  fireEvent.click(await screen.findByRole('button', { name: 'Pilih Budi untuk Court 1 08:00' }));
  expect(screen.getByRole('button', { name: 'Pilih Budi untuk Court 2 08:00' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Andi untuk Court 2 08:00' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Simpan add-ons' })).toBeEnabled());
  expect(screen.getByText('Rp90.000')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Simpan add-ons' }));
  expect(mocks.save).toHaveBeenCalledWith([
    expect.objectContaining({
      ballboyName: 'Budi',
      slotId: 'slot-Budi',
      courtSlotId: 'Court 1',
      courtName: 'Court 1'
    }),
    expect.objectContaining({
      ballboyName: 'Andi',
      slotId: 'slot-Andi',
      courtSlotId: 'Court 2',
      courtName: 'Court 2'
    })
  ]);
  expect(mocks.availability).toHaveBeenCalledWith({
    startAt: '2030-10-23T08:00:00',
    endAt: '2030-10-23T09:00:00',
    courtSport: 'TENNIS'
  });
  client.clear();
});
it('blocks stale selections after refresh and lets the customer remove the unavailable ballboy', async () => {
  const client = mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Pilih Budi untuk Court 1 08:00' }));
  await act(async () => {
    await client.cancelQueries();
    client.setQueriesData({ queryKey: ['ballboy', 'availability'] }, []);
  });
  expect(await screen.findByRole('alert')).toHaveTextContent('sudah tidak tersedia');
  expect(screen.getByRole('button', { name: 'Simpan add-ons' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Tanpa ballboy' }));
  fireEvent.click(screen.getByRole('button', { name: 'Simpan add-ons' }));
  expect(mocks.save).toHaveBeenCalledWith([]);
  client.clear();
});
it('does not offer a ballboy whose available hour differs from the court booking', async () => {
  mocks.availability.mockResolvedValue({
    data: [{ ...ballboy('Budi'), startAt: '2030-10-23 09:00:00', endAt: '2030-10-23 10:00:00' }]
  });
  const client = mount();
  expect(await screen.findByText('Tidak ada ballboy tersedia untuk jam ini.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Pilih Budi/ })).toBeNull();
  client.clear();
});

it('blocks double booking the same person even when the API has different overlapping slot IDs', async () => {
  mocks.availability.mockResolvedValueOnce({ data: [ballboy('Budi')] });
  mocks.availability.mockResolvedValueOnce({
    data: [{ ...ballboy('Budi'), slotId: 'another-schedule-row' }]
  });
  const client = mount([court('Court 1'), court('Court 2')]);
  fireEvent.click(await screen.findByRole('button', { name: 'Pilih Budi untuk Court 1 08:00' }));
  expect(
    await screen.findByRole('button', { name: 'Pilih Budi untuk Court 2 08:00' })
  ).toBeDisabled();
  client.clear();
});
