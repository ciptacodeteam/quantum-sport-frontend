import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { CoachingBooking } from '@/api/admin/coaching';
const mocks = vi.hoisted(() => ({ setClubSettlement: vi.fn(), role: 'ADMIN' }));
vi.mock('@/api/admin/coaching', () => ({ coachingApi: mocks }));
vi.mock('@/hooks/useRoleAccess', () => ({
  useHasRole: (roles: string[]) => mocks.role === 'SUPER_ADMIN' || roles.includes(mocks.role)
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import CoachClubSettlementToggle from './CoachClubSettlementToggle';
const booking = {
  id: 'coach-line',
  name: 'Coach A',
  customer: 'Budi',
  startAt: '2026-11-10 09:00:00',
  isClubSettled: false,
  status: 'CONFIRMED',
  invoice: { status: 'PAID' }
} as CoachingBooking;
function mount(overrides: Partial<CoachingBooking> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  render(
    <QueryClientProvider client={client}>
      <CoachClubSettlementToggle booking={{ ...booking, ...overrides }} />
    </QueryClientProvider>
  );
  return { client, invalidate };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.role = 'ADMIN';
  mocks.setClubSettlement.mockResolvedValue({});
});
afterEach(cleanup);
it('marks a paid coach session settled and refreshes bookings and income reports', async () => {
  const { invalidate } = mount();
  fireEvent.click(screen.getByRole('switch'));
  await waitFor(() =>
    expect(mocks.setClubSettlement).toHaveBeenCalledWith('coach-line', true, false)
  );
  await waitFor(() =>
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'analytics'] })
  );
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'coaching'] });
});
it('supports undoing settlement', async () => {
  mount({ isClubSettled: true });
  expect(screen.getByRole('switch')).toBeChecked();
  fireEvent.click(screen.getByRole('switch'));
  await waitFor(() =>
    expect(mocks.setClubSettlement).toHaveBeenCalledWith('coach-line', false, true)
  );
});
it('shows a read-only status for staff without edit access', () => {
  mocks.role = 'ADMIN_VIEWER';
  mount({ isClubSettled: true });
  expect(screen.getByText('Lunas ke Club')).toBeInTheDocument();
  expect(screen.queryByRole('switch')).toBeNull();
});
it.each([{ status: 'CANCELLED' }, { invoice: { status: 'PENDING' } }, { invoice: null }])(
  'blocks settlement of an ineligible session: %j',
  (overrides) => {
    mount(overrides as Partial<CoachingBooking>);
    expect(screen.getByRole('switch')).toBeDisabled();
  }
);
it('blocks repeated clicks while saving', async () => {
  mocks.setClubSettlement.mockReturnValue(new Promise(() => {}));
  mount();
  fireEvent.click(screen.getByRole('switch'));
  await waitFor(() => expect(screen.getByRole('switch')).toBeDisabled());
  fireEvent.click(screen.getByRole('switch'));
  expect(mocks.setClubSettlement).toHaveBeenCalledTimes(1);
});

it.each([false, true])('cashiers can view settlement=%s without a toggle', (isClubSettled) => {
  mocks.role = 'CASHIER';
  mount({ isClubSettled });
  expect(
    screen.getByText(isClubSettled ? 'Lunas ke Club' : 'Belum lunas ke Club')
  ).toBeInTheDocument();
  expect(screen.queryByRole('switch')).toBeNull();
  expect(mocks.setClubSettlement).not.toHaveBeenCalled();
});
it.each(['ADMIN', 'SUPER_ADMIN'])('allows %s to use the settlement toggle', (role) => {
  mocks.role = role;
  mount();
  expect(screen.getByRole('switch')).toBeEnabled();
});
