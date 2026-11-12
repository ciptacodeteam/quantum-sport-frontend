import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CreateManagementCustomer, { ManagementCustomerForm } from './ManagementCustomerForm';
import type { Customer } from '@/types/model';
const mocks = vi.hoisted(() => ({ role: 'ADMIN', create: vi.fn(), update: vi.fn() }));
vi.mock('@/hooks/useRoleAccess', () => ({
  useHasRole: (roles: string[]) => roles.includes(mocks.role)
}));
vi.mock('@/api/admin/customer', () => ({
  createManagementCustomerApi: mocks.create,
  updateManagementCustomerApi: mocks.update
}));
function mount(customer?: Customer) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      {customer ? <ManagementCustomerForm customer={customer} /> : <CreateManagementCustomer />}
    </QueryClientProvider>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  mocks.role = 'ADMIN';
  mocks.create.mockResolvedValue({ data: { id: 'customer' } });
  mocks.update.mockResolvedValue({});
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it.each(['ADMIN', 'SUPER_ADMIN'])(
  'allows %s to create a Management customer with explicit dates',
  async (role) => {
    mocks.role = role;
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Buat pelanggan Management' }));
    fireEvent.change(screen.getByLabelText('Nama pelanggan'), {
      target: { value: 'Management Customer' }
    });
    fireEvent.change(screen.getByLabelText('Nomor WhatsApp'), {
      target: { value: '081234567890' }
    });
    fireEvent.change(screen.getByLabelText('Berlaku sampai (opsional)'), {
      target: { value: '2026-12-31' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buat pelanggan Management' }));
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith({
        name: 'Management Customer',
        phone: '081234567890',
        managementValidFrom: null,
        managementValidUntil: '2026-12-31'
      })
    );
  }
);
it.each(['CASHIER', 'ADMIN_VIEWER', 'COACH'])(
  'hides create and classification controls from %s',
  (role) => {
    mocks.role = role;
    mount();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  }
);
it('lets an admin revoke Management without editing normal customer identity', async () => {
  mount({ id: 'customer', isManagement: true } as Customer);
  fireEvent.click(screen.getByRole('switch', { name: 'Pelanggan Management' }));
  fireEvent.click(screen.getByRole('button', { name: 'Simpan kategori Management' }));
  await waitFor(() =>
    expect(mocks.update).toHaveBeenCalledWith('customer', {
      isManagement: false,
      managementValidFrom: null,
      managementValidUntil: null
    })
  );
});
