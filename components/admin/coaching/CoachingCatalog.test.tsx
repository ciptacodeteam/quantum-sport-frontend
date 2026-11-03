import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CoachingCatalog from './CoachingCatalog';
const mocks = vi.hoisted(() => ({ list: vi.fn(), save: vi.fn(), kind: 'COACH' }));
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
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  render(
    <QueryClientProvider client={client}>
      <CoachingCatalog />
    </QueryClientProvider>
  );
  return client;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.kind = 'COACH';
  mocks.list.mockResolvedValue(people);
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
