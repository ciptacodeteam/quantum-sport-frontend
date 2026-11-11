import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import BookingServiceSessionPicker from './BookingServiceSessionPicker';
afterEach(cleanup);
const sessions = [12, 13].map((hour) => ({
  id: `slot-${hour}`,
  date: '2040-01-02',
  timeSlot: `${hour}:00 - ${hour + 1}:00`,
  courtName: 'Court 2',
  selected: hour === 12
}));
it('distinguishes the opened hour from applied coaches and navigates without changing the applied status', () => {
  const change = vi.fn();
  const { rerender } = render(
    <BookingServiceSessionPicker
      sessions={sessions}
      value="slot-13"
      onChange={change}
      serviceLabel="Coach"
    />
  );
  const applied = screen.getByRole('button', { name: 'Court 2 · 2040-01-02 · 12:00 - 13:00' });
  const opened = screen.getByRole('button', { name: 'Court 2 · 2040-01-02 · 13:00 - 14:00' });
  expect(applied).toHaveAttribute('aria-pressed', 'false');
  expect(within(applied).getByText('Coach diterapkan')).toBeInTheDocument();
  expect(within(applied).getByText('Buka jam ini')).toBeInTheDocument();
  expect(opened).toHaveAttribute('aria-pressed', 'true');
  expect(within(opened).getByText('Belum ada coach')).toBeInTheDocument();
  expect(within(opened).getByText('Sedang dibuka')).toBeInTheDocument();
  expect(screen.getByText('1 dari 2 jam · coach diterapkan')).toBeInTheDocument();
  fireEvent.click(applied);
  expect(change).toHaveBeenCalledWith('slot-12');
  rerender(
    <BookingServiceSessionPicker
      sessions={sessions}
      value="slot-12"
      onChange={change}
      serviceLabel="Coach"
      disabled
    />
  );
  fireEvent.click(opened);
  expect(change).toHaveBeenCalledTimes(1);
  expect(applied).toBeDisabled();
});
