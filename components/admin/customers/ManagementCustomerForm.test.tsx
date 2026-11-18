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
  'allows %s to create a Management customer with an optional start date',
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
    fireEvent.change(screen.getByLabelText('Berlaku mulai (opsional)'), {
      target: { value: '2026-11-01' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buat pelanggan Management' }));
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith({
        name: 'Management Customer',
        phone: '081234567890',
        managementValidFrom: '2026-11-01',
        managementValidUntil: null
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
  fireEvent.click(screen.getByRole('button', { name: 'Simpan pengaturan Management' }));
  await waitFor(() =>
    expect(mocks.update).toHaveBeenCalledWith('customer', {
      isManagement: false,
      managementCourtHourlyPrice: 0,
      managementCoachHourlyPrice: 0,
      managementPadelHappyHourlyPrice: 0,
      managementPadelPeakHourlyPrice: 0,
      managementTennisHappyHourlyPrice: 0,
      managementTennisPeakHourlyPrice: 0,
      managementValidFrom: null,
      managementValidUntil: null
    })
  );
});

it('loads and saves account prices, including zero as normal pricing', async () => {
  mount({
    id: 'customer',
    isManagement: true,
    managementCourtHourlyPrice: 100000,
    managementCoachHourlyPrice: 50000
  } as Customer);
  expect(screen.getByLabelText('Lapangan coaching per jam (Rp)')).toHaveValue(100000);
  fireEvent.change(screen.getByLabelText('Coach In-house per jam (Rp)'), {
    target: { value: '0' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan pengaturan Management' }));
  await waitFor(() =>
    expect(mocks.update).toHaveBeenCalledWith(
      'customer',
      expect.objectContaining({
        isManagement: true,
        managementCourtHourlyPrice: 100000,
        managementCoachHourlyPrice: 0
      })
    )
  );
});
it('hides special prices until the account is classified as Management', () => {
  mount({ id: 'customer', isManagement: false } as Customer);
  expect(screen.queryByLabelText('Lapangan coaching per jam (Rp)')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('switch', { name: 'Pelanggan Management' }));
  expect(screen.getByLabelText('Lapangan coaching per jam (Rp)')).toHaveValue(0);
});

it('saves separate coaching and Tennis/Padel Happy/Peak prices without an end date', async () => {
  mount({
    id: 'customer',
    isManagement: true,
    managementCourtHourlyPrice: 200000,
    managementCoachHourlyPrice: 600000,
    managementValidUntil: '2020-01-01'
  } as Customer);
  expect(screen.queryByLabelText('Berlaku sampai (opsional)')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Padel · Happy Hour per jam (Rp)'), {
    target: { value: '100000' }
  });
  fireEvent.change(screen.getByLabelText('Padel · Peak Hour per jam (Rp)'), {
    target: { value: '150000' }
  });
  fireEvent.change(screen.getByLabelText('Tennis · Happy Hour per jam (Rp)'), {
    target: { value: '80000' }
  });
  fireEvent.change(screen.getByLabelText('Tennis · Peak Hour per jam (Rp)'), {
    target: { value: '120000' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan pengaturan Management' }));
  await waitFor(() =>
    expect(mocks.update).toHaveBeenCalledWith(
      'customer',
      expect.objectContaining({
        managementCourtHourlyPrice: 200000,
        managementCoachHourlyPrice: 600000,
        managementPadelHappyHourlyPrice: 100000,
        managementPadelPeakHourlyPrice: 150000,
        managementTennisHappyHourlyPrice: 80000,
        managementTennisPeakHourlyPrice: 120000,
        managementValidUntil: null
      })
    )
  );
});
