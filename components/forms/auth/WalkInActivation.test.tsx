import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { useRegisterStore } from '@/stores/useRegisterStore';
const mocks = vi.hoisted(() => ({
  check: vi.fn(),
  login: vi.fn(),
  forgot: vi.fn(),
  send: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn()
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh })
}));
vi.mock('./AuthFormHeader', () => ({
  default: ({ title, description }: any) => (
    <>
      <h1>{title}</h1>
      <p>{description}</p>
    </>
  )
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/mutations/auth', () => ({
  checkAccountMutationOptions: (options: any) => ({ mutationFn: mocks.check, ...options }),
  loginMutationOptions: (options: any) => ({ mutationFn: mocks.login, ...options }),
  forgotPasswordMutationOptions: (options: any) => ({ mutationFn: mocks.forgot, ...options })
}));
vi.mock('@/mutations/phone', () => ({
  sendPhoneOtpMutationOptions: (options: any) => ({ mutationFn: mocks.send, ...options })
}));
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
function mount(child: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  render(<QueryClientProvider client={client}>{child}</QueryClientProvider>);
}
beforeEach(() => {
  vi.resetAllMocks();
  usePhoneStore.getState().setPhone(null);
  useRegisterStore.getState().clear();
  mocks.send.mockResolvedValue({ data: { requestId: 'registration-request' } });
});
afterEach(() => {
  cleanup();
  usePhoneStore.getState().setPhone(null);
  useRegisterStore.getState().clear();
});
it('routes a walk-in from login to activation with its normalized WhatsApp number', async () => {
  const register = vi.fn();
  mocks.check.mockResolvedValue({
    data: { phone: '+6281234567890', exists: false, nextAction: 'ACTIVATE' }
  });
  mount(<LoginForm onRegisterClick={register} />);
  fireEvent.change(screen.getByLabelText('Nomor WhatsApp'), { target: { value: '081234567890' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await waitFor(() => expect(register).toHaveBeenCalledOnce());
  expect(usePhoneStore.getState()).toMatchObject({
    phone: '+6281234567890',
    registrationMode: 'activate'
  });
  expect(mocks.login).not.toHaveBeenCalled();
  expect(screen.queryByLabelText('Password')).toBeNull();
});
it('keeps an established account in password login and does not route wrong passwords to registration', async () => {
  const register = vi.fn();
  mocks.check.mockResolvedValue({
    data: { phone: '+6281234567890', exists: true, nextAction: 'LOGIN' }
  });
  mocks.login.mockRejectedValue({ message: 'Password salah' });
  mount(<LoginForm onRegisterClick={register} />);
  fireEvent.change(screen.getByLabelText('Nomor WhatsApp'), { target: { value: '81234567890' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByLabelText('Password');
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Login' }));
  await waitFor(() =>
    expect(mocks.login).toHaveBeenCalledWith(
      { phone: '+6281234567890', password: 'wrong-password' },
      expect.anything()
    )
  );
  expect(register).not.toHaveBeenCalled();
});
it('handles activation required by the server after the account check', async () => {
  const register = vi.fn();
  mocks.check.mockResolvedValue({ data: { phone: '+6281234567890', exists: true } });
  mocks.login.mockRejectedValue({ errors: { nextAction: 'ACTIVATE', phone: '+6281234567890' } });
  mount(<LoginForm onRegisterClick={register} />);
  fireEvent.change(screen.getByLabelText('Nomor WhatsApp'), { target: { value: '81234567890' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.change(await screen.findByLabelText('Password'), { target: { value: 'old-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Login' }));
  await waitFor(() => expect(register).toHaveBeenCalledOnce());
  expect(usePhoneStore.getState().registrationMode).toBe('activate');
});
function fillNames(lastName = 'Wijaya') {
  fireEvent.change(screen.getByLabelText('Nama depan'), { target: { value: 'Andry' } });
  fireEvent.change(screen.getByLabelText('Nama belakang (opsional)'), {
    target: { value: lastName }
  });
}
it('collects separate names for activation and sends only the phone and OTP purpose before verification', async () => {
  const sent = vi.fn();
  usePhoneStore.getState().setPhone('+6281234567890');
  usePhoneStore.getState().setRegistrationMode('activate');
  mount(<RegisterForm onRegisterSuccess={sent} />);
  expect(screen.getByRole('heading', { name: 'Aktivasi akun walk-in' })).toBeInTheDocument();
  expect(screen.getByLabelText('Nomor WhatsApp')).toHaveValue('81234567890');
  fillNames();
  fireEvent.click(screen.getByRole('button', { name: 'Lanjut verifikasi WhatsApp' }));
  await waitFor(() => expect(sent).toHaveBeenCalledOnce());
  expect(mocks.send).toHaveBeenCalledWith(
    { phone: '+6281234567890', purpose: 'REGISTER' },
    expect.anything()
  );
  expect(useRegisterStore.getState().registerData).toMatchObject({
    name: 'Andry Wijaya',
    firstName: 'Andry',
    lastName: 'Wijaya',
    phone: '+6281234567890'
  });
  expect(usePhoneStore.getState().requestId).toBe('registration-request');
  expect(screen.queryByLabelText('Password')).toBeNull();
  expect(useRegisterStore.getState().registerData).not.toHaveProperty('password');
});
it('supports a single-word name and returns existing active accounts to login', async () => {
  const login = vi.fn();
  mocks.send.mockRejectedValue({ errors: { nextAction: 'LOGIN' } });
  mount(<RegisterForm onLoginClick={login} />);
  fillNames('');
  fireEvent.change(screen.getByLabelText('Nomor WhatsApp'), { target: { value: '81234567890' } });
  fireEvent.click(screen.getByRole('button', { name: 'Register' }));
  await waitFor(() => expect(login).toHaveBeenCalledOnce());
  expect(useRegisterStore.getState().registerData?.name).toBe('Andry');
});
