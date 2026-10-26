import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useBranchStore } from '@/stores/useBranchStore';
import { useBookingStore } from '@/stores/useBookingStore';
import type { Branch } from '@/types/branch';
const mocks = vi.hoisted(() => ({ getBranches: vi.fn(), replace: vi.fn(), path: '/booking' }));
vi.mock('@/api/branch', () => ({ getBranches: mocks.getBranches }));
vi.mock('next/navigation', () => ({
  usePathname: () => mocks.path,
  useRouter: () => ({ replace: mocks.replace })
}));
import BranchGate from './BranchGate';
const branches: Branch[] = [
  { id: 'cemara', name: 'Black Padel Cemara', address: 'Jalan Cemara 51', isActive: true },
  { id: 's-parman', name: 'Black Padel S. Parman', address: 'Jalan S. Parman', isActive: true }
];
let client: QueryClient;
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  useBranchStore.setState({ branch: null, selectorOpen: false });
  useBookingStore.getState().clearAll();
  mocks.path = '/booking';
  mocks.replace.mockReset();
  mocks.replace.mockImplementation((path: string) => {
    mocks.path = path;
  });
  mocks.getBranches.mockResolvedValue(branches);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
});
function show() {
  return render(
    <QueryClientProvider client={client}>
      <BranchGate>
        <p>Booking content</p>
      </BranchGate>
    </QueryClientProvider>
  );
}
it('requires an explicit branch choice before mounting the booking page', async () => {
  show();
  expect(screen.queryByText('Booking content')).toBeNull();
  fireEvent.click(await screen.findByRole('button', { name: /^Black Padel Cemara/ }));
  expect(await screen.findByText('Booking content')).toBeInTheDocument();
  expect(useBranchStore.getState().branch?.id).toBe('cemara');
  expect(sessionStorage.getItem('confirmed-branch')).toBe('cemara');
  expect(mocks.replace).toHaveBeenCalledWith('/');
});
it('asks to confirm a remembered branch on a new visit', async () => {
  useBranchStore.setState({ branch: branches[0] });
  show();
  expect(await screen.findByText('Pilihan terakhir')).toBeInTheDocument();
  expect(screen.queryByText('Booking content')).toBeNull();
  fireEvent.click(await screen.findByRole('button', { name: /^Black Padel Cemara/ }));
  expect(await screen.findByText('Booking content')).toBeInTheDocument();
});
it('allows a confirmed branch and protects an existing cart when switching is canceled', async () => {
  useBranchStore.setState({ branch: branches[0] });
  sessionStorage.setItem('confirmed-branch', 'cemara');
  useBookingStore.setState({
    selectedInventories: [
      { inventoryId: 'old-racket', inventoryName: 'Racket', price: 10000, quantity: 1 }
    ]
  });
  show();
  expect(await screen.findByText('Booking content')).toBeInTheDocument();
  act(() => useBranchStore.getState().openSelector());
  fireEvent.click(await screen.findByRole('button', { name: /Black Padel S. Parman/ }));
  expect(screen.getByRole('heading', { name: 'Pindah cabang?' })).toBeInTheDocument();
  expect(useBranchStore.getState().branch?.id).toBe('cemara');
  expect(useBookingStore.getState().selectedInventories).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Kembali' }));
  expect(await screen.findByRole('button', { name: /^Black Padel Cemara/ })).toBeInTheDocument();
  expect(useBookingStore.getState().selectedInventories).toHaveLength(1);
});
it('discards a legacy cart and stale checkout data only after confirming the new branch', async () => {
  useBookingStore.setState({
    selectedInventories: [
      { inventoryId: 'old-racket', inventoryName: 'Racket', price: 10000, quantity: 1 }
    ]
  });
  sessionStorage.setItem('checkoutData', 'old checkout');
  client.setQueryData(['courts'], ['old court']);
  show();
  fireEvent.click(await screen.findByRole('button', { name: /Black Padel S. Parman/ }));
  expect(useBookingStore.getState().selectedInventories).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Kosongkan keranjang & pindah' }));
  expect(await screen.findByText('Booking content')).toBeInTheDocument();
  expect(useBookingStore.getState().selectedInventories).toHaveLength(0);
  expect(useBranchStore.getState().branch?.id).toBe('s-parman');
  expect(sessionStorage.getItem('checkoutData')).toBeNull();
  expect(client.getQueryData(['courts'])).toBeUndefined();
});
it('keeps invoice payment links accessible without choosing a branch', () => {
  mocks.path = '/invoice/INV-TEST';
  show();
  expect(screen.getByText('Booking content')).toBeInTheDocument();
});
it('shows recovery when the list of branches cannot be loaded', async () => {
  mocks.getBranches.mockRejectedValueOnce(new Error('offline'));
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('Cabang belum dapat dimuat.');
  fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
  expect(await screen.findByRole('button', { name: /^Black Padel Cemara/ })).toBeInTheDocument();
});

it('shows the branch picker as a required dialog over Home', async () => {
  mocks.path = '/';
  show();
  const dialog = await screen.findByRole('dialog', { name: 'Pilih cabang Anda' });
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(screen.getByText('Booking content')).toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(screen.getByRole('dialog', { name: 'Pilih cabang Anda' })).toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: /^Black Padel Cemara/ }));
  await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(screen.getByText('Booking content')).toBeInTheDocument();
});
it('returns Home after confirming the same branch from a different page', async () => {
  mocks.path = '/membership';
  useBranchStore.setState({ branch: branches[0] });
  show();
  fireEvent.click(await screen.findByRole('button', { name: /^Black Padel Cemara/ }));
  expect(await screen.findByText('Booking content')).toBeInTheDocument();
  expect(mocks.replace).toHaveBeenCalledWith('/');
});
