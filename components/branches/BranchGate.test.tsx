import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useBranchStore } from '@/stores/useBranchStore';
import { useBookingStore } from '@/stores/useBookingStore';
import type { Branch } from '@/types/branch';
const mocks = vi.hoisted(() => ({
  getBranches: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
  path: '/booking'
}));
vi.mock('@/api/branch', () => ({ getBranches: mocks.getBranches }));
vi.mock('next/navigation', () => ({
  usePathname: () => mocks.path,
  useRouter: () => ({ replace: mocks.replace, push: mocks.push })
}));
import BranchGate from './BranchGate';
import BranchLink from './BranchLink';
const branches: Branch[] = [
  { id: 'cemara', name: 'Black Padel Cemara', address: 'Jalan Cemara 51', isActive: true },
  { id: 's-parman', name: 'Black Padel S. Parman', address: 'Jalan S. Parman', isActive: true }
];
let client: QueryClient;
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  useBranchStore.setState({ branch: null, selectorOpen: false, pendingHref: null });
  useBookingStore.getState().clearAll();
  mocks.path = '/booking';
  mocks.replace.mockReset();
  mocks.push.mockReset();
  mocks.push.mockImplementation((path: string) => {
    mocks.path = path;
  });
  mocks.replace.mockImplementation((path: string) => {
    mocks.path = path;
  });
  mocks.getBranches.mockReset();
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
  expect(mocks.replace).not.toHaveBeenCalled();
  expect(mocks.push).not.toHaveBeenCalled();
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

it('opens Home without a branch dialog or loading branch data', async () => {
  mocks.path = '/';
  show();
  expect(screen.getByText('Booking content')).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(mocks.getBranches).not.toHaveBeenCalled();
});
it('does not ask for a remembered branch when opening Home', () => {
  mocks.path = '/';
  useBranchStore.setState({ branch: branches[0] });
  show();
  expect(screen.getByText('Booking content')).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).toBeNull();
});
it('continues on Value Pack after choosing a branch from a direct link', async () => {
  mocks.path = '/membership';
  useBranchStore.setState({ branch: branches[0] });
  show();
  fireEvent.click(await screen.findByRole('button', { name: /^Black Padel Cemara/ }));
  expect(await screen.findByText('Booking content')).toBeInTheDocument();
  expect(mocks.replace).not.toHaveBeenCalled();
  expect(mocks.push).not.toHaveBeenCalled();
});

it.each([
  ['/booking', 'Booking Lapangan Padel'],
  ['/membership', 'Value Pack'],
  ['/booking/tennis', 'Tennis']
])('asks for a branch after clicking %s and continues to that destination', async (href, label) => {
  mocks.path = '/';
  render(
    <QueryClientProvider client={client}>
      <BranchGate>
        <BranchLink href={href}>{label}</BranchLink>
      </BranchGate>
    </QueryClientProvider>
  );
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('link', { name: label }));
  expect(await screen.findByRole('dialog', { name: 'Pilih cabang Anda' })).toBeInTheDocument();
  expect(mocks.push).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole('button', { name: /^Black Padel Cemara/ }));
  await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(href));
  expect(useBranchStore.getState().branch?.id).toBe('cemara');
  expect(screen.queryByRole('dialog')).toBeNull();
});
it('can cancel choosing a branch and remain on Home', async () => {
  mocks.path = '/';
  show();
  act(() => useBranchStore.getState().openSelector('/booking'));
  fireEvent.click(await screen.findByRole('button', { name: 'Batal' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(useBranchStore.getState().pendingHref).toBeNull();
  expect(mocks.push).not.toHaveBeenCalled();
  expect(mocks.replace).not.toHaveBeenCalled();
});
it('asks for a branch again on a booking click even with a confirmed branch', async () => {
  mocks.path = '/';
  useBranchStore.setState({ branch: branches[0] });
  sessionStorage.setItem('confirmed-branch', 'cemara');
  render(
    <QueryClientProvider client={client}>
      <BranchGate>
        <BranchLink href="/membership">Value Pack</BranchLink>
      </BranchGate>
    </QueryClientProvider>
  );
  fireEvent.click(screen.getByRole('link', { name: 'Value Pack' }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: /^Black Padel Cemara/ }));
  await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/membership'));
});
it('keeps the requested destination when confirming a switch with items in the cart', async () => {
  mocks.path = '/';
  useBranchStore.setState({ branch: branches[0] });
  sessionStorage.setItem('confirmed-branch', 'cemara');
  useBookingStore.setState({
    selectedInventories: [
      { inventoryId: 'old-racket', inventoryName: 'Racket', price: 10000, quantity: 1 }
    ]
  });
  show();
  act(() => useBranchStore.getState().openSelector('/membership'));
  fireEvent.click(await screen.findByRole('button', { name: /Black Padel S. Parman/ }));
  expect(mocks.push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Kosongkan keranjang & pindah' }));
  await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/membership'));
  expect(useBookingStore.getState().selectedInventories).toHaveLength(0);
});
it('offers only Cemara when entering the Tennis booking flow', async () => {
  mocks.path = '/booking/tennis';
  useBranchStore.setState({ branch: branches[1] });
  sessionStorage.setItem('confirmed-branch', 's-parman');
  show();
  expect(await screen.findByText('Tennis hanya tersedia di cabang Cemara.')).toBeInTheDocument();
  expect(screen.queryByText('Booking content')).toBeNull();
  expect(screen.queryByRole('button', { name: /Black Padel S. Parman/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /^Black Padel Cemara/ }));
  expect(await screen.findByText('Booking content')).toBeInTheDocument();
  expect(useBranchStore.getState().branch?.id).toBe('cemara');
});
it('filters a pending Tennis destination while leaving the current Padel selection intact', async () => {
  mocks.path = '/booking';
  useBranchStore.setState({
    branch: branches[1],
    selectorOpen: true,
    pendingHref: '/booking/tennis'
  });
  sessionStorage.setItem('confirmed-branch', 's-parman');
  show();
  expect(await screen.findByText('Tennis hanya tersedia di cabang Cemara.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Black Padel S. Parman/ })).toBeNull();
  expect(useBranchStore.getState().branch?.id).toBe('s-parman');
});
