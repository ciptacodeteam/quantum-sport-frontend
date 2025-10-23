'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { useState } from 'react';
import LoginForm from '../forms/auth/LoginForm';
import VerifyPhoneOtpForm from '../forms/auth/VerifyPhoneOtpForm';
import { Button } from '../ui/button';
import RegisterForm from '../forms/auth/RegisterForm';

const LoginModalButton = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [type, setType] = useState<'login' | 'register'>('login');

  const setPhone = usePhoneStore((state) => state.setPhone);
  const setRequestId = usePhoneStore((state) => state.setRequestId);

  const handleAfterLogin = () => {
    setType('login');
    setOtpOpen(true);
    setLoginOpen(false);
  };

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
          }
        }}
      >
        <DialogTrigger asChild>
          <Button>Login</Button>
        </DialogTrigger>
        <DialogContent>
          <main>
            <LoginForm
              onLoginSuccess={handleAfterLogin}
              onRegisterClick={handleRegisterFromLogin}
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
          }
        }}
      >
        <DialogContent>
          <main>
            <VerifyPhoneOtpForm type={type} onVerifySuccess={handleAfterLogin} insideModal />
          </main>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default LoginModalButton;
