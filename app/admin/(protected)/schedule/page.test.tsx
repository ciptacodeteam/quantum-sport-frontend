import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import SchedulePage from './page';
import { DialogProvider } from '@/components/ui/dialog-context';

const mocks = vi.hoisted(() => ({ slots: vi.fn(), schedule: vi.fn(), description: vi.fn() }));
vi.mock('@/hooks/useRoleAccess', () => ({ useHasRole: () => true, useIsSuperAdmin: () => false }));
vi.mock('@/hooks/useAdminCourtSports', () => ({
  useAdminCourtSports: () => ({ branchId: 'cemara', canCreateTennis: true })
}));
vi.mock('@/api/admin/court', () => ({
  getCourtsApi: async () => ({ data: [{ id: 'court', name: 'Padel 1', sport: 'PADEL' }] }),
  getCourtsSlotsApi: mocks.slots
}));
vi.mock('@/api/admin/booking', () => ({
  getScheduleApi: mocks.schedule,
  updateBookingDescriptionApi: mocks.description,
  cancelBookingApi: vi.fn()
}));

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <DialogProvider>
        <SchedulePage />
      </DialogProvider>
    </QueryClientProvider>
  );
  return client;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.schedule.mockResolvedValue({ data: [] });
});
afterEach(cleanup);
it.each(['Catatan awal', null])(
  'updates the description from a schedule booking with initial note %j',
  async (initialNote) => {
    let note = initialNote;
    mocks.slots.mockResolvedValue({ data: [] });
    mocks.schedule.mockImplementation(async ({ date }: { date: string }) => ({
      data: [
        {
          id: 'booking-description',
          status: 'CONFIRMED',
          totalPrice: 150000,
          createdAt: '2026-11-18T01:00:00Z',
          adminNote: note,
          user: { id: 'customer', name: 'Budi', phone: '08123456789' },
          details: [
            {
              id: 'detail',
              courtId: 'court',
              price: 150000,
              court: { id: 'court', name: 'Padel 1', sport: 'PADEL' },
              slot: { id: 'slot', startAt: `${date} 12:00:00`, endAt: `${date} 13:00:00` }
            }
          ]
        }
      ]
    }));
    mocks.description.mockImplementation(async (_id, payload) => {
      note = payload.description;
      return { data: { id: 'booking-description', adminNote: note } };
    });
    const client = mount();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Detail booking Budi, Padel 1, 12:00' })
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Edit description' }));
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(initialNote ?? '');
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
      target: { value: 'Catatan baru dari schedule' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan description' }));
    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: 'Description' })).not.toBeInTheDocument()
    );
    expect(
      within(screen.getByRole('dialog')).getByText('Catatan baru dari schedule')
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Detail booking Budi, Padel 1, 12:00', hidden: true })
      ).toHaveTextContent('Catatan baru dari schedule')
    );
    expect(mocks.description).toHaveBeenCalledWith('booking-description', {
      description: 'Catatan baru dari schedule',
      expectedAdminNote: initialNote
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'schedule'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'bookings'] });
    client.clear();
  }
);
it('renders the booking grid while the optional slot request is still pending and requests only one day', async () => {
  mocks.slots.mockReturnValue(new Promise(() => {}));
  const client = mount();
  expect(
    await screen.findByRole('table', { name: 'Jadwal pemesanan lapangan' })
  ).toBeInTheDocument();
  expect(screen.queryByText('Memuat jadwal...')).toBeNull();
  expect(screen.getByText('Memuat slot lapangan...')).toBeInTheDocument();
  expect(mocks.schedule).toHaveBeenCalledWith({
    courtSport: 'PADEL',
    date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
  });
  client.clear();
});
it('preserves the booking grid and offers retry when the optional slot request fails', async () => {
  mocks.slots.mockRejectedValue(new Error('slot request failed'));
  const client = mount();
  expect(
    await screen.findByRole('table', { name: 'Jadwal pemesanan lapangan' })
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Muat ulang slot' })).toBeInTheDocument()
  );
  client.clear();
});

it('shows a court and coach from the same checkout in the schedule cell', async () => {
  mocks.slots.mockResolvedValue({ data: [] });
  mocks.schedule.mockImplementation(async ({ date }: { date: string }) => ({
    data: [
      {
        id: 'combined-booking',
        status: 'CONFIRMED',
        totalPrice: 350000,
        user: { id: 'customer', name: 'Budi Booking', phone: '08123456789' },
        details: [
          {
            id: 'court-detail',
            courtId: 'court',
            price: 150000,
            court: { id: 'court', name: 'Padel 1', sport: 'PADEL' },
            slot: { id: 'court-slot', startAt: `${date} 12:00:00`, endAt: `${date} 13:00:00` }
          }
        ],
        coaches: [
          {
            id: 'coach-detail',
            bookingId: 'combined-booking',
            price: 200000,
            courtSlotId: null,
            slot: {
              id: 'coach-slot',
              startAt: `${date} 12:00:00`,
              endAt: `${date} 13:00:00`,
              isAvailable: false,
              staff: { id: 'coach', name: 'Coach Andi', coachType: 'PADEL', role: 'COACH' }
            }
          }
        ]
      }
    ]
  }));
  const client = mount();
  const cell = await screen.findByRole('button', {
    name: 'Detail booking Budi Booking, Padel 1, 12:00'
  });
  expect(cell).toHaveTextContent('Budi Booking');
  expect(cell).toHaveTextContent('Coach Andi');
  fireEvent.click(cell);
  expect(await screen.findByRole('tab', { name: 'Jadwal & layanan' })).toHaveAttribute(
    'data-state',
    'active'
  );
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Ubah jadwal' }), {
    button: 0,
    ctrlKey: false
  });
  expect(
    await screen.findByRole('region', { name: 'Reschedule booking lapangan' })
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reschedule' })).toBeInTheDocument();
  client.clear();
});
