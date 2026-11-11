import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CoachingGroups from './CoachingGroups';
const mocks = vi.hoisted(() => ({
  remove: vi.fn(),
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
  mocks.remove.mockResolvedValue({});
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
  expect(screen.queryByRole('button', { name: 'Hapus grup Northwest' })).not.toBeInTheDocument();
  expect(mocks.branches).not.toHaveBeenCalled();
  expect(screen.getByRole('link', { name: 'Detail grup Northwest' })).toHaveAttribute(
    'href',
    '/admin/coaching-groups/northwest'
  );
  expect(screen.getByRole('link', { name: 'Detail Coach Independen' })).toHaveAttribute(
    'href',
    '/admin/coaching-groups/independent'
  );
});

it('previews a local file and submits it as the group logo', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Edit grup Northwest' }));
  const file = new File(['image'], 'northwest.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Logo grup (opsional)'), { target: { files: [file] } });
  expect(await screen.findByAltText('Pratinjau logo grup')).toHaveAttribute(
    'src',
    expect.stringContaining('data:image/png;base64,')
  );
  fireEvent.click(screen.getByRole('button', { name: 'Simpan grup' }));
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(
      'northwest',
      expect.objectContaining({ logo: file, removeLogo: false })
    )
  );
});
it('keeps the existing logo when no new file is selected and permits explicit removal', async () => {
  mocks.list.mockResolvedValue([{ ...group, logo: 'https://images.example.com/existing.webp' }]);
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Edit grup Northwest' }));
  expect(await screen.findByAltText('Pratinjau logo grup')).toHaveAttribute(
    'src',
    'https://images.example.com/existing.webp'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Hapus logo' }));
  expect(screen.queryByAltText('Pratinjau logo grup')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Simpan grup' }));
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(
      'northwest',
      expect.objectContaining({ removeLogo: true, logo: undefined })
    )
  );
});
it.each([
  new File(['svg'], 'logo.svg', { type: 'image/svg+xml' }),
  new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })
])('rejects unsupported or oversized images before saving', async (file) => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Edit grup Northwest' }));
  fireEvent.change(screen.getByLabelText('Logo grup (opsional)'), { target: { files: [file] } });
  expect(screen.getByRole('alert')).toHaveTextContent('maksimal 5 MB');
  expect(screen.getByRole('button', { name: 'Simpan grup' })).toBeDisabled();
  expect(mocks.save).not.toHaveBeenCalled();
});

it('requires confirmation and permits cancelling without deleting', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Hapus grup Northwest' }));
  expect(screen.getByRole('dialog', { name: 'Hapus grup coaching?' })).toBeInTheDocument();
  expect(mocks.remove).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(mocks.remove).not.toHaveBeenCalled();
});
it('deletes the confirmed group and refreshes the table', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Hapus grup Northwest' }));
  mocks.list.mockResolvedValue([]);
  fireEvent.click(screen.getByRole('button', { name: 'Hapus grup' }));
  await waitFor(() => expect(mocks.remove).toHaveBeenCalledExactlyOnceWith('northwest'));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText('Northwest')).not.toBeInTheDocument());
});
it('keeps the confirmation available when deletion fails', async () => {
  mocks.remove.mockRejectedValue(new Error('Gagal menghapus'));
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Hapus grup Northwest' }));
  fireEvent.click(screen.getByRole('button', { name: 'Hapus grup' }));
  await waitFor(() => expect(mocks.remove).toHaveBeenCalled());
  expect(screen.getByRole('dialog', { name: 'Hapus grup coaching?' })).toBeInTheDocument();
});
