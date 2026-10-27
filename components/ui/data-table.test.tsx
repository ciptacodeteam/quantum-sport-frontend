import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DataTable } from './data-table';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/admin/kelola-pemesanan/lapangan',
  useSearchParams: () => new URLSearchParams()
}));
const columns = [
  { accessorKey: 'invoice', header: 'Invoice' },
  { accessorKey: 'expires', header: 'Kedaluwarsa' }
];
const data = [{ invoice: 'INV-001', expires: '01 Nov 2026' }];
const key = 'quantum:booking-columns:PADEL';
const table = (storageKey = key) => (
  <DataTable
    columns={columns}
    data={data}
    enableRowSelection={false}
    enableGlobalSearch={false}
    enablePagination={false}
    enablePageSize={false}
    columnVisibilityLabel="Kolom"
    columnVisibilityStorageKey={storageKey}
  />
);
async function toggleExpiry() {
  fireEvent.keyDown(screen.getByRole('button', { name: 'Kolom' }), { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Kedaluwarsa' }));
}
beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('starts with all columns and keeps unchecked columns hidden after a refresh/remount', async () => {
  const first = render(table());
  expect(screen.getByRole('columnheader', { name: 'Kedaluwarsa' })).toBeInTheDocument();
  await toggleExpiry();
  expect(screen.queryByRole('columnheader', { name: 'Kedaluwarsa' })).not.toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem(key)!)).toMatchObject({ expires: false });
  first.unmount();
  render(table());
  expect(screen.queryByRole('columnheader', { name: 'Kedaluwarsa' })).not.toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem(key)!)).toMatchObject({ expires: false });
  await toggleExpiry();
  expect(screen.getByRole('columnheader', { name: 'Kedaluwarsa' })).toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem(key)!)).toMatchObject({ expires: true });
});
it('restores preferences separately for padel and tennis when changing tables', () => {
  window.localStorage.setItem(key, JSON.stringify({ expires: false }));
  const view = render(table());
  expect(screen.queryByRole('columnheader', { name: 'Kedaluwarsa' })).not.toBeInTheDocument();
  view.rerender(table('quantum:booking-columns:TENNIS'));
  expect(screen.getByRole('columnheader', { name: 'Kedaluwarsa' })).toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem(key)!)).toEqual({ expires: false });
  view.rerender(table());
  expect(screen.queryByRole('columnheader', { name: 'Kedaluwarsa' })).not.toBeInTheDocument();
});
it('uses visible defaults when saved preferences are malformed', () => {
  window.localStorage.setItem(key, '{broken json');
  render(table());
  expect(screen.getByRole('columnheader', { name: 'Kedaluwarsa' })).toBeInTheDocument();
});
it('remains usable when browser storage is blocked', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  expect(() => render(table())).not.toThrow();
  expect(screen.getByRole('columnheader', { name: 'Kedaluwarsa' })).toBeInTheDocument();
});
