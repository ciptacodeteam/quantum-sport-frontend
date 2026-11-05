import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ put: vi.fn() }));
vi.mock('@/lib/adminApi', () => ({ adminApi: { put: mocks.put } }));
vi.mock('@/lib/api', () => ({ api: {} }));
import { saveTariffPeriod } from './tariff-period';
const input = {
  sport: 'PADEL' as const,
  effectiveFrom: '2040-01-01',
  happyStart: 6,
  happyEnd: 15,
  peakStart: 15,
  peakEnd: 24,
  happyCoachDiscount: 50000,
  peakCoachDiscount: 100000
};
beforeEach(() => vi.clearAllMocks());
it('limits save request duration while preserving tariff and coaching amounts', async () => {
  mocks.put.mockResolvedValue({ data: { data: { id: 'saved' } } });
  expect(await saveTariffPeriod(input)).toEqual({ id: 'saved' });
  expect(mocks.put).toHaveBeenCalledWith('/tariff-periods', input, { timeout: 75000 });
});
it('returns an actionable timeout message instead of leaving an indefinitely pending request', async () => {
  mocks.put.mockRejectedValue({ code: 'ECONNABORTED' });
  await expect(saveTariffPeriod(input)).rejects.toThrow('Muat ulang aturan');
});
it('preserves non-timeout server validation errors', async () => {
  const error = { message: 'Tanggal tidak valid', status: 422 };
  mocks.put.mockRejectedValue(error);
  await expect(saveTariffPeriod(input)).rejects.toBe(error);
});
