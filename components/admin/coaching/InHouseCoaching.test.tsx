import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  role: 'ADMIN',
  wallets: [] as any[],
  remove: vi.fn(),
  save: vi.fn(),
  sell: vi.fn()
}));
vi.mock('@/hooks/useRoleAccess', () => ({
  useRoleAccess: () => ({ hasAccess: true, userRole: mocks.role })
}));
vi.mock('@/hooks/useAdminCourtSports', () => ({
  useAdminCourtSports: () => ({ branchId: 'cemara' })
}));
vi.mock('@/api/admin/inhouseCoaching', () => ({
  inHouseApi: {
    plans: vi.fn(),
    wallets: vi.fn(),
    usage: vi.fn(),
    savePlan: mocks.save,
    sell: mocks.sell,
    deleteWallet: mocks.remove
  }
}));
vi.mock('@tanstack/react-query', () => ({
  queryOptions: (options: unknown) => options,
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: (options: any) => ({
    mutate: (input: unknown) => options.mutationFn(input),
    isPending: false
  }),
  useQuery: ({ queryKey }: any) => {
    if (queryKey.includes('wallets')) return { data: mocks.wallets };
    if (queryKey.includes('plans'))
      return {
        data: [
          {
            id: 'plan',
            branchId: 'cemara',
            createdAt: '2026-11-01',
            staffId: 'andi',
            name: '5 jam',
            hours: 5,
            hourlyPrice: 900000,
            courtHourlyShare: 250000,
            extraParticipantHourlyPrice: 100000,
            isActive: true,
            staff: { id: 'andi', name: 'Andi', isActive: true }
          }
        ]
      };
    if (queryKey.includes('coaching'))
      return {
        data: [
          { id: 'andi', name: 'Andi', role: 'COACH', isActive: true, isInHouseCoach: true },
          { id: 'club', name: 'Coach Club', role: 'COACH', isActive: true, isInHouseCoach: false },
          {
            id: 'inactive',
            name: 'Coach Nonaktif',
            role: 'COACH',
            isActive: false,
            isInHouseCoach: true
          },
          { id: 'awam', name: 'Awam', role: 'COACH', isActive: true, isInHouseCoach: true }
        ]
      };
    if (queryKey.includes('search'))
      return { data: [{ id: 'customer', name: 'Budi', phone: '08123456789' }] };
    if (queryKey.includes('payment-methods') || queryKey.includes('paymentMethods'))
      return { data: [{ id: 'cash', name: 'Tunai', isActive: true, isOffline: true }] };
    return { data: [], isPending: false };
  }
}));
import InHouseCoaching from './InHouseCoaching';
beforeEach(() => {
  mocks.role = 'ADMIN';
  mocks.wallets = [];
  vi.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('lets an admin set different package prices and court shares for each selected coach', async () => {
  render(<InHouseCoaching />);
  fireEvent.click(screen.getByRole('button', { name: 'Paket & Tarif' }));
  fireEvent.click(screen.getByRole('combobox', { name: 'Coach in-house' }));
  fireEvent.change(await screen.findByPlaceholderText('Cari nama coach...'), {
    target: { value: 'Awam' }
  });
  expect(screen.queryByRole('option', { name: 'Andi' })).not.toBeInTheDocument();
  fireEvent.click(await screen.findByRole('option', { name: 'Awam' }));
  fireEvent.change(screen.getByLabelText('Nama paket'), { target: { value: 'Awam 10 jam' } });
  fireEvent.click(screen.getByRole('combobox', { name: 'Kuota jam' }));
  fireEvent.click(await screen.findByRole('option', { name: '10 jam' }));
  fireEvent.change(screen.getByLabelText('Harga per jam (Rp)'), { target: { value: '700000' } });
  fireEvent.change(screen.getByLabelText('Bagian lapangan per jam (Rp)'), {
    target: { value: '200000' }
  });
  fireEvent.submit(screen.getByRole('button', { name: 'Simpan paket' }).closest('form')!);
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(undefined, {
      staffId: 'awam',
      name: 'Awam 10 jam',
      hours: 10,
      hourlyPrice: 700000,
      courtHourlyShare: 200000,
      extraParticipantHourlyPrice: 100000,
      isActive: true
    })
  );
});
it('allows cashiers to see tariffs but hides tariff editing', () => {
  mocks.role = 'CASHIER';
  render(<InHouseCoaching />);
  fireEvent.click(screen.getByRole('button', { name: 'Paket & Tarif' }));
  expect(screen.getByText('Andi · 5 jam')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Simpan paket' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
});
it('does not sell a package until a customer, package and payment method are selected', () => {
  render(<InHouseCoaching />);
  expect(screen.getByRole('button', { name: 'Terima pembayaran & tambah kuota' })).toBeDisabled();
  expect(mocks.sell).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Cari nama atau nomor WhatsApp'), {
    target: { value: 'Budi' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Budi · 08123456789' }));
  expect(screen.getByText('Customer terpilih: Budi · 08123456789')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Terima pembayaran & tambah kuota' })).toBeDisabled();
});

it('edits only the allowed tariff fields rather than sending database metadata', async () => {
  render(<InHouseCoaching />);
  fireEvent.click(screen.getByRole('button', { name: 'Paket & Tarif' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  fireEvent.change(screen.getByLabelText('Harga per jam (Rp)'), { target: { value: '950000' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Simpan paket' }).closest('form')!);
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith('plan', {
      staffId: 'andi',
      name: '5 jam',
      hours: 5,
      hourlyPrice: 950000,
      courtHourlyShare: 250000,
      extraParticipantHourlyPrice: 100000,
      isActive: true
    })
  );
});

it('searches a sale package by coach and submits the selected package and offline method', async () => {
  render(<InHouseCoaching />);
  fireEvent.change(screen.getByLabelText('Cari nama atau nomor WhatsApp'), {
    target: { value: 'Budi' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Budi · 08123456789' }));
  fireEvent.click(screen.getByRole('combobox', { name: 'Paket coach' }));
  fireEvent.change(await screen.findByPlaceholderText('Cari coach atau paket...'), {
    target: { value: 'Andi' }
  });
  fireEvent.click(await screen.findByRole('option', { name: /Andi.*5 jam/ }));
  fireEvent.click(screen.getByRole('combobox', { name: 'Pembayaran diterima melalui' }));
  fireEvent.click(await screen.findByRole('option', { name: 'Tunai' }));
  const submit = screen.getByRole('button', { name: 'Terima pembayaran & tambah kuota' });
  expect(submit).toBeEnabled();
  fireEvent.click(submit);
  await waitFor(() =>
    expect(mocks.sell).toHaveBeenCalledWith({
      packageId: 'plan',
      userId: 'customer',
      paymentMethodId: 'cash',
      requestId: expect.any(String)
    })
  );
});

it('clears an initial zero while editing an amount and restores zero if left blank', () => {
  render(<InHouseCoaching />);
  fireEvent.click(screen.getByRole('button', { name: 'Paket & Tarif' }));
  const amount = screen.getByLabelText('Bagian lapangan per jam (Rp)') as HTMLInputElement;
  expect(amount).toHaveValue(0);
  fireEvent.focus(amount);
  expect(amount.value).toBe('');
  fireEvent.blur(amount);
  expect(amount).toHaveValue(0);
  fireEvent.focus(amount);
  fireEvent.change(amount, { target: { value: '250000' } });
  expect(amount.value).toBe('250000');
  fireEvent.blur(amount);
  fireEvent.focus(amount);
  expect(amount).toHaveValue(250000);
});

const unusedWallet = {
  id: 'wallet',
  packageName: '5 jam',
  totalMinutes: 300,
  remainingMinutes: 300,
  user: { name: 'Budi' },
  staff: { name: 'Andi' },
  _count: { usages: 0 }
};
it.each(['ADMIN', 'CASHIER'])('lets %s confirm deletion of an unused package', (role) => {
  mocks.role = role;
  mocks.wallets = [unusedWallet];
  render(<InHouseCoaching />);
  fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));
  expect(mocks.remove).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog')).toHaveTextContent('Invoice dan pembayaran tetap tersimpan');
  fireEvent.click(screen.getByRole('button', { name: 'Hapus paket' }));
  expect(mocks.remove).toHaveBeenCalledWith('wallet');
});
it('lets the user cancel deletion', () => {
  mocks.wallets = [unusedWallet];
  render(<InHouseCoaching />);
  fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));
  fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(mocks.remove).not.toHaveBeenCalled();
});
it('hides deletion for used and restored packages', () => {
  mocks.wallets = [{ ...unusedWallet, _count: { usages: 1 } }];
  render(<InHouseCoaching />);
  expect(screen.queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument();
});
it('hides deletion from viewers', () => {
  mocks.role = 'ADMIN_VIEWER';
  mocks.wallets = [unusedWallet];
  render(<InHouseCoaching />);
  expect(screen.queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument();
});

it('only lists active in-house coaches for tariffs', async () => {
  render(<InHouseCoaching />);
  fireEvent.click(screen.getByRole('button', { name: 'Paket & Tarif' }));
  expect(screen.getByRole('link', { name: 'Kelola profil & jadwal coach' })).toHaveAttribute(
    'href',
    '/admin/coach-inhouse'
  );
  fireEvent.click(screen.getByRole('combobox', { name: 'Coach in-house' }));
  expect(await screen.findByRole('option', { name: 'Andi' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'Coach Club' })).not.toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'Coach Nonaktif' })).not.toBeInTheDocument();
});
