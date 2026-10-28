import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import useAuthModalStore from '@/stores/useAuthModalStore';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null, isPending: false })
}));
vi.mock('@/queries/profile', () => ({ profileQueryOptions: {} }));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn() })
}));
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) => (open ? children : null),
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>
}));
vi.mock('@/components/forms/auth/LoginForm', () => ({
  default: ({ onRegisterClick }: { onRegisterClick: () => void }) => (
    <div>
      Login form<button onClick={onRegisterClick}>Daftar dari login</button>
    </div>
  )
}));
vi.mock('@/components/forms/auth/RegisterForm', () => ({
  default: ({
    onRegisterSuccess,
    onLoginClick
  }: {
    onRegisterSuccess: () => void;
    onLoginClick: () => void;
  }) => (
    <div>
      Register form
      <button onClick={onRegisterSuccess}>Lanjut OTP</button>
      <button onClick={onLoginClick}>Kembali login</button>
    </div>
  )
}));
vi.mock('@/components/forms/auth/VerifyPhoneOtpForm', () => ({
  default: ({ type }: { type: string }) => <div>OTP {type}</div>
}));
vi.mock('@/components/forms/auth/ResetPasswordForm', () => ({
  default: () => <div>Reset password</div>
}));

import AuthModal from './AuthModal';

describe('header auth entry points', () => {
  beforeEach(() => useAuthModalStore.getState().close());
  afterEach(() => {
    cleanup();
    useAuthModalStore.getState().close();
  });

  it('opens registration directly without showing the login form', () => {
    useAuthModalStore.getState().openRegister();
    render(<AuthModal />);
    expect(screen.getByText('Register form')).toBeInTheDocument();
    expect(screen.queryByText('Login form')).not.toBeInTheDocument();
  });

  it('uses registration OTP when Daftar was opened directly', () => {
    useAuthModalStore.getState().openRegister();
    render(<AuthModal />);
    fireEvent.click(screen.getByText('Lanjut OTP'));
    expect(screen.getByText('OTP register')).toBeInTheDocument();
    expect(screen.queryByText('Register form')).not.toBeInTheDocument();
    expect(screen.queryByText('Login form')).not.toBeInTheDocument();
  });

  it('switches between login and registration and reopens login correctly', () => {
    useAuthModalStore.getState().open();
    render(<AuthModal />);
    expect(screen.getByText('Login form')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Daftar dari login'));
    expect(screen.getByText('Register form')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Kembali login'));
    expect(screen.getByText('Login form')).toBeInTheDocument();
    act(() => {
      useAuthModalStore.getState().close();
      useAuthModalStore.getState().open();
    });
    expect(screen.getByText('Login form')).toBeInTheDocument();
  });
});
