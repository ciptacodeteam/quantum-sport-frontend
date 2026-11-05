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
    effectiveFrom: '2026-11-02',
    happyStart: 6,
    happyEnd: 15,
    peakStart: 15,
    peakEnd: 24,
    happyCoachDiscount: 0,
    peakCoachDiscount: 0
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
  fireEvent.click(screen.getByRole('button', { name: 'Edit Aturan' }));
  expect(screen.getByLabelText('Mulai Berlaku')).toHaveTextContent('05/11/2026');
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' }));
  expect(mocks.save).toHaveBeenCalledWith({
    sport: 'PADEL',
    effectiveFrom: '2026-11-05',
    happyStart: 8,
    happyEnd: 16,
    peakStart: 16,
    peakEnd: 23,
    happyCoachDiscount: 0,
    peakCoachDiscount: 0
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
  fireEvent.click(screen.getByRole('button', { name: 'Edit Aturan' }));
  expect(screen.getByRole('alert')).toHaveTextContent('tumpang tindih');
  expect(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' })).toBeDisabled();
  expect(mocks.save).not.toHaveBeenCalled();
});

it('saves coaching court discounts for each hour band and disables them with zero', () => {
  render(<TariffPeriodPage />);
  fireEvent.change(screen.getByLabelText('Potongan Coaching Happy Hour (Rp)'), {
    target: { value: '45000' }
  });
  fireEvent.change(screen.getByLabelText('Potongan Coaching Peak Hour (Rp)'), {
    target: { value: '25000' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Aturan Jam Tarif' }));
  expect(mocks.save).toHaveBeenCalledWith(
    expect.objectContaining({ sport: 'PADEL', happyCoachDiscount: 45000, peakCoachDiscount: 25000 })
  );
  fireEvent.change(screen.getByLabelText('Potongan Coaching Happy Hour (Rp)'), {
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
  fireEvent.click(screen.getByRole('button', { name: 'Edit Aturan' }));
  expect(screen.getByLabelText('Potongan Coaching Happy Hour (Rp)')).toHaveValue(35000);
  expect(screen.getByLabelText('Potongan Coaching Peak Hour (Rp)')).toHaveValue(20000);
});
