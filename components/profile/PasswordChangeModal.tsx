'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { loginMutationOptions, changePasswordMutationOptions } from '@/mutations/auth';
import { toast } from 'sonner';
import { useState } from 'react';

type Props = {
  open: boolean;
  userEmail: string | null | undefined;
  onOpenChange: (open: boolean) => void;
};

export default function PasswordChangeModal({ open, userEmail, onOpenChange }: Props) {
  const [step, setStep] = useState<'verify' | 'change'>('verify');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { mutate: verifyCurrentPassword, isPending: isVerifying } = useMutation(
    loginMutationOptions({
      onSuccess: () => {
        setStep('change');
        toast.success('Password verified');
      }
    })
  );

  const { mutate: changePassword, isPending: isChanging } = useMutation(
    changePasswordMutationOptions({
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setStep('verify');
        onOpenChange(false);
        toast.success('Password changed');
      }
    })
  );

  const close = (o: boolean) => {
    if (!o) {
      setStep('verify');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === 'verify' ? 'Verify Current Password' : 'Set New Password'}
          </DialogTitle>
          <DialogDescription>
            {step === 'verify'
              ? 'Enter your current password to continue.'
              : 'Choose a strong new password.'}
          </DialogDescription>
        </DialogHeader>
        {step === 'verify' ? (
          <div className="space-y-4">
            {!userEmail && (
              <p className="text-destructive text-sm">Email is required to verify password.</p>
            )}
            <div>
              <Label htmlFor="currentPwd">Current Password</Label>
              <Input
                id="currentPwd"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                if (!userEmail) return toast.error('No email on account');
                if (!currentPassword) return toast.error('Enter current password');
                verifyCurrentPassword({ email: userEmail, password: currentPassword });
              }}
              loading={isVerifying}
              disabled={isVerifying}
            >
              Verify Password
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPwd">New Password</Label>
              <Input
                id="newPwd"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirmPwd">Confirm New Password</Label>
              <Input
                id="confirmPwd"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                if (!newPassword || !confirmPassword) return toast.error('Fill all fields');
                if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
                changePassword({ currentPassword, newPassword });
              }}
              loading={isChanging}
              disabled={isChanging}
            >
              Change Password
            </Button>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
