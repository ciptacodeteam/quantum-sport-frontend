import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DateRangeInput from './date-range-input';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
afterEach(cleanup);

const value = { from: new Date(2026, 8, 10), to: new Date(2026, 8, 20) };

function show(props: Partial<React.ComponentProps<typeof DateRangeInput>> = {}) {
  const onValueChange = vi.fn();
  render(<DateRangeInput value={value} onValueChange={onValueChange} {...props} />);
  fireEvent.click(screen.getByRole('button', { name: /^Date range:/ }));
  return onValueChange;
}

const day = (name: RegExp) => screen.getByRole('button', { name });

describe('date range input', () => {
  it('applies a preset immediately and closes the calendar', () => {
    const onChange = show();
    fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const range = onChange.mock.calls[0][0];
    expect(Math.round((range.to.getTime() - range.from.getTime()) / 86400000)).toBe(6);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uses one calendar without duplicate date inputs or confirmation buttons', () => {
    show();
    expect(screen.getAllByRole('grid')).toHaveLength(1);
    expect(document.querySelector('input[type="date"]')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Apply range' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Date range:/ })).toHaveTextContent(
      '10 — 20 Sep 2026'
    );
  });

  it('waits for two calendar clicks and normalizes an end date before the start', () => {
    const onChange = show();
    fireEvent.click(day(/September 14th, 2026/));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Select end date')).toBeInTheDocument();
    fireEvent.click(day(/September 11th, 2026/));
    expect(onChange).toHaveBeenCalledWith({
      from: new Date(2026, 8, 11),
      to: new Date(2026, 8, 14)
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('discards an incomplete range when dismissed', () => {
    const onChange = show();
    fireEvent.click(day(/September 14th, 2026/));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /^Date range:/ }));
    expect(screen.getByText('Select start date')).toBeInTheDocument();
    expect(day(/September 10th, 2026/)).toHaveAttribute('data-range-start', 'true');
  });

  it('supports a single day and respects date bounds at day precision', () => {
    const onChange = show({
      minDate: new Date(2026, 8, 10, 15),
      maxDate: new Date(2026, 8, 20, 15)
    });
    expect(day(/September 9th, 2026/)).toBeDisabled();
    expect(day(/September 21st, 2026/)).toBeDisabled();
    expect(day(/September 10th, 2026/)).toBeEnabled();
    fireEvent.click(day(/September 10th, 2026/));
    fireEvent.click(day(/September 10th, 2026/));
    expect(onChange).toHaveBeenCalledWith({
      from: new Date(2026, 8, 10),
      to: new Date(2026, 8, 10)
    });
  });

  it('lets the user select across months using calendar navigation', () => {
    const onChange = show();
    fireEvent.click(day(/September 28th, 2026/));
    fireEvent.click(screen.getByRole('button', { name: 'Go to the Next Month' }));
    fireEvent.click(day(/October 3rd, 2026/));
    expect(onChange).toHaveBeenCalledWith({
      from: new Date(2026, 8, 28),
      to: new Date(2026, 9, 3)
    });
  });

  it('does not repeat adjacent-month dates when two months are explicitly requested', () => {
    show({ numberOfMonths: 2 });
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /September 27th, 2026/ })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /October 1st, 2026/ })).toHaveLength(1);
  });
});
