import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DatePickerModal, DatePickerModalTrigger } from './date-picker-modal';
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 31, 10));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('limits month and year navigation to the actual rolling boundary', () => {
  render(
    <DatePickerModal
      value={new Date(2026, 9, 31)}
      minDate={new Date(2026, 9, 31)}
      maxDate={new Date(2026, 10, 30)}
    >
      <DatePickerModalTrigger>
        <button>Kalender</button>
      </DatePickerModalTrigger>
    </DatePickerModal>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Kalender' }));
  const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
  const month = selects.find((el) => el.options.length === 2)!;
  expect(month).toBeDefined();
  expect([...month.options].map((option) => option.value)).toEqual(['9', '10']);
  const year = selects.find((el) => el !== month)!;
  expect([...year.options].map((option) => option.value)).toEqual(['2026']);
});
