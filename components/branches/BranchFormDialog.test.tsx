import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import BranchFormDialog from './BranchFormDialog';
const branch = {
  id: 'cemara',
  name: 'Black Padel Cemara',
  address: 'Jalan Cemara No. 51',
  mapsUrl: 'https://maps.google.com/cemara',
  isActive: false
};
beforeEach(() => {
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
it('loads existing branch details and preserves its inactive status when saved', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <BranchFormDialog open branch={branch} busy={false} error="" onClose={vi.fn()} onSave={save} />
  );
  expect(screen.getByLabelText('Nama cabang')).toHaveValue(branch.name);
  expect(screen.getByLabelText('Alamat lengkap')).toHaveValue(branch.address);
  expect(screen.getByRole('checkbox', { name: 'Cabang aktif' })).not.toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Simpan cabang' }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith({
      name: branch.name,
      address: branch.address,
      mapsUrl: branch.mapsUrl,
      isActive: false
    })
  );
});
it('submits a new active branch with no optional maps link', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <BranchFormDialog open branch={null} busy={false} error="" onClose={vi.fn()} onSave={save} />
  );
  fireEvent.change(screen.getByLabelText('Nama cabang'), { target: { value: '  Cabang Baru  ' } });
  fireEvent.change(screen.getByLabelText('Alamat lengkap'), {
    target: { value: '  Jalan Baru No. 1  ' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan cabang' }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith({
      name: 'Cabang Baru',
      address: 'Jalan Baru No. 1',
      mapsUrl: null,
      isActive: true
    })
  );
});
it('shows save errors and disables duplicate submissions while saving', () => {
  render(
    <BranchFormDialog
      open
      branch={branch}
      busy
      error="Cabang belum dapat disimpan."
      onClose={vi.fn()}
      onSave={vi.fn()}
    />
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Cabang belum dapat disimpan.');
  expect(screen.getByRole('button', { name: 'Simpan cabang' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Batal' })).toBeDisabled();
});
