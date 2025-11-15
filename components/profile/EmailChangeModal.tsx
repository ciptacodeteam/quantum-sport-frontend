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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendEmailOtpMutationOptions, verifyEmailOtpMutationOptions } from '@/mutations/email';
import { useResendCountdown } from '@/hooks/useResendCountdown';
import { profileQueryOptions } from '@/queries/profile';
import { updateProfileApi } from '@/api/auth';
import { toast } from 'sonner';
import { useState } from 'react';

type Props = {
  open: boolean;
  email: string | null | undefined;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function EmailChangeModal({ open, email, onOpenChange, onSuccess }: Props) {
  const qc = useQueryClient();
  const [newEmail, setNewEmail] = useState<string>(email || '');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const cooldown = useResendCountdown({ seconds: 60, persistKey: 'email-otp-cd' });

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: async (payload: { email: string }) => {
      const form = new FormData();
      form.append('email', payload.email);
      return updateProfileApi(form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update email')
  });

  const { mutate: sendOtp, isPending: isSending } = useMutation(
    sendEmailOtpMutationOptions({
      onSuccess: () => {
        cooldown.start();
        setOtpSent(true);
        toast.success('OTP sent to email');
      }
    })
  );

  const { mutate: verifyOtp, isPending: isVerifying } = useMutation(
    verifyEmailOtpMutationOptions({
      onSuccess: () => {
        toast.success('Email verified');
        qc.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
        setOtp('');
        setOtpSent(false);
        onOpenChange(false);
        onSuccess?.();
      }
    })
  );

  const handleSaveAndSend = () => {
    if (!newEmail) return toast.error('Email required');
    updateProfile({ email: newEmail });
    sendOtp({ email: newEmail });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setOtp('');
          setOtpSent(false);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Email</DialogTitle>
          <DialogDescription>Update and verify your email address</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email-input">New Email</Label>
            <Input
              id="email-input"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={otpSent}
            />
          </div>
          {!otpSent ? (
            <Button
              onClick={handleSaveAndSend}
              loading={isUpdating || isSending}
              disabled={isUpdating || isSending}
            >
              Save & Send OTP
            </Button>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="email-otp">OTP</Label>
                <Input id="email-otp" value={otp} onChange={(e) => setOtp(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => !cooldown.isCoolingDown && sendOtp({ email: newEmail })}
                  disabled={cooldown.isCoolingDown || isSending}
                >
                  {cooldown.isCoolingDown ? `Resend (${cooldown.label})` : 'Resend OTP'}
                </Button>
                <Button
                  onClick={() => verifyOtp({ email: newEmail, otp })}
                  loading={isVerifying}
                  disabled={isVerifying || !otp}
                >
                  Verify Email
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
