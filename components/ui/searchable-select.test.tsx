import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SearchableSelect } from './searchable-select';
beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const options = [
  { value: 'andi', label: 'Coach Andi Cobra', description: 'Paket 5 jam · Rp4.500.000' },
  { value: 'awam', label: 'Coach Awam Bali', description: 'Paket 10 jam · Rp8.000.000' }
];
function Harness({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState('');
  return (
    <>
      <label htmlFor="coach">Coach in-house</label>
      <SearchableSelect
        id="coach"
        value={value}
        onValueChange={setValue}
        options={options}
        disabled={disabled}
        searchPlaceholder="Cari nama coach..."
        placeholder="Pilih coach"
      />
    </>
  );
}
it('filters coach names, selects the result and resets the search when reopened', async () => {
  render(<Harness />);
  const trigger = screen.getByRole('combobox', { name: 'Coach in-house' });
  fireEvent.click(trigger);
  fireEvent.change(await screen.findByPlaceholderText('Cari nama coach...'), {
    target: { value: 'awam' }
  });
  await waitFor(() =>
    expect(screen.queryByRole('option', { name: /Andi/ })).not.toBeInTheDocument()
  );
  fireEvent.click(screen.getByRole('option', { name: /Awam/ }));
  expect(trigger).toHaveTextContent('Coach Awam Bali');
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(trigger);
  expect(await screen.findByPlaceholderText('Cari nama coach...')).toHaveValue('');
  expect(screen.getByRole('option', { name: /Andi/ })).toBeInTheDocument();
});
it('can search a package by its description and shows a clear empty result', async () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole('combobox', { name: 'Coach in-house' }));
  const search = await screen.findByPlaceholderText('Cari nama coach...');
  fireEvent.change(search, { target: { value: '10 jam' } });
  expect(screen.getByRole('option', { name: /Awam/ })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: /Andi/ })).not.toBeInTheDocument();
  fireEvent.change(search, { target: { value: 'tidak-ada-coach' } });
  expect(await screen.findByText('Tidak ada hasil yang sesuai.')).toBeInTheDocument();
});
it('supports keyboard selection', async () => {
  render(<Harness />);
  const trigger = screen.getByRole('combobox', { name: 'Coach in-house' });
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  const search = await screen.findByPlaceholderText('Cari nama coach...');
  fireEvent.change(search, { target: { value: 'awam' } });
  fireEvent.keyDown(search, { key: 'ArrowDown' });
  fireEvent.keyDown(search, { key: 'Enter' });
  await waitFor(() => expect(trigger).toHaveTextContent('Coach Awam Bali'));
});
it('does not open a disabled selector', () => {
  render(<Harness disabled />);
  expect(screen.getByRole('combobox', { name: 'Coach in-house' })).toBeDisabled();
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});
