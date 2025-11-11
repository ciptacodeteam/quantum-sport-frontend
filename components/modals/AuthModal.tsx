'use client';

import { profileQueryOptions } from '@/queries/profile';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { useRegisterStore } from '@/stores/useRegisterStore';
import useAuthModalStore from '@/stores/useAuthModalStore';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import LoginForm from '../forms/auth/LoginForm';
import RegisterForm from '../forms/auth/RegisterForm';
import ResetPasswordForm from '../forms/auth/ResetPasswordForm';
import VerifyPhoneOtpForm from '../forms/auth/VerifyPhoneOtpForm';
import { Dialog, DialogContent } from '../ui/dialog';

const AuthModal = () => {
  const { data: user, isPending: isUserPending } = useQuery(profileQueryOptions);

  const searchParams = useSearchParams();
  const requireLogin = searchParams.get('requireLogin');
  const router = useRouter();
  const pathname = usePathname();

  const [otpOpen, setOtpOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  const [verifyType, setVerifyType] = useState<'global' | 'register'>('global');

  const setPhone = usePhoneStore((state) => state.setPhone);
  const setRequestId = usePhoneStore((state) => state.setRequestId);
  const clearRegisterData = useRegisterStore((state) => state.clear);
  const isOpen = useAuthModalStore((state) => state.isOpen);
  const setOpen = useAuthModalStore((state) => state.setOpen);
  const openModal = useAuthModalStore((state) => state.open);

  // Open login modal if requireLogin param is true
  // e.g. /?requireLogin=true
  useEffect(() => {
    if (requireLogin === 'true') {
      openModal();

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        params.delete('requireLogin');
        const query = params.toString();

        router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
      }
    }
  }, [requireLogin, openModal, router, pathname]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setOpen(open);
      if (!open) {
        setPhone(null);
        setRequestId(null);
        clearRegisterData();
      }
    },
    [setOpen, setPhone, setRequestId, clearRegisterData]
  );

  const handleRegisterFromLogin = () => {
    setVerifyType('register');
    handleOpenChange(false);
    setRegisterOpen(true);
  };

  const handleLoginFromRegister = () => {
    setRegisterOpen(false);
    handleOpenChange(true);
  };

  const handleAfterRegister = () => {
    setRegisterOpen(false);
    setOtpOpen(true);
  };

  const handleLoginToVerifyPhone = () => {
    handleOpenChange(false);
    setOtpOpen(true);
  };

  if (!isUserPending && !!user?.id) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <main>
            <LoginForm
              openVerifyPhoneOtpModal={handleLoginToVerifyPhone}
              onRegisterClick={handleRegisterFromLogin}
              onLoginSuccess={() => {
                handleOpenChange(false);
                setPhone(null);
                setRequestId(null);
                clearRegisterData();
              }}
            />
          </main>
        </DialogContent>
      </Dialog>
      <Dialog
        open={registerOpen}
        onOpenChange={(value) => {
          setRegisterOpen(value);
          if (!value) {
            setPhone(null);
            setRequestId(null);
            clearRegisterData();
          }
        }}
      >
        <DialogContent>
          <main>
            <RegisterForm
              onRegisterSuccess={handleAfterRegister}
              onLoginClick={handleLoginFromRegister}
            />
          </main>
        </DialogContent>
      </Dialog>
      <Dialog
        open={otpOpen}
        onOpenChange={(value) => {
          setOtpOpen(value);
          if (!value) {
            setPhone(null);
            setRequestId(null);
            clearRegisterData();
          }
        }}
      >
        <DialogContent>
          <main>
            <VerifyPhoneOtpForm
              type={verifyType}
              onVerifySuccess={() => {
                if (verifyType === 'register') {
                  setPhone(null);
                  setRequestId(null);
                  clearRegisterData();
                  setRegisterOpen(false);
                } else {
                  setResetPasswordOpen(true);
                }

                setOtpOpen(false);
              }}
            />
          </main>
        </DialogContent>
      </Dialog>
      <Dialog
        open={resetPasswordOpen}
        onOpenChange={(value) => {
          setResetPasswordOpen(value);
          if (!value) {
            setPhone(null);
            setRequestId(null);
            clearRegisterData();
          }
        }}
      >
        <DialogContent>
          <main>
            <ResetPasswordForm
              onSuccess={() => {
                setResetPasswordOpen(false);
                setPhone(null);
                setRequestId(null);
                clearRegisterData();
                handleOpenChange(true);
              }}
            />
          </main>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default AuthModal;
