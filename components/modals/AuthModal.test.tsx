import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import useAuthModalStore from '@/stores/useAuthModalStore';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { useRegisterStore } from '@/stores/useRegisterStore';

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
  default: ({
    onRegisterClick,
    openVerifyPhoneOtpModal
  }: {
    onRegisterClick: () => void;
    openVerifyPhoneOtpModal: () => void;
  }) => (
    <div>
      Login form<button onClick={onRegisterClick}>Daftar dari login</button>
      <button onClick={openVerifyPhoneOtpModal}>Lupa password</button>
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
  default: ({ type, onVerifySuccess }: { type: string; onVerifySuccess: () => void }) => (
    <div>
      OTP {type}
      <button
        onClick={() => {
          usePhoneStore.getState().setRegistrationToken('verified-grant');
          onVerifySuccess();
        }}
      >
        OTP terverifikasi
      </button>
    </div>
  )
}));
vi.mock('@/components/forms/auth/RegistrationPasswordForm', () => ({
  default: () => <div>Buat password akun</div>
}));
vi.mock('@/components/forms/auth/ResetPasswordForm', () => ({
  default: () => <div>Reset password</div>
}));

import AuthModal from './AuthModal';

describe('header auth entry points', () => {
  beforeEach(() => {
    useAuthModalStore.getState().close();
    usePhoneStore.getState().setPhone(null);
    useRegisterStore.getState().clear();
  });
  afterEach(() => {
    cleanup();
    useAuthModalStore.getState().close();
    usePhoneStore.getState().setPhone(null);
    useRegisterStore.getState().clear();
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

  it('uses reset-specific OTP verification even after a registration attempt', () => {
    useAuthModalStore.getState().openRegister();
    render(<AuthModal />);
    fireEvent.click(screen.getByText('Kembali login'));
    fireEvent.click(screen.getByText('Lupa password'));
    expect(screen.getByText('OTP reset')).toBeInTheDocument();
    expect(screen.queryByText('OTP register')).not.toBeInTheDocument();
  });
  it('opens password creation only after registration OTP and retains the verified grant and names', () => {
    useAuthModalStore.getState().openRegister();
    render(<AuthModal />);
    usePhoneStore.getState().setPhone('+6281234567890');
    usePhoneStore.getState().setRequestId('registration-request');
    useRegisterStore
      .getState()
      .setRegisterData({ firstName: 'Andry', lastName: 'Wijaya', phone: '+6281234567890' });
    fireEvent.click(screen.getByText('Lanjut OTP'));
    expect(screen.queryByText('Buat password akun')).toBeNull();
    fireEvent.click(screen.getByText('OTP terverifikasi'));
    expect(screen.getByText('Buat password akun')).toBeInTheDocument();
    expect(screen.queryByText('OTP register')).toBeNull();
    expect(usePhoneStore.getState().registrationToken).toBe('verified-grant');
    expect(useRegisterStore.getState().registerData?.firstName).toBe('Andry');
  });
});
