import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import BookingBallboySelection from './BookingBallboySelection';
import type { BookingItem, SelectedBallboy } from '@/stores/useBookingStore';
const mocks = vi.hoisted(() => ({ people: vi.fn(), availability: vi.fn(), select: vi.fn() }));
vi.mock('@/hooks/useAdminCourtSports', () => ({
  useAdminCourtSports: () => ({ branchId: 'cemara' })
}));
vi.mock('@/api/admin/coaching', () => ({ coachingApi: { list: mocks.people } }));
vi.mock('@/lib/adminApi', () => ({ adminApi: { get: mocks.availability } }));
const session: BookingItem = {
  slotId: 'court-slot',
  courtId: 'court',
  courtName: 'Court 1',
  sport: 'PADEL',
  date: '2040-01-02',
  timeSlot: '12:00 - 13:00',
  endTime: '13:00',
  startAt: '2040-01-02T12:00:00Z',
  endAt: '2040-01-02T13:00:00Z',
  price: 150000
};
const people = [
  { id: 'padel', name: 'Padel Staff', role: 'BALLBOY', coachType: 'PADEL', isActive: true },
  { id: 'tennis', name: 'Tennis Staff', role: 'BALLBOY', coachType: 'TENNIS', isActive: true },
  { id: 'both', name: 'Dual Staff', role: 'BALLBOY', coachType: 'PADEL_TENNIS', isActive: true },
  { id: 'legacy', name: 'Legacy Tennis', role: 'BALLBOY', coachType: null, isActive: true },
  { id: 'closed', name: 'Inactive Staff', role: 'BALLBOY', coachType: 'PADEL', isActive: false }
];
function Harness({ sport, sessions }: { sport: 'PADEL' | 'TENNIS'; sessions: BookingItem[] }) {
  const [selected, setSelected] = useState<SelectedBallboy[]>([]);
  return (
    <BookingBallboySelection
      sessions={sessions}
      sport={sport}
      selected={selected}
      onSelect={(booking, item) => {
        mocks.select(item);
        setSelected((current) => [
          ...current.filter((old) => old.courtSlotId !== booking.slotId),
          ...(item ? [item] : [])
        ]);
      }}
    />
  );
}
function mount(sport: 'PADEL' | 'TENNIS' = 'PADEL', sessions = [session]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Harness sport={sport} sessions={sessions} />
    </QueryClientProvider>
  );
  return client;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.people.mockResolvedValue(people);
  mocks.availability.mockResolvedValue({
    data: {
      data: people.map((person) => ({
        slotId: `slot-${person.id}`,
        ballboy: { id: person.id },
        startAt: '2040-01-02 12:00:00',
        endAt: '2040-01-02 13:00:00',
        price: 45000
      }))
    }
  });
});
afterEach(cleanup);
it.each(['PADEL', 'TENNIS'] as const)(
  'shows only %s-compatible ballboys and saves the selected court assignment',
  async (sport) => {
    const client = mount(sport);
    const name = sport === 'PADEL' ? 'Padel Staff' : 'Tennis Staff';
    const wrong = sport === 'PADEL' ? 'Tennis Staff' : 'Padel Staff';
    const button = await screen.findByRole('button', {
      name: `Pilih ballboy ${name} untuk Court 1 12:00 - 13:00`
    });
    await waitFor(() => expect(button).toBeEnabled());
    expect(
      screen.queryByRole('button', { name: new RegExp(`Pilih ballboy ${wrong}`) })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pilih ballboy Dual Staff/ })).toBeEnabled();
    if (sport === 'PADEL')
      expect(screen.queryByRole('button', { name: /Legacy Tennis/ })).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(mocks.select).toHaveBeenCalledWith(
      expect.objectContaining({ courtSlotId: 'court-slot', courtSport: sport, price: 45000 })
    );
    client.clear();
  }
);
it('prevents assigning the same ballboy to two courts at the same time', async () => {
  const client = mount('PADEL', [
    session,
    { ...session, slotId: 'court-slot-2', courtId: 'court-2', courtName: 'Court 2' }
  ]);
  const first = await screen.findByRole('button', {
    name: /Pilih ballboy Padel Staff untuk Court 1/
  });
  await waitFor(() => expect(first).toBeEnabled());
  fireEvent.click(first);
  expect(
    screen.getByRole('button', { name: /Pilih ballboy Padel Staff untuk Court 2/ })
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: /Pilih ballboy Inactive Staff untuk Court 1/ })
  ).toBeDisabled();
  client.clear();
});
