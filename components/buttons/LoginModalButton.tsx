'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { useState } from 'react';
import LoginForm from '../forms/auth/LoginForm';
import VerifyPhoneOtpForm from '../forms/auth/VerifyPhoneOtpForm';
import { Button } from '../ui/button';

const LoginModalButton = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);

  const setPhone = usePhoneStore((state) => state.setPhone);
  const setRequestId = usePhoneStore((state) => state.setRequestId);

  const handleAfterLogin = () => {
    setOtpOpen(true);
    setLoginOpen(false);
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
            <LoginForm onLoginSuccess={handleAfterLogin} />
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
            <VerifyPhoneOtpForm type="login" onVerifySuccess={handleAfterLogin} />
          </main>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default LoginModalButton;
