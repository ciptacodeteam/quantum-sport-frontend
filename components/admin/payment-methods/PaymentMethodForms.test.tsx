import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock('@/components/ui/dialog', () => ({ useDialog: () => ({ closeDialog: vi.fn() }) }));
vi.mock('@tanstack/react-query', async (original) => ({
  ...(await original<any>()),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: () => ({ mutate: mocks.mutate, isPending: false })
}));
import CreatePaymentMethodForm from './CreatePaymentMethodForm';
import EditPaymentMethodForm from './EditPaymentMethodForm';
import type { PaymentMethod } from '@/types/model';
const method: PaymentMethod = {
  id: 'method',
  name: 'Tunai Kasir',
  fees: 0,
  percentage: '0',
  channel: null,
  logo: null,
  sequence: 0,
  isActive: true,
  isOffline: true,
  createdAt: new Date(),
  updatedAt: new Date()
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('creates an offline-only method with a badge and without a gateway channel', async () => {
  render(<CreatePaymentMethodForm />);
  fireEvent.change(screen.getByLabelText('Nama Metode'), { target: { value: 'Tunai Kasir' } });
  fireEvent.click(screen.getByRole('switch', { name: 'Pembayaran offline khusus admin' }));
  expect(screen.getByText('Offline · Khusus Admin')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Metode' }));
  await waitFor(() =>
    expect(mocks.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Tunai Kasir', isOffline: true, channel: '' })
    )
  );
});
it('loads offline status for editing and submits false when changing back to online', async () => {
  render(<EditPaymentMethodForm data={method} />);
  expect(screen.getByRole('switch', { name: 'Pembayaran offline khusus admin' })).toBeChecked();
  expect(screen.getByText('Offline · Khusus Admin')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('switch', { name: 'Pembayaran offline khusus admin' }));
  expect(screen.getByText('Online')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }));
  await waitFor(() =>
    expect(mocks.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'method', data: expect.objectContaining({ isOffline: false }) })
    )
  );
});
it('keeps the offline flag locked in view-only mode', () => {
  render(<EditPaymentMethodForm data={method} readOnly />);
  expect(screen.getByRole('switch', { name: 'Pembayaran offline khusus admin' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Simpan Perubahan' })).not.toBeInTheDocument();
});
