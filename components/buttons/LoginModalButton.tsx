'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoginForm from '../forms/auth/LoginForm';
import RegisterForm from '../forms/auth/RegisterForm';
import VerifyPhoneOtpForm from '../forms/auth/VerifyPhoneOtpForm';
import { Button } from '../ui/button';
import { useRegisterStore } from '@/stores/useRegisterStore';

const LoginModalButton = () => {
  const searchParams = useSearchParams();
  const requireLogin = searchParams.get('requireLogin');

  const [loginOpen, setLoginOpen] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [type, setType] = useState<'login' | 'register'>('login');

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
    setType('register');
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
            <VerifyPhoneOtpForm type={type} onVerifySuccess={() => {}} insideModal />
          </main>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default LoginModalButton;
