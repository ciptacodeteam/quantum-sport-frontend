import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import BookingCalendar from './BookingCalendar';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('applies the same grace limit to the alternate admin booking calendar', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2040-01-02T13:14:59+07:00'));
  const onSlotSelect = vi.fn();
  render(
    <BookingCalendar
      courts={[{ id: 'court', name: 'Court 1' }] as never}
      slots={
        [
          {
            date: '2040-01-02',
            slots: [
              {
                id: 'slot',
                courtId: 'court',
                startAt: '2040-01-02T13:00:00Z',
                endAt: '2040-01-02T14:00:00Z',
                isAvailable: true,
                price: 150000
              }
            ]
          }
        ] as never
      }
      selectedDate="2040-01-02"
      onDateChange={vi.fn()}
      selectedSlots={[]}
      onSlotSelect={onSlotSelect}
      isAdmin
    />
  );
  const row = screen.getByText('13:00').closest('tr')!;
  const button = within(row).getByRole('button');
  expect(button).toBeEnabled();
  fireEvent.click(button);
  expect(onSlotSelect).toHaveBeenCalledWith([
    expect.objectContaining({ slotId: 'slot', time: '13:00' })
  ]);
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(screen.queryByText('13:00')).toBeNull();
});
