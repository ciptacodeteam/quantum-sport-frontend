import { profileQueryOptions } from '@/queries/profile';
import { usePhoneStore } from '@/stores/usePhoneStore';
import { useRegisterStore } from '@/stores/useRegisterStore';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoginForm from '../forms/auth/LoginForm';
import RegisterForm from '../forms/auth/RegisterForm';
import ResetPasswordForm from '../forms/auth/ResetPasswordForm';
import VerifyPhoneOtpForm from '../forms/auth/VerifyPhoneOtpForm';
import { Dialog, DialogContent } from '../ui/dialog';

type Props = {
  open?: boolean;
  onOpenChange: (open: boolean) => void;
};

const AuthModal = ({ open = false, onOpenChange }: Props) => {
  const { data: user, isPending: isUserPending } = useQuery(profileQueryOptions);

  const searchParams = useSearchParams();
  const requireLogin = searchParams.get('requireLogin');

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
      onOpenChange(true);
    }
  }, [requireLogin]);

  const handleRegisterFromLogin = () => {
    setVerifyType('register');
    onOpenChange(false);
    setRegisterOpen(true);
  };

  const handleLoginFromRegister = () => {
    setRegisterOpen(false);
    onOpenChange(true);
  };

  const handleAfterRegister = () => {
    setRegisterOpen(false);
    setOtpOpen(true);
  };

  const handleLoginToVerifyPhone = () => {
    onOpenChange(false);
    setOtpOpen(true);
  };

  if (!isUserPending && !!user?.id) return null;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          onOpenChange(value);
          if (!value) {
            setPhone(null);
            setRequestId(null);
            clearRegisterData();
          }
        }}
      >
        <DialogContent>
          <main>
            <LoginForm
              openVerifyPhoneOtpModal={handleLoginToVerifyPhone}
              onRegisterClick={handleRegisterFromLogin}
              onLoginSuccess={() => {
                onOpenChange(false);
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
                onOpenChange(true);
              }}
            />
          </main>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default AuthModal;
