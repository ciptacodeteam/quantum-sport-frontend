import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { useRegisterStore } from '@/stores/useRegisterStore';
const mocks = vi.hoisted(() => ({ register: vi.fn(), push: vi.fn(), error: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('./AuthFormHeader', () => ({ default: ({ title }: any) => <h1>{title}</h1> }));
vi.mock('sonner', () => ({ toast: { error: mocks.error } }));
vi.mock('@/mutations/auth', () => ({
  registerMutationOptions: (options: any) => ({ mutationFn: mocks.register, ...options })
}));
import RegistrationPasswordForm from './RegistrationPasswordForm';
beforeEach(() => {
  vi.resetAllMocks();
  usePhoneStore.getState().setPhone('+6281234567890');
  usePhoneStore.getState().setRequestId('verified-request');
  usePhoneStore.getState().setRegistrationMode('activate');
  useRegisterStore
    .getState()
    .setRegisterData({
      firstName: 'Andry',
      lastName: 'Wijaya',
      name: 'Andry Wijaya',
      phone: '+6281234567890'
    });
});
afterEach(() => {
  cleanup();
  usePhoneStore.getState().setPhone(null);
  useRegisterStore.getState().clear();
});
function submit() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RegistrationPasswordForm />
    </QueryClientProvider>
  );
  fireEvent.change(screen.getByLabelText('Password baru'), { target: { value: 'Password123!' } });
  fireEvent.change(screen.getByLabelText('Konfirmasi password'), {
    target: { value: 'Password123!' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Aktifkan akun' }));
}
it('cannot set a password before receiving the verified registration grant', async () => {
  submit();
  await waitFor(() => expect(mocks.error).toHaveBeenCalled());
  expect(mocks.register).not.toHaveBeenCalled();
});
it('sends the verified grant, name fields and password together to activate the original account', async () => {
  usePhoneStore.getState().setRegistrationToken('a'.repeat(64));
  mocks.register.mockResolvedValue({ success: true, data: { token: 'token' } });
  submit();
  await waitFor(() =>
    expect(mocks.register).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Andry',
        lastName: 'Wijaya',
        name: 'Andry Wijaya',
        phone: '+6281234567890',
        requestId: 'verified-request',
        registrationToken: 'a'.repeat(64),
        password: 'Password123!'
      }),
      expect.anything()
    )
  );
  await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/'));
  expect(usePhoneStore.getState().registrationToken).toBeNull();
  expect(useRegisterStore.getState().registerData).toBeNull();
});
