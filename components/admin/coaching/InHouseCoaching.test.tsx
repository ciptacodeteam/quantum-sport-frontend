import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ role: 'ADMIN', save: vi.fn(), sell: vi.fn() }));
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
    sell: mocks.sell
  }
}));
vi.mock('@tanstack/react-query', () => ({
  queryOptions: (options: unknown) => options,
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: (options: any) => ({ mutate: () => options.mutationFn(), isPending: false }),
  useQuery: ({ queryKey }: any) => {
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
          { id: 'andi', name: 'Andi', role: 'COACH', isActive: true },
          { id: 'awam', name: 'Awam', role: 'COACH', isActive: true }
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
  vi.clearAllMocks();
});
afterEach(cleanup);
it('lets an admin set different package prices and court shares for each selected coach', async () => {
  render(<InHouseCoaching />);
  fireEvent.click(screen.getByRole('button', { name: 'Paket & Tarif' }));
  fireEvent.change(screen.getByLabelText('Coach in-house'), { target: { value: 'awam' } });
  fireEvent.change(screen.getByLabelText('Nama paket'), { target: { value: 'Awam 10 jam' } });
  fireEvent.change(screen.getByLabelText('Kuota jam'), { target: { value: '10' } });
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
