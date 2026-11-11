import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  branchId: 'cemara' as string | null,
  rules: [] as any[],
  save: vi.fn()
}));
vi.mock('@/hooks/useRoleAccess', () => ({
  useRoleAccess: () => ({ isLoading: false, hasAccess: true })
}));
vi.mock('@/hooks/useTariffPeriods', () => ({
  useTariffPeriods: () => ({
    branchId: mocks.branchId,
    rules: mocks.rules,
    isPending: false,
    isError: false
  })
}));
vi.mock('@/api/tariff-period', () => ({ saveTariffPeriod: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: () => ({ mutate: mocks.save, isPending: false })
}));
import TariffPeriodPage from './page';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.branchId = 'cemara';
  mocks.rules = [];
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-30T02:00:00Z'));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('saves explicit whole-hour periods with a Jakarta effective date', () => {
  render(<TariffPeriodPage />);
  fireEvent.click(screen.getByLabelText('Mulai Berlaku'));
  expect(document.querySelector('input[type="date"]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Go to the Next Month' }));
  fireEvent.click(screen.getByRole('button', { name: /November 2nd, 2026/ }));
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' }));
  expect(mocks.save).toHaveBeenCalledWith({
    sport: 'PADEL',
    happyAllDayDays: [],
    effectiveFrom: '2026-11-02',
    happyStart: 6,
    happyEnd: 15,
    peakStart: 15,
    peakEnd: 24,
    happyCoachDiscount: 0,
    peakCoachDiscount: 0,
    inHouseCourtHourlyPrice: null,
    happyInHouseCoachDiscount: null,
    peakInHouseCoachDiscount: null
  });
});
it('edits an upcoming rule without losing its effective date or hour boundaries', () => {
  mocks.rules = [
    {
      id: 'rule',
      branchId: 'cemara',
      sport: 'PADEL',
      effectiveFrom: '2026-11-05T00:00:00Z',
      happyStart: 8,
      happyEnd: 16,
      peakStart: 16,
      peakEnd: 23
    }
  ];
  render(<TariffPeriodPage />);
  fireEvent.click(screen.getByText('Riwayat & Aturan Terjadwal'));
  fireEvent.click(screen.getByRole('button', { name: 'Edit Aturan' }));
  expect(screen.getByLabelText('Mulai Berlaku')).toHaveTextContent('05/11/2026');
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' }));
  expect(mocks.save).toHaveBeenCalledWith({
    sport: 'PADEL',
    happyAllDayDays: [],
    effectiveFrom: '2026-11-05',
    happyStart: 8,
    happyEnd: 16,
    peakStart: 16,
    peakEnd: 23,
    happyCoachDiscount: 0,
    peakCoachDiscount: 0,
    inHouseCourtHourlyPrice: null,
    happyInHouseCoachDiscount: null,
    peakInHouseCoachDiscount: null
  });
});
it('requires selecting a single branch before exposing an editable form', () => {
  mocks.branchId = null;
  render(<TariffPeriodPage />);
  expect(screen.getByText(/Pilih satu cabang/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Simpan Aturan Jam Tarif' })).toBeNull();
});
it('refuses backdating and never submits an invalid period copied from a server response', () => {
  mocks.rules = [
    {
      id: 'invalid',
      branchId: 'cemara',
      sport: 'PADEL',
      effectiveFrom: '2026-11-05',
      happyStart: 8,
      happyEnd: 17,
      peakStart: 16,
      peakEnd: 23
    }
  ];
  render(<TariffPeriodPage />);
  fireEvent.click(screen.getByText('Riwayat & Aturan Terjadwal'));
  fireEvent.click(screen.getByRole('button', { name: 'Edit Aturan' }));
  expect(screen.getByRole('alert')).toHaveTextContent('tumpang tindih');
  expect(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' })).toBeDisabled();
  expect(mocks.save).not.toHaveBeenCalled();
});

it('saves coaching court discounts for each hour band and disables them with zero', () => {
  render(<TariffPeriodPage />);
  fireEvent.change(screen.getByLabelText('Potongan Coach Club Happy Hour (Rp)'), {
    target: { value: '45000' }
  });
  fireEvent.change(screen.getByLabelText('Potongan Coach Club Peak Hour (Rp)'), {
    target: { value: '25000' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' }));
  expect(mocks.save).toHaveBeenCalledWith(
    expect.objectContaining({ sport: 'PADEL', happyCoachDiscount: 45000, peakCoachDiscount: 25000 })
  );
  fireEvent.change(screen.getByLabelText('Potongan Coach Club Happy Hour (Rp)'), {
    target: { value: '0' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' }));
  expect(mocks.save).toHaveBeenLastCalledWith(
    expect.objectContaining({ happyCoachDiscount: 0, peakCoachDiscount: 25000 })
  );
});
it('loads scheduled discount amounts for editing', () => {
  mocks.rules = [
    {
      id: 'rule',
      branchId: 'cemara',
      sport: 'PADEL',
      effectiveFrom: '2026-11-05',
      happyStart: 6,
      happyEnd: 15,
      peakStart: 15,
      peakEnd: 24,
      happyCoachDiscount: 35000,
      peakCoachDiscount: 20000
    }
  ];
  render(<TariffPeriodPage />);
  fireEvent.click(screen.getByText('Riwayat & Aturan Terjadwal'));
  fireEvent.click(screen.getByRole('button', { name: 'Edit Aturan' }));
  expect(screen.getByLabelText('Potongan Coach Club Happy Hour (Rp)')).toHaveValue(35000);
  expect(screen.getByLabelText('Potongan Coach Club Peak Hour (Rp)')).toHaveValue(20000);
});

it('shows a rupiah prefix and clears zero on focus while restoring zero when left empty', () => {
  render(<TariffPeriodPage />);
  const input = screen.getByLabelText('Potongan Coach Club Happy Hour (Rp)');
  expect(screen.getAllByText('Rp')).toHaveLength(2);
  expect(input).toHaveValue(0);
  fireEvent.focus(input);
  expect(input).toHaveValue(null);
  fireEvent.blur(input);
  expect(input).toHaveValue(0);
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: '25000' } });
  fireEvent.blur(input);
  expect(input).toHaveValue(25000);
});

it('saves selected full Happy Hour days and can turn them off', () => {
  render(<TariffPeriodPage />);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Sabtu' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Minggu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' }));
  expect(mocks.save).toHaveBeenLastCalledWith(expect.objectContaining({ happyAllDayDays: [6, 7] }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Sabtu' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Minggu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' }));
  expect(mocks.save).toHaveBeenLastCalledWith(expect.objectContaining({ happyAllDayDays: [] }));
});
it('edits a weekend rule without replacing its weekday hour boundaries', () => {
  vi.setSystemTime(new Date('2026-11-07T02:00:00Z'));
  mocks.rules = [
    {
      id: 'weekend',
      branchId: 'cemara',
      sport: 'PADEL',
      effectiveFrom: '2026-11-01',
      happyStart: 6,
      happyEnd: 15,
      peakStart: 15,
      peakEnd: 24,
      happyAllDayDays: [6, 7]
    }
  ];
  render(<TariffPeriodPage />);
  expect(screen.getByRole('checkbox', { name: 'Sabtu' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Minggu' })).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Gunakan Aturan Ini' }));
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' }));
  expect(mocks.save).toHaveBeenLastCalledWith(
    expect.objectContaining({
      happyStart: 6,
      happyEnd: 15,
      peakStart: 15,
      peakEnd: 24,
      happyAllDayDays: [6, 7]
    })
  );
});

it('keeps Padel and Tennis coaching amounts separate when editing and saving', () => {
  mocks.rules = [
    {
      id: 'padel',
      branchId: 'cemara',
      sport: 'PADEL',
      effectiveFrom: '2026-10-01',
      happyStart: 6,
      happyEnd: 15,
      peakStart: 15,
      peakEnd: 24,
      happyCoachDiscount: 50000,
      peakCoachDiscount: 100000,
      happyAllDayDays: [6, 7]
    },
    {
      id: 'tennis',
      branchId: 'cemara',
      sport: 'TENNIS',
      effectiveFrom: '2026-10-01',
      happyStart: 6,
      happyEnd: 15,
      peakStart: 15,
      peakEnd: 24,
      happyCoachDiscount: 25000,
      peakCoachDiscount: 40000,
      happyAllDayDays: []
    }
  ];
  render(<TariffPeriodPage />);
  expect(screen.getByRole('region', { name: 'Potongan coaching Padel' })).toBeInTheDocument();
  expect(screen.getByLabelText('Potongan Coach Club Happy Hour (Rp)')).toHaveValue(50000);
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Tarif & Potongan Tennis' }), {
    button: 0,
    ctrlKey: false
  });
  expect(screen.getByRole('region', { name: 'Potongan coaching Tennis' })).toBeInTheDocument();
  expect(screen.getByLabelText('Potongan Coach Club Happy Hour (Rp)')).toHaveValue(25000);
  expect(screen.getByLabelText('Potongan Coach Club Peak Hour (Rp)')).toHaveValue(40000);
  expect(screen.getByRole('checkbox', { name: 'Sabtu' })).not.toBeChecked();
  fireEvent.change(screen.getByLabelText('Potongan Coach Club Happy Hour (Rp)'), {
    target: { value: '30000' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' }));
  expect(mocks.save).toHaveBeenLastCalledWith(
    expect.objectContaining({
      sport: 'TENNIS',
      happyCoachDiscount: 30000,
      peakCoachDiscount: 40000,
      happyAllDayDays: []
    })
  );
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Tarif & Potongan Padel' }), {
    button: 0,
    ctrlKey: false
  });
  expect(screen.getByLabelText('Potongan Coach Club Happy Hour (Rp)')).toHaveValue(50000);
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' }));
  expect(mocks.save).toHaveBeenLastCalledWith(
    expect.objectContaining({
      sport: 'PADEL',
      happyCoachDiscount: 50000,
      peakCoachDiscount: 100000,
      happyAllDayDays: [6, 7]
    })
  );
});
it('only offers Padel tariff and coaching settings outside the tennis branch', () => {
  mocks.branchId = 's-parman';
  render(<TariffPeriodPage />);
  expect(screen.getByRole('tab', { name: 'Tarif & Potongan Padel' })).toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Tarif & Potongan Tennis' })).toBeNull();
});

it('saves independent club and in-house amounts and can restore legacy package rules', () => {
  render(<TariffPeriodPage />);
  fireEvent.change(screen.getByLabelText('Potongan Coach Club Happy Hour (Rp)'), {
    target: { value: '50000' }
  });
  fireEvent.click(screen.getByRole('checkbox', { name: /Gunakan harga lapangan fixed/ }));
  fireEvent.change(screen.getByLabelText('Harga akhir lapangan per jam (Rp)'), {
    target: { value: '250000' }
  });

  fireEvent.click(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' }));
  expect(mocks.save).toHaveBeenLastCalledWith(
    expect.objectContaining({
      happyCoachDiscount: 50000,
      peakCoachDiscount: 0,
      inHouseCourtHourlyPrice: 250000,
      happyInHouseCoachDiscount: null,
      peakInHouseCoachDiscount: null
    })
  );
  fireEvent.click(screen.getByRole('checkbox', { name: /Gunakan harga lapangan fixed/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' }));
  expect(mocks.save).toHaveBeenLastCalledWith(
    expect.objectContaining({
      happyCoachDiscount: 50000,
      inHouseCourtHourlyPrice: null,
      happyInHouseCoachDiscount: null,
      peakInHouseCoachDiscount: null
    })
  );
});
it('restores independent in-house amounts from scheduled history', () => {
  mocks.rules = [
    {
      id: 'future',
      branchId: 'cemara',
      sport: 'PADEL',
      effectiveFrom: '2026-11-02',
      happyStart: 6,
      happyEnd: 15,
      peakStart: 15,
      peakEnd: 24,
      happyCoachDiscount: 10000,
      inHouseCourtHourlyPrice: 250000
    }
  ];
  render(<TariffPeriodPage />);
  fireEvent.click(screen.getByText('Riwayat & Aturan Terjadwal'));
  fireEvent.click(screen.getByRole('button', { name: 'Edit Aturan' }));
  expect(screen.getByRole('checkbox', { name: /Gunakan harga lapangan fixed/ })).toBeChecked();
  expect(screen.getByLabelText('Harga akhir lapangan per jam (Rp)')).toHaveValue(250000);
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' }));
  expect(mocks.save).toHaveBeenLastCalledWith(
    expect.objectContaining({
      effectiveFrom: '2026-11-02',
      inHouseCourtHourlyPrice: 250000
    })
  );
});
