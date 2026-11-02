import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import useAuthStore from '@/stores/useAuthStore';

const mocks = vi.hoisted(() => ({ change: vi.fn(), replace: vi.fn(), clearCookie: vi.fn() }));
vi.mock('@/api/admin/auth', () => ({ changePasswordApi: mocks.change }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock('@/lib/admin-session', () => ({ clearAdminSessionCookie: mocks.clearCookie }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import RequiredPasswordChange from './RequiredPasswordChange';

beforeEach(() => {
  vi.resetAllMocks();
  useAuthStore.getState().setAuth(true);
});
afterEach(() => cleanup());

function submit(password: string) {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <RequiredPasswordChange />
    </QueryClientProvider>
  );
  fireEvent.change(screen.getByLabelText('Kata sandi sementara'), {
    target: { value: 'temporary-password' }
  });
  fireEvent.change(screen.getByLabelText('Kata sandi baru'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Konfirmasi kata sandi baru'), {
    target: { value: password }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan kata sandi baru' }));
}

it('changes the temporary password and requires a fresh login', async () => {
  mocks.change.mockResolvedValue({ success: true });
  submit('NewPrivatePassword123!');
  await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/admin/auth/login'));
  expect(mocks.change.mock.calls[0][0]).toEqual({
    currentPassword: 'temporary-password',
    newPassword: 'NewPrivatePassword123!',
    confirmNewPassword: 'NewPrivatePassword123!'
  });
  expect(mocks.clearCookie).toHaveBeenCalled();
  expect(useAuthStore.getState().isAuth).toBe(false);
});

it('rejects a short replacement password before calling the API', async () => {
  submit('short123');
  await screen.findByText('Gunakan minimal 12 karakter.');
  expect(mocks.change).not.toHaveBeenCalled();
});
