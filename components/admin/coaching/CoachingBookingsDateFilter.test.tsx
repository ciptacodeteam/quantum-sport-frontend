import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CoachingBookings from './CoachingBookings';
const mocks = vi.hoisted(() => ({ bookings: vi.fn(), clubs: vi.fn() }));
vi.mock('@/api/admin/coachingGroup', () => ({ coachingGroupApi: { list: mocks.clubs } }));
vi.mock('@/api/admin/coaching', () => ({ coachingApi: mocks }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/useAdminCourtSports', () => ({
  useAdminCourtSports: () => ({ branchId: 'cemara' })
}));
vi.mock('@/hooks/useRoleAccess', () => ({ useHasRole: () => false }));
vi.mock('@/components/ui/data-table', () => ({
  DataTable: ({ rightActions }: any) => <div>{rightActions}</div>
}));
const originalScrollIntoView = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollIntoView'
);
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn()
  });
  vi.clearAllMocks();
  mocks.bookings.mockResolvedValue([]);
  mocks.clubs.mockResolvedValue([{ id: 'club-a', name: 'Club A' }]);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 3, 12));
});
afterEach(() => {
  cleanup();
  if (originalScrollIntoView)
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScrollIntoView);
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  vi.useRealTimers();
});
it.each(['COACH', 'BALLBOY'] as const)(
  'loads %s bookings by the selected playing day and clears the range on reset',
  async (kind) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <CoachingBookings kind={kind} />
      </QueryClientProvider>
    );
    await waitFor(() => expect(mocks.bookings).toHaveBeenCalledWith(kind, {}));
    fireEvent.click(screen.getByRole('button', { name: /^Date range:/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    await waitFor(() =>
      expect(mocks.bookings).toHaveBeenCalledWith(kind, {
        dateFrom: '2026-11-03',
        dateTo: '2026-11-03'
      })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reset filter tanggal' }));
    await waitFor(() => expect(mocks.bookings.mock.lastCall).toEqual([kind, {}]));
    client.clear();
  }
);

it('uses the Jakarta day for Today even when the UTC calendar is still on yesterday', async () => {
  vi.setSystemTime(new Date('2026-11-02T18:00:00Z'));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <CoachingBookings kind="COACH" />
    </QueryClientProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: /^Date range:/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Today' }));
  await waitFor(() =>
    expect(mocks.bookings).toHaveBeenCalledWith('COACH', {
      dateFrom: '2026-11-03',
      dateTo: '2026-11-03'
    })
  );
  client.clear();
});

it('filters coach bookings by club together with the playing date and resets to all clubs', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <CoachingBookings kind="COACH" />
    </QueryClientProvider>
  );
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Club' })).not.toBeDisabled());
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Club' }), { key: 'ArrowDown' });
  await screen.findByRole('option', { name: 'Club A' });
  expect(mocks.clubs).toHaveBeenCalledWith('cemara');
  fireEvent.click(screen.getByRole('option', { name: 'Club A' }));
  await waitFor(() =>
    expect(mocks.bookings.mock.lastCall).toEqual(['COACH', { coachingGroupId: 'club-a' }])
  );
  fireEvent.click(screen.getByRole('button', { name: /^Date range:/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Today' }));
  await waitFor(() =>
    expect(mocks.bookings.mock.lastCall).toEqual([
      'COACH',
      {
        coachingGroupId: 'club-a',
        dateFrom: '2026-11-03',
        dateTo: '2026-11-03'
      }
    ])
  );
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Club' }), { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('option', { name: 'Semua club' }));
  await waitFor(() =>
    expect(mocks.bookings.mock.lastCall).toEqual([
      'COACH',
      {
        dateFrom: '2026-11-03',
        dateTo: '2026-11-03'
      }
    ])
  );
  client.clear();
});

it('does not show a club filter for ballboy bookings', () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <CoachingBookings kind="BALLBOY" />
    </QueryClientProvider>
  );
  expect(screen.queryByRole('combobox', { name: 'Club' })).toBeNull();
  expect(mocks.clubs).not.toHaveBeenCalled();
  client.clear();
});
