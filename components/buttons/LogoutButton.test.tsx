import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock('@/mutations/auth', () => ({ logoutMutationOptions: () => ({}) }));
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: mocks.mutate, isPending: false }),
  useQueryClient: () => ({ clear: vi.fn() })
}));
import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog';
import LogoutButton from './LogoutButton';
beforeEach(() => mocks.mutate.mockReset());
afterEach(cleanup);
const openConfirmation = () => {
  render(
    <ConfirmDialogProvider>
      <LogoutButton />
    </ConfirmDialogProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
  return screen.getByRole('dialog');
};
it('does not log out until the dialog is confirmed', async () => {
  const dialog = openConfirmation();
  expect(within(dialog).getByText('Keluar dari akun?')).toBeInTheDocument();
  expect(mocks.mutate).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Logout' }));
  await waitFor(() => expect(mocks.mutate).toHaveBeenCalledOnce());
});
it('keeps the session when the user cancels', async () => {
  const dialog = openConfirmation();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Batal' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(mocks.mutate).not.toHaveBeenCalled();
});
it('keeps the session when the dialog is dismissed', async () => {
  const dialog = openConfirmation();
  fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(mocks.mutate).not.toHaveBeenCalled();
});
