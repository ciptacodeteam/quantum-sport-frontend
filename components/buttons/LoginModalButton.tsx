'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { useRegisterStore } from '@/stores/useRegisterStore';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoginForm from '../forms/auth/LoginForm';
import RegisterForm from '../forms/auth/RegisterForm';
import ResetPasswordForm from '../forms/auth/ResetPasswordForm';
import VerifyPhoneOtpForm from '../forms/auth/VerifyPhoneOtpForm';
import { Button } from '../ui/button';
import useAuthStore from '@/stores/useAuthStore';
import LogoutButton from './LogoutButton';
import { useQuery } from '@tanstack/react-query';
import { profileQueryOptions } from '@/queries/profile';
import { Skeleton } from '../ui/skeleton';

const LoginModalButton = () => {
  const { data: user, isPending: isUserPending } = useQuery(profileQueryOptions);

  const searchParams = useSearchParams();
  const requireLogin = searchParams.get('requireLogin');

  const [loginOpen, setLoginOpen] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  const [verifyType, setVerifyType] = useState<'global' | 'register'>('global');

  const setPhone = usePhoneStore((state) => state.setPhone);
  const setRequestId = usePhoneStore((state) => state.setRequestId);
  const clearRegisterData = useRegisterStore((state) => state.clear);

  // Open login modal if requireLogin param is true
  // e.g. /?requireLogin=true
  useEffect(() => {
    if (requireLogin === 'true') {
      setLoginOpen(true);
    }
  }, [requireLogin]);

  const handleRegisterFromLogin = () => {
    setVerifyType('register');
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const handleLoginFromRegister = () => {
    setRegisterOpen(false);
    setLoginOpen(true);
  };

  const handleAfterRegister = () => {
    setRegisterOpen(false);
    setOtpOpen(true);
  };

  const handleLoginToVerifyPhone = () => {
    setLoginOpen(false);
    setOtpOpen(true);
  };

  if (isUserPending) {
    return <Skeleton className="h-10 w-20" />;
  }

  if (user) {
    return <LogoutButton />;
  }

  return (
    <>
      <Dialog
        open={loginOpen}
        onOpenChange={(value) => {
          setLoginOpen(value);
          if (!value) {
            setPhone(null);
            setRequestId(null);
            clearRegisterData();
          }
        }}
      >
        <DialogTrigger asChild>
          <Button>Login</Button>
        </DialogTrigger>
        <DialogContent>
          <main>
            <LoginForm
              openVerifyPhoneOtpModal={handleLoginToVerifyPhone}
              onRegisterClick={handleRegisterFromLogin}
              onLoginSuccess={() => {
                setLoginOpen(false);
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
                setLoginOpen(true);
              }}
            />
          </main>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default LoginModalButton;
