import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import BookingCoachSelection from './BookingCoachSelection';
import type { SelectedCoach } from '@/stores/useBookingStore';
const mocks = vi.hoisted(() => ({
  people: vi.fn(),
  groups: vi.fn(),
  availability: vi.fn(),
  select: vi.fn(),
  canSettle: true
}));
vi.mock('@/hooks/useRoleAccess', () => ({ useHasRole: () => mocks.canSettle }));
vi.mock('@/hooks/useAdminCourtSports', () => ({
  useAdminCourtSports: () => ({ branchId: 'cemara' })
}));
vi.mock('@/api/admin/coaching', () => ({ coachingApi: { list: mocks.people } }));
vi.mock('@/api/admin/coachingGroup', () => ({ coachingGroupApi: { list: mocks.groups } }));
vi.mock('@/lib/adminApi', () => ({ adminApi: { get: mocks.availability } }));
const session = {
  date: '2026-11-05',
  timeSlot: '22:00 - 23:00',
  startAt: '2026-11-05T22:00:00Z',
  endAt: '2026-11-05T23:00:00Z'
};
function Harness({ sessions = [session] }: { sessions?: (typeof session)[] }) {
  const [selected, setSelected] = useState<SelectedCoach[]>([]);
  return (
    <BookingCoachSelection
      sessions={sessions}
      sport="PADEL"
      selected={selected}
      onSettlementChange={(slotId, isClubSettled) =>
        setSelected((current) =>
          current.map((coach) => (coach.slotId === slotId ? { ...coach, isClubSettled } : coach))
        )
      }
      onParticipantsChange={(slotId, participants) => {
        setSelected((current) =>
          current.map((coach) => (coach.slotId === slotId ? { ...coach, participants } : coach))
        );
      }}
      onSelect={(_, coach) => {
        setSelected((current) => {
          if (!coach) return [];
          return current.some((item) => item.slotId === coach.slotId)
            ? current.filter((item) => item.slotId !== coach.slotId)
            : [...current, coach];
        });
        mocks.select(coach);
      }}
    />
  );
}
function mount(sessions?: (typeof session)[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Harness sessions={sessions} />
    </QueryClientProvider>
  );
  return client;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.canSettle = true;
  mocks.people.mockResolvedValue([
    { id: 'available', name: 'Coach Andi', role: 'COACH', coachType: 'PADEL', isActive: true },
    { id: 'busy', name: 'Coach Budi', role: 'COACH', coachType: 'PADEL', isActive: true },
    { id: 'inactive', name: 'Coach Citra', role: 'COACH', coachType: 'PADEL', isActive: false },
    { id: 'independent', name: 'Coach Dicky', role: 'COACH', coachType: 'PADEL', isActive: true }
  ]);
  mocks.groups.mockResolvedValue([
    {
      id: 'academy',
      name: 'SR Academy',
      isActive: true,
      sports: ['PADEL'],
      branches: [{ branchId: 'cemara' }],
      coaches: ['available', 'busy', 'inactive'].map((staffId) => ({ staffId }))
    },
    {
      id: 'other-branch',
      name: 'Other Branch',
      isActive: true,
      sports: ['PADEL'],
      branches: [{ branchId: 'other' }],
      coaches: []
    }
  ]);
  mocks.availability.mockResolvedValue({
    data: {
      data: [
        {
          slotId: 'slot-andi',
          coach: { id: 'available' },
          startAt: '2026-11-05 22:00:00',
          endAt: '2026-11-05 23:00:00',
          price: 200000
        }
      ]
    }
  });
});
afterEach(cleanup);
it('opens a group and shows available, unavailable and inactive members, disabling unavailable choices', async () => {
  const client = mount();
  const group = await screen.findByRole('button', { name: /SR Academy/ });
  expect(screen.queryByRole('button', { name: 'Pilih Coach Andi' })).not.toBeInTheDocument();
  fireEvent.click(group);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Pilih Coach Andi' })).toBeEnabled()
  );
  expect(group).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('button', { name: 'Pilih Coach Budi' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Pilih Coach Citra' })).toBeDisabled();
  expect(screen.getByText('Tidak tersedia')).toBeInTheDocument();
  expect(screen.getByText('Nonaktif')).toBeInTheDocument();
  expect(screen.queryByText('Other Branch')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach Andi' }));
  expect(mocks.select).toHaveBeenCalledWith(
    expect.objectContaining({
      coachId: 'available',
      slotId: 'slot-andi',
      coachingGroupId: 'academy',
      coachingGroupName: 'SR Academy'
    })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Tanpa coach' }));
  expect(mocks.select).toHaveBeenLastCalledWith(null);
  client.clear();
});
it('keeps coaches with no available slots visible and disabled when availability fails', async () => {
  mocks.availability.mockRejectedValue(new Error('offline'));
  const client = mount();
  fireEvent.click(await screen.findByRole('button', { name: /SR Academy/ }));
  await screen.findByRole('alert');
  expect(screen.getByRole('button', { name: 'Pilih Coach Andi' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Pilih Coach Budi' })).toBeDisabled();
  client.clear();
});
it('shows ungrouped coaches under Coach Independen and does not list grouped members there', async () => {
  const client = mount();
  fireEvent.click(await screen.findByRole('button', { name: /Coach Independen/ }));
  expect(screen.getByRole('button', { name: 'Pilih Coach Dicky' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Pilih Coach Andi' })).not.toBeInTheDocument();
  client.clear();
});
it('uses the next calendar day for a midnight end when the stored end timestamp is absent', async () => {
  const client = mount([
    {
      ...session,
      timeSlot: '23:00 - 00:00',
      startAt: '2026-11-05T23:00:00Z',
      endAt: undefined as unknown as string
    }
  ]);
  await waitFor(() =>
    expect(mocks.availability).toHaveBeenCalledWith(
      '/coach/availability',
      expect.objectContaining({
        params: {
          startAt: '2026-11-05T23:00:00',
          endAt: '2026-11-06T00:00:00',
          courtSport: 'PADEL'
        }
      })
    )
  );
  client.clear();
});

it('selects multiple coaches across groups for one hour and toggles each independently', async () => {
  mocks.availability.mockResolvedValue({
    data: {
      data: [
        {
          slotId: 'slot-andi',
          coach: { id: 'available' },
          startAt: '2026-11-05 22:00:00',
          endAt: '2026-11-05 23:00:00',
          price: 200000
        },
        {
          slotId: 'slot-dicky',
          coach: { id: 'independent' },
          startAt: '2026-11-05 22:00:00',
          endAt: '2026-11-05 23:00:00',
          price: 250000
        }
      ]
    }
  });
  const client = mount();
  fireEvent.click(await screen.findByRole('button', { name: /SR Academy/ }));
  const andi = await screen.findByRole('button', { name: 'Pilih Coach Andi' });
  await waitFor(() => expect(andi).toBeEnabled());
  fireEvent.click(andi);
  fireEvent.click(screen.getByRole('button', { name: /Coach Independen/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach Dicky' }));
  expect(screen.getByText(/Terpilih \(2\):/)).toHaveTextContent(
    'Coach Andi · SR Academy; Coach Dicky'
  );
  expect(screen.getByRole('button', { name: 'Pilih Coach Dicky' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach Dicky' }));
  expect(screen.getByText(/Terpilih \(1\):/)).toHaveTextContent('Coach Andi');
  expect(screen.getByRole('button', { name: 'Pilih Coach Dicky' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Pilih Coach Dicky' }));
  fireEvent.click(screen.getByRole('button', { name: 'Tanpa coach' }));
  expect(screen.queryByText(/Terpilih/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Tanpa coach' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  client.clear();
});

it('starts availability in parallel while the coaching catalog is still loading', async () => {
  let resolvePeople!: (value: unknown[]) => void;
  mocks.people.mockReturnValue(
    new Promise((resolve) => {
      resolvePeople = resolve;
    })
  );
  const client = mount();
  await waitFor(() => expect(mocks.availability).toHaveBeenCalledTimes(1));
  expect(screen.getByRole('status', { name: 'Memuat grup dan coach...' })).toBeInTheDocument();
  resolvePeople([]);
  await screen.findByRole('button', { name: 'Tanpa coach' });
  expect(mocks.availability).toHaveBeenCalledTimes(1);
  client.clear();
});
it('does not request a hidden, unselected service', async () => {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <BookingCoachSelection
        sessions={[session]}
        sport="PADEL"
        selected={[]}
        onSelect={vi.fn()}
        active={false}
      />
    </QueryClientProvider>
  );
  expect(mocks.people).not.toHaveBeenCalled();
  expect(mocks.groups).not.toHaveBeenCalled();
  expect(mocks.availability).not.toHaveBeenCalled();
  client.clear();
});

it('replaces club member counts after clearing, validates on blur and supports increment controls', async () => {
  const client = mount();
  fireEvent.click(await screen.findByRole('button', { name: /SR Academy/ }));
  const coach = screen.getByRole('button', { name: 'Pilih Coach Andi' });
  await waitFor(() => expect(coach).toBeEnabled());
  fireEvent.click(coach);
  const count = screen.getByRole('spinbutton', { name: /Jumlah member.*Coach Andi/ });
  expect(count).toHaveValue(1);
  fireEvent.focus(count);
  expect((count as HTMLInputElement).value).toBe('1');
  fireEvent.change(count, { target: { value: '' } });
  expect(count).toHaveValue(null);
  fireEvent.change(count, { target: { value: '4' } });
  expect(count).toHaveValue(4);
  expect(coach).toHaveAttribute('aria-pressed', 'true');
  for (const invalid of ['0', '-1', '1.5', '101']) {
    fireEvent.change(count, { target: { value: invalid } });
    expect(count).toHaveAttribute('aria-invalid', 'true');
    fireEvent.blur(count);
    expect(count).toHaveValue(4);
  }
  fireEvent.change(count, { target: { value: '' } });
  fireEvent.blur(count);
  expect(count).toHaveValue(4);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah member Coach Andi' }));
  expect(count).toHaveValue(5);
  fireEvent.click(screen.getByRole('button', { name: 'Kurangi member Coach Andi' }));
  expect(count).toHaveValue(4);
  fireEvent.change(count, { target: { value: '1' } });
  expect(screen.getByRole('button', { name: 'Kurangi member Coach Andi' })).toBeDisabled();
  fireEvent.change(count, { target: { value: '100' } });
  expect(screen.getByRole('button', { name: 'Tambah member Coach Andi' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Tanpa coach' }));
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  client.clear();
});

it('marks only the selected coach session settled and restores its price when reopened', async () => {
  const client = mount();
  fireEvent.click(await screen.findByRole('button', { name: /SR Academy/ }));
  const coach = screen.getByRole('button', { name: 'Pilih Coach Andi' });
  await waitFor(() => expect(coach).toBeEnabled());
  fireEvent.click(coach);
  const toggle = screen.getByRole('switch', { name: 'Lunas ke Club · Coach Andi' });
  fireEvent.click(toggle);
  expect(toggle).toBeChecked();
  expect(coach).toHaveTextContent('Lunas · Rp 0');
  fireEvent.click(toggle);
  expect(toggle).not.toBeChecked();
  expect(coach).toHaveTextContent('200.000');
  client.clear();
});
it('does not expose settlement controls to cashiers', async () => {
  mocks.canSettle = false;
  const client = mount();
  fireEvent.click(await screen.findByRole('button', { name: /SR Academy/ }));
  const coach = screen.getByRole('button', { name: 'Pilih Coach Andi' });
  await waitFor(() => expect(coach).toBeEnabled());
  fireEvent.click(coach);
  expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  client.clear();
});
