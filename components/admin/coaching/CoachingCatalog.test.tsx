import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CoachingCatalog from './CoachingCatalog';
const mocks = vi.hoisted(() => ({ list: vi.fn(), save: vi.fn(), groups: vi.fn(), kind: 'COACH' }));
vi.mock('@/api/admin/coachingGroup', () => ({ coachingGroupApi: { list: mocks.groups } }));
vi.mock('@/api/admin/coaching', () => ({ coachingApi: mocks }));
vi.mock('@/hooks/useRoleAccess', () => ({
  useRoleAccess: () => ({ hasAccess: true, isLoading: false })
}));
vi.mock('@/hooks/useAdminCourtSports', () => ({
  useAdminCourtSports: () => ({ branchId: 'cemara', canCreateTennis: true })
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/admin/coaching',
  useSearchParams: () => new URLSearchParams({ kind: mocks.kind })
}));
const people = [
  {
    id: 'coach-a',
    name: 'Coach A',
    role: 'COACH',
    coachType: 'PADEL',
    phone: '08111111111',
    isActive: true
  },
  {
    id: 'coach-b',
    name: 'Coach B',
    role: 'COACH',
    coachType: 'TENNIS',
    phone: '08222222222',
    isActive: false
  },
  {
    id: 'ballboy',
    name: 'Ballboy Ibnu',
    role: 'BALLBOY',
    coachType: null,
    phone: '08333333333',
    isActive: true
  }
];
function mount(groupId?: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  render(
    <QueryClientProvider client={client}>
      <CoachingCatalog groupId={groupId} />
    </QueryClientProvider>
  );
  return client;
}
beforeEach(() => {
  vi.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = vi.fn();
  mocks.kind = 'COACH';
  mocks.list.mockResolvedValue(people);
  mocks.groups.mockResolvedValue([]);
  mocks.save.mockResolvedValue({});
});
afterEach(cleanup);
it.each(['COACH', 'BALLBOY'])(
  'uses the standard searchable table and column controls for %s profiles',
  async (kind) => {
    mocks.kind = kind;
    mount();
    const name = kind === 'COACH' ? 'Coach A' : 'Ballboy Ibnu';
    expect(await screen.findByText(name)).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Jenis layanan' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kolom' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Edit profil ${name}` })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: `Jadwal & Harga ${name}` })).toHaveAttribute(
      'href',
      `/admin/coaching/${kind === 'COACH' ? 'coach-a' : 'ballboy'}`
    );
    expect(screen.queryByText(kind === 'COACH' ? 'Ballboy Ibnu' : 'Coach A')).toBeNull();
    fireEvent.change(screen.getByPlaceholderText(/Cari .* olahraga, atau telepon/), {
      target: { value: kind === 'COACH' ? '08222222222' : 'tidak-ada' }
    });
    await waitFor(() => expect(screen.queryByText(name)).toBeNull());
    if (kind === 'COACH') expect(screen.getByText('Coach B')).toBeInTheDocument();
    else expect(screen.getByText('No data found.')).toBeInTheDocument();
  }
);
it('opens and saves the same profile from the compact edit action', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Edit profil Coach A' }));
  fireEvent.change(screen.getByLabelText('Nama'), { target: { value: 'Coach Baru' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan profil' }));
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(
      'coach-a',
      expect.objectContaining({
        name: 'Coach Baru',
        kind: 'COACH',
        coachType: 'PADEL',
        isActive: true
      })
    )
  );
});
it('paginates larger catalogs instead of showing every row at once', async () => {
  mocks.list.mockResolvedValue(
    Array.from({ length: 12 }, (_, index) => ({
      ...people[0],
      id: `coach-${index}`,
      name: `Pelatih ${index + 1}`
    }))
  );
  mount();
  expect(await screen.findByText('Pelatih 1')).toBeInTheDocument();
  expect(screen.queryByText('Pelatih 11')).toBeNull();
  fireEvent.click(screen.getByLabelText('Go to next page'));
  expect(await screen.findByText('Pelatih 11')).toBeInTheDocument();
  expect(screen.queryByText('Pelatih 1')).toBeNull();
});

it('assigns a coach to a group without changing the coach schedule or price', async () => {
  mocks.groups.mockResolvedValue([{ id: 'northwest', name: 'Northwest', isActive: true }]);
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Edit profil Coach A' }));
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Northwest' }));
  fireEvent.click(screen.getByRole('button', { name: 'Simpan profil' }));
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(
      'coach-a',
      expect.objectContaining({ groupIds: ['northwest'] })
    )
  );
});

it('only shows members of the opened group and retains schedule navigation', async () => {
  mocks.list.mockResolvedValue([
    { ...people[0], coachingGroups: [{ group: { id: 'northwest', name: 'Northwest' } }] },
    { ...people[1], coachingGroups: [{ group: { id: 'other', name: 'Other Academy' } }] },
    people[2]
  ]);
  mount('northwest');
  expect(await screen.findByText('Coach A')).toBeInTheDocument();
  expect(screen.queryByText('Coach B')).not.toBeInTheDocument();
  expect(screen.queryByText('Ballboy Ibnu')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Jadwal & Harga Coach A' })).toHaveAttribute(
    'href',
    '/admin/coaching/coach-a?groupId=northwest'
  );
});

it('preselects the opened group when creating a member', async () => {
  mocks.groups.mockResolvedValue([{ id: 'northwest', name: 'Northwest', isActive: true }]);
  mount('northwest');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Tambah Coach' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Coach' }));
  expect(await screen.findByRole('checkbox', { name: 'Northwest' })).toBeChecked();
  fireEvent.change(screen.getByLabelText('Nama'), { target: { value: 'Member Baru' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan profil' }));
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ name: 'Member Baru', groupIds: ['northwest'] })
    )
  );
});

it('keeps ungrouped coaches accessible in the independent detail', async () => {
  mocks.list.mockResolvedValue([
    people[0],
    { ...people[1], coachingGroups: [{ group: { id: 'northwest', name: 'Northwest' } }] },
    people[2]
  ]);
  mount('independent');
  expect(await screen.findByText('Coach A')).toBeInTheDocument();
  expect(screen.queryByText('Coach B')).not.toBeInTheDocument();
  expect(screen.queryByText('Ballboy Ibnu')).not.toBeInTheDocument();
});

it('prevents adding a member when the group is inactive or unavailable in the branch', async () => {
  mocks.groups.mockResolvedValue([{ id: 'northwest', name: 'Northwest', isActive: false }]);
  mount('northwest');
  await waitFor(() => expect(mocks.groups).toHaveBeenCalled());
  expect(screen.getByRole('button', { name: 'Tambah Coach' })).toBeDisabled();
});

it('keeps ballboys available to both sports without a restrictive sport selector', async () => {
  mocks.kind = 'BALLBOY';
  mount();
  const edit = await screen.findByRole('button', { name: 'Edit profil Ballboy Ibnu' });
  fireEvent.click(edit);
  expect(screen.queryByRole('combobox', { name: 'Olahraga' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Simpan profil' }));
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(
      'ballboy',
      expect.objectContaining({ kind: 'BALLBOY', coachType: 'PADEL_TENNIS' })
    )
  );
});
