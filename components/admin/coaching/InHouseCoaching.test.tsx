import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  role: 'ADMIN',
  plans: null as any[] | null,
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
    cancelWallet: mocks.remove
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
        data: mocks.plans ?? [
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
            staff: { id: 'andi', name: 'Andi', isActive: true, coachType: 'PADEL' }
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
import InHouseCoachPlans from './InHouseCoachPlans';
function renderCoachPlans(id = 'andi') {
  return render(
    <InHouseCoachPlans
      coach={{ id, name: id === 'andi' ? 'Andi' : 'Awam', isInHouseCoach: true }}
    />
  );
}
beforeEach(() => {
  mocks.role = 'ADMIN';
  mocks.plans = null;
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
it('creates a package bound to the opened coach profile', async () => {
  renderCoachPlans('awam');
  fireEvent.change(screen.getByLabelText('Nama paket'), { target: { value: 'Awam 12 jam' } });
  expect(screen.getByRole('textbox', { name: 'Kuota jam' })).toHaveValue('');
  fireEvent.change(screen.getByLabelText('Kuota jam'), { target: { value: '12' } });
  fireEvent.change(screen.getByLabelText('Harga per jam (Rp)'), { target: { value: '700000' } });
  fireEvent.change(screen.getByLabelText('Bagian lapangan per jam (Rp)'), {
    target: { value: '200000' }
  });
  fireEvent.submit(screen.getByRole('button', { name: 'Simpan paket' }).closest('form')!);
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(undefined, {
      staffId: 'awam',
      name: 'Awam 12 jam',
      hours: 12,
      hourlyPrice: 700000,
      courtHourlyShare: 200000,
      extraParticipantHourlyPrice: 100000,
      isActive: true
    })
  );
});
it.each(['ADMIN', 'SUPER_ADMIN', 'CASHIER'])(
  'keeps package management out of the %s booking menu',
  (role) => {
    mocks.role = role;
    render(<InHouseCoaching />);
    expect(screen.queryByRole('button', { name: 'Paket & Tarif' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Terima pembayaran & tambah kuota' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Simpan paket' })).not.toBeInTheDocument();
  }
);
it('does not sell a package until a customer, package and payment method are selected', async () => {
  render(<InHouseCoaching />);
  expect(screen.getByRole('button', { name: 'Terima pembayaran & tambah kuota' })).toBeDisabled();
  expect(mocks.sell).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('combobox', { name: 'Pelanggan' }));
  fireEvent.change(screen.getByLabelText('Cari nama atau nomor WhatsApp'), {
    target: { value: 'Budi' }
  });
  fireEvent.click(await screen.findByRole('option', { name: /Budi/ }));
  expect(screen.getByRole('combobox', { name: 'Pelanggan' })).toHaveTextContent('Budi');
  expect(screen.getByRole('button', { name: 'Terima pembayaran & tambah kuota' })).toBeDisabled();
});

it('edits only the allowed tariff fields rather than sending database metadata', async () => {
  renderCoachPlans();
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

it('selects a package card and submits the customer and offline method', async () => {
  render(<InHouseCoaching />);
  fireEvent.click(screen.getByRole('combobox', { name: 'Pelanggan' }));
  fireEvent.change(screen.getByLabelText('Cari nama atau nomor WhatsApp'), {
    target: { value: 'Budi' }
  });
  fireEvent.click(await screen.findByRole('option', { name: /Budi/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Pilih paket Andi · 5 jam' }));
  fireEvent.click(screen.getByRole('combobox', { name: 'Metode pembayaran offline' }));
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
  renderCoachPlans();
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
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(mocks.remove).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog')).toHaveTextContent('Invoice dan pembayaran tetap tersimpan');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel paket' }));
  expect(mocks.remove).toHaveBeenCalledWith('wallet');
});
it('lets the user cancel deletion', () => {
  mocks.wallets = [unusedWallet];
  render(<InHouseCoaching />);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(mocks.remove).not.toHaveBeenCalled();
});
it('hides deletion for used and restored packages', () => {
  mocks.wallets = [{ ...unusedWallet, _count: { usages: 1 } }];
  render(<InHouseCoaching />);
  expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
});
it('hides deletion from viewers', () => {
  mocks.role = 'ADMIN_VIEWER';
  mocks.wallets = [unusedWallet];
  render(<InHouseCoaching />);
  expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
});

it('does not allow selecting a different coach in the profile package editor', () => {
  renderCoachPlans();
  expect(screen.queryByRole('combobox', { name: 'Coach in-house' })).not.toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Paket dan tarif Andi' })).toBeInTheDocument();
});
it('shows only the opened coach package cards and opens their details', () => {
  const terms = {
    hourlyPrice: 900000,
    courtHourlyShare: 250000,
    extraParticipantHourlyPrice: 100000,
    isActive: true
  };
  mocks.plans = [
    {
      ...terms,
      id: 'andi-5',
      staffId: 'andi',
      name: 'Paket Lima Jam',
      hours: 5,
      staff: { id: 'andi', name: 'Andi', isActive: true, coachType: 'PADEL' }
    },
    {
      ...terms,
      id: 'andi-10',
      staffId: 'andi',
      name: 'Paket Sepuluh Jam',
      hours: 10,
      staff: { id: 'andi', name: 'Andi', isActive: true, coachType: 'PADEL' }
    },
    {
      ...terms,
      id: 'awam-1',
      staffId: 'awam',
      name: 'Satuan Awam',
      hours: 1,
      staff: { id: 'awam', name: 'Awam', isActive: true }
    }
  ];
  renderCoachPlans();
  const andi = screen.getByRole('region', { name: 'Paket Andi' });
  expect(within(andi).getAllByRole('article')).toHaveLength(2);
  expect(within(andi).queryByText('Satuan Awam')).not.toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Paket Awam' })).not.toBeInTheDocument();
  const card = screen.getByRole('article', { name: 'Andi · Paket Lima Jam' });
  fireEvent.click(within(card).getByRole('button', { name: 'Detail' }));
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveTextContent('Andi · Paket Lima Jam');
  expect(dialog).toHaveTextContent('4.500.000');
  expect(dialog).toHaveTextContent('250.000');
  expect(dialog).toHaveTextContent('650.000');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Tutup' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it.each(['CASHIER', 'ADMIN_VIEWER', 'COACH'])(
  'blocks %s from accessing package management',
  (role) => {
    mocks.role = role;
    renderCoachPlans();
    expect(screen.queryByRole('region', { name: 'Paket dan tarif Andi' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Simpan paket' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  }
);
it('allows super admins to manage packages in the coach profile', () => {
  mocks.role = 'SUPER_ADMIN';
  renderCoachPlans();
  expect(screen.getByRole('button', { name: 'Simpan paket' })).toBeInTheDocument();
});

it('filters the package cards by sport and excludes inactive packages', () => {
  const terms = {
    hours: 5,
    hourlyPrice: 900000,
    courtHourlyShare: 250000,
    extraParticipantHourlyPrice: 100000,
    isActive: true
  };
  mocks.plans = [
    {
      ...terms,
      id: 'padel',
      staffId: 'padel-coach',
      name: 'Padel Lima Jam',
      staff: { name: 'Coach Padel', isActive: true, coachType: 'PADEL' }
    },
    {
      ...terms,
      id: 'tennis',
      staffId: 'tennis-coach',
      name: 'Tennis Lima Jam',
      staff: { name: 'Coach Tennis', isActive: true, coachType: 'TENNIS' }
    },
    {
      ...terms,
      id: 'inactive',
      staffId: 'padel-coach',
      name: 'Paket Nonaktif',
      isActive: false,
      staff: { name: 'Coach Padel', isActive: true, coachType: 'PADEL' }
    }
  ];
  render(<InHouseCoaching />);
  const padel = screen.getByRole('button', { name: 'Pilih paket Coach Padel · Padel Lima Jam' });
  expect(screen.queryByRole('button', { name: /Paket Nonaktif/ })).not.toBeInTheDocument();
  fireEvent.click(padel);
  expect(padel).toHaveAttribute('aria-pressed', 'true');
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Tennis' }), { button: 0, ctrlKey: false });
  expect(screen.queryByRole('button', { name: /Pilih paket Coach Padel/ })).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Pilih paket Coach Tennis · Tennis Lima Jam' })
  ).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('button', { name: 'Terima pembayaran & tambah kuota' })).toBeDisabled();
});

it('keeps a cancelled package visible with a Cancel badge and no cancel action', () => {
  mocks.wallets = [
    {
      ...unusedWallet,
      deletedAt: '2026-11-13T08:00:00Z',
      invoice: { id: 'invoice', number: 'INV-CANCEL', status: 'CANCELLED' }
    }
  ];
  render(<InHouseCoaching />);
  expect(screen.getByText('Cancel')).toBeInTheDocument();
  expect(screen.getByText('INV-CANCEL')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  expect(screen.getByText('0 / 5 jam')).toBeInTheDocument();
});
