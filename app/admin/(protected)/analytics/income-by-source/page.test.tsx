import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ query: vi.fn(), range: vi.fn() }));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: (options: any) => {
    mocks.query(options);
    return { data: undefined, isLoading: false };
  }
}));
vi.mock('@/components/ui/date-range-input', () => ({
  default: ({ value }: any) => {
    mocks.range(value);
    return null;
  }
}));
vi.mock('@/components/admin/analytics/IncomeBySourceSection', () => ({ default: () => null }));
import IncomeBySourcePage from './page';

const originalTZ = process.env.TZ;
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});
it('defaults to the whole current month, matching Court Performance and including the final day in WIB', () => {
  process.env.TZ = 'Asia/Jakarta';
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-03T12:00:00+07:00'));
  render(<IncomeBySourcePage />);
  expect(mocks.range.mock.lastCall?.[0]).toEqual({
    from: new Date('2026-11-01T00:00:00+07:00'),
    to: new Date('2026-11-30T23:59:59.999+07:00')
  });
  expect(mocks.query.mock.lastCall?.[0].queryKey).toEqual([
    'admin',
    'analytics',
    'income-by-source',
    '2026-10-31T17:00:00.000Z',
    '2026-11-30T16:59:59.999Z'
  ]);
});
