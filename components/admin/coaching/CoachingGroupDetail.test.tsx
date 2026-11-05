import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CoachingGroupDetail from './CoachingGroupDetail';

const mocks = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('@/api/admin/coachingGroup', () => ({ coachingGroupApi: mocks }));
vi.mock('@/hooks/useRoleAccess', () => ({
  useRoleAccess: () => ({ hasAccess: true, isLoading: false })
}));
vi.mock('@/hooks/useAdminCourtSports', () => ({
  useAdminCourtSports: () => ({ branchId: 'cemara' })
}));
vi.mock('./CoachingCatalog', () => ({
  default: ({ groupId }: { groupId: string }) => <div data-testid="members">Members: {groupId}</div>
}));
const clients: QueryClient[] = [];
function mount(groupId = 'northwest') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <CoachingGroupDetail groupId={groupId} />
    </QueryClientProvider>
  );
}
beforeEach(() => {
  mocks.list.mockResolvedValue([
    {
      id: 'northwest',
      name: 'Northwest',
      description: 'Academy Padel',
      logo: null,
      sports: ['PADEL'],
      isActive: true,
      branches: [{ branchId: 'cemara', branch: { id: 'cemara', name: 'Cemara' } }],
      coaches: []
    }
  ]);
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.resetAllMocks();
});
it('shows group information and the catalog scoped to that group', async () => {
  mount();
  expect(await screen.findByRole('heading', { name: 'Northwest' })).toBeInTheDocument();
  expect(screen.getByText('Academy Padel')).toBeInTheDocument();
  expect(screen.getByText('Cemara')).toBeInTheDocument();
  expect(screen.getByTestId('members')).toHaveTextContent('Members: northwest');
  expect(screen.getByRole('link', { name: /Kembali/ })).toHaveAttribute(
    'href',
    '/admin/coaching-groups'
  );
});
it('does not show a member list for a missing group', async () => {
  mount('missing');
  expect(await screen.findByRole('alert')).toHaveTextContent('Grup coaching tidak ditemukan.');
  expect(screen.queryByTestId('members')).not.toBeInTheDocument();
});
it('offers retry without displaying members when loading the group fails', async () => {
  mocks.list.mockRejectedValue(new Error('unavailable'));
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('Detail grup belum dapat dimuat.');
  expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
  expect(screen.queryByTestId('members')).not.toBeInTheDocument();
});
it('opens independent coaches without requiring a group record', () => {
  mount('independent');
  expect(screen.getByRole('heading', { name: 'Coach Independen' })).toBeInTheDocument();
  expect(screen.getByTestId('members')).toHaveTextContent('Members: independent');
  expect(mocks.list).not.toHaveBeenCalled();
});
