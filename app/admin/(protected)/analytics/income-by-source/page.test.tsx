import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  range: vi.fn(),
  export: vi.fn(),
  success: vi.fn(),
  error: vi.fn()
}));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: (options: any) => {
    mocks.query(options);
    return { data: undefined, isLoading: false };
  }
}));
vi.mock('@/components/ui/date-range-input', () => ({
  default: ({ value, onValueChange }: any) => {
    mocks.range(value, onValueChange);
    return null;
  }
}));
vi.mock('@/components/admin/analytics/IncomeBySourceSection', () => ({ default: () => null }));
vi.mock('@/api/admin/analytics', () => ({ exportIncomeBySourceApi: mocks.export }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));
import IncomeBySourcePage from './page';

const originalTZ = process.env.TZ;
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.restoreAllMocks();
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

it('keeps a single selected date when returning to Income and after a reload', () => {
  const { unmount } = render(<IncomeBySourcePage />);
  const selected = new Date(2026, 10, 3);
  act(() => mocks.range.mock.lastCall?.[1]({ from: selected }));
  expect(mocks.range.mock.lastCall?.[0]).toEqual({ from: selected, to: selected });
  const queryKey = mocks.query.mock.lastCall?.[0].queryKey;
  unmount();
  render(<IncomeBySourcePage />);
  expect(mocks.range.mock.lastCall?.[0]).toEqual({ from: selected, to: selected });
  expect(mocks.query.mock.lastCall?.[0].queryKey).toEqual(queryKey);
  expect(mocks.query.mock.lastCall?.[0].enabled).toBe(true);
});

it('falls back to the initial month if saved dates are invalid', () => {
  sessionStorage.setItem('income-by-source-date', '{"from":"invalid"}');
  render(<IncomeBySourcePage />);
  expect(mocks.range.mock.lastCall?.[0].from.getDate()).toBe(1);
  expect(mocks.query.mock.lastCall?.[0].enabled).toBe(true);
});

it('exports the selected day in WIB and prevents duplicate downloads until the request finishes', async () => {
  let finish!: (blob: Blob) => void;
  mocks.export.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:report')
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  process.env.TZ = 'Asia/Jakarta';
  render(<IncomeBySourcePage />);
  act(() => mocks.range.mock.lastCall?.[1]({ from: new Date('2026-11-12T00:00:00+07:00') }));
  fireEvent.click(screen.getByRole('button', { name: 'Export Excel' }));
  expect(mocks.export).toHaveBeenCalledWith({
    startDate: '2026-11-11T17:00:00.000Z',
    endDate: '2026-11-12T16:59:59.999Z'
  });
  fireEvent.click(screen.getByRole('button', { name: 'Mengekspor…' }));
  expect(mocks.export).toHaveBeenCalledTimes(1);
  await act(async () => finish(new Blob(['xlsx'])));
  await waitFor(() => expect(download).toHaveBeenCalledOnce());
  const link = download.mock.instances[0] as unknown as HTMLAnchorElement;
  expect(link.download).toBe('income-by-source-2026-11-12-2026-11-12.xlsx');
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:report');
  expect(mocks.success).toHaveBeenCalledOnce();
  expect(screen.getByRole('button', { name: 'Export Excel' })).toBeEnabled();
});
it('shows an error and lets the user retry when export fails', async () => {
  mocks.export.mockRejectedValue(new Error('network failed'));
  render(<IncomeBySourcePage />);
  fireEvent.click(screen.getByRole('button', { name: 'Export Excel' }));
  await waitFor(() =>
    expect(mocks.error).toHaveBeenCalledWith('Export Excel gagal. Silakan coba lagi.')
  );
  expect(screen.getByRole('button', { name: 'Export Excel' })).toBeEnabled();
});
