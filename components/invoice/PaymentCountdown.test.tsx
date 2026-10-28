import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const expire = vi.hoisted(() => vi.fn());
vi.mock('@tanstack/react-query', () => ({ useMutation: () => ({ mutate: expire }) }));
import PaymentCountdown from './PaymentCountdown';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  expire.mockReset();
});
it('expires a pending invoice once when the countdown ends', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-23T00:00:00Z'));
  render(
    <PaymentCountdown dueDate="2026-10-23T00:00:02Z" status="PENDING" invoiceId="invoice-test" />
  );
  expect(screen.getByText('00:02')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(5000));
  expect(expire).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Batas waktu pembayaran berakhir')).toBeInTheDocument();
});
it('never expires an already paid invoice', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-23T00:00:00Z'));
  const { container } = render(
    <PaymentCountdown dueDate="2026-10-22T00:00:00Z" status="PAID" invoiceId="invoice-test" />
  );
  act(() => vi.advanceTimersByTime(5000));
  expect(expire).not.toHaveBeenCalled();
  expect(container).toBeEmptyDOMElement();
});
