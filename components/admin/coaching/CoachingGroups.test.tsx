import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CoachingGroups from './CoachingGroups';
const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  save: vi.fn(),
  branches: vi.fn(),
  canEdit: true
}));
vi.mock('@/api/admin/coachingGroup', () => ({ coachingGroupApi: mocks }));
vi.mock('@/api/branch', () => ({ getAdminBranches: mocks.branches }));
vi.mock('@/hooks/useRoleAccess', () => ({
  useRoleAccess: () => ({ hasAccess: true, isLoading: false }),
  useHasRole: () => mocks.canEdit
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/admin/coaching-groups',
  useSearchParams: () => new URLSearchParams()
}));
const clients: QueryClient[] = [];
const group = {
  id: 'northwest',
  name: 'Northwest',
  description: '',
  logo: '',
  isActive: true,
  sports: ['PADEL', 'TENNIS'],
  branches: [{ branchId: 'cemara', branch: { id: 'cemara', name: 'Cemara' } }],
  coaches: [{ staffId: 'coach' }]
};
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <CoachingGroups />
    </QueryClientProvider>
  );
}
beforeEach(() => {
  mocks.canEdit = true;
  mocks.list.mockResolvedValue([group]);
  mocks.save.mockResolvedValue({});
  mocks.branches.mockResolvedValue([{ id: 'cemara', name: 'Cemara', isActive: true }]);
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((c) => c.clear());
  vi.resetAllMocks();
});
it('creates a group with the selected sports and branches', async () => {
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Tambah grup' }));
  fireEvent.change(screen.getByLabelText('Nama grup'), { target: { value: 'New Academy' } });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Tennis' }));
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Cemara' }));
  fireEvent.click(screen.getByRole('button', { name: 'Simpan grup' }));
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(undefined, {
      name: 'New Academy',
      logo: '',
      description: '',
      sports: ['PADEL', 'TENNIS'],
      branchIds: ['cemara'],
      isActive: true
    })
  );
});
it('deactivates a group while retaining its branches and identity', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Edit grup Northwest' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Grup aktif' }));
  fireEvent.click(screen.getByRole('button', { name: 'Simpan grup' }));
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(
      'northwest',
      expect.objectContaining({ branchIds: ['cemara'], isActive: false })
    )
  );
});
it('lets regular admins read groups without editing the shared catalog', async () => {
  mocks.canEdit = false;
  mount();
  await screen.findByText('Northwest');
  expect(screen.queryByRole('button', { name: 'Tambah grup' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Edit grup Northwest' })).not.toBeInTheDocument();
  expect(mocks.branches).not.toHaveBeenCalled();
});
