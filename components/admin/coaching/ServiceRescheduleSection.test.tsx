import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ServiceRescheduleSection from './ServiceRescheduleSection';
import type { CoachingBooking } from '@/api/admin/coaching';
const mocks = vi.hoisted(() => ({ rescheduleCourt: vi.fn(), allowed: true, dialog: vi.fn() }));
vi.mock('@/api/admin/coaching', () => ({ coachingApi: mocks }));
vi.mock('@/hooks/useRoleAccess', () => ({ useHasRole: () => mocks.allowed }));
vi.mock('@/hooks/useAdminCourtSports', () => ({
  useAdminCourtSports: () => ({ branchId: 'cemara' })
}));
vi.mock('@/components/admin/bookings/RescheduleCourtDialog', () => ({
  RescheduleCourtDialog: (props: unknown) => {
    mocks.dialog(props);
    return <button>Reschedule bersama</button>;
  }
}));
const clients: QueryClient[] = [];
function show(status = 'CONFIRMED', kind: 'COACH' | 'BALLBOY' = 'COACH') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <ServiceRescheduleSection
        kind={kind}
        booking={{ id: 'service', status } as CoachingBooking}
      />
    </QueryClientProvider>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.allowed = true;
  mocks.rescheduleCourt.mockResolvedValue({
    detail: { id: 'court-detail' },
    membershipCovered: false
  });
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});
it.each(['COACH', 'BALLBOY'] as const)(
  'opens the court reschedule action for an active %s',
  async (kind) => {
    show('CONFIRMED', kind);
    expect(await screen.findByRole('button', { name: 'Reschedule bersama' })).toBeInTheDocument();
    expect(mocks.rescheduleCourt).toHaveBeenCalledWith(kind, 'service');
    expect(mocks.dialog).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { id: 'court-detail' }, canReschedule: true })
    );
  }
);
it('does not offer or load rescheduling for cancelled services', () => {
  show('CANCELLED');
  expect(screen.getByText('Hanya booking aktif yang dapat dijadwalkan ulang.')).toBeInTheDocument();
  expect(mocks.rescheduleCourt).not.toHaveBeenCalled();
});
it('does not load or expose the action without permission', () => {
  mocks.allowed = false;
  show();
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
  expect(mocks.rescheduleCourt).not.toHaveBeenCalled();
});
it('shows a failed court link with a retry action', async () => {
  mocks.rescheduleCourt.mockRejectedValue(new Error('unavailable'));
  show();
  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Reschedule bersama' })).not.toBeInTheDocument();
});
