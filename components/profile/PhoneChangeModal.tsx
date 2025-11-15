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
import { sendPhoneOtpMutationOptions } from '@/mutations/phone';
import { verifyPhoneOtpMutationOptions } from '@/mutations/auth';
import { useResendCountdown } from '@/hooks/useResendCountdown';
import { profileQueryOptions } from '@/queries/profile';
import { updateProfileApi } from '@/api/auth';
import { toast } from 'sonner';
import { useState } from 'react';

type Props = {
  open: boolean;
  phone: string | null | undefined;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function PhoneChangeModal({ open, phone, onOpenChange, onSuccess }: Props) {
  const qc = useQueryClient();
  const [newPhone, setNewPhone] = useState<string>(phone || '');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const cooldown = useResendCountdown({ seconds: 60, persistKey: 'phone-otp-cd' });

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: async (payload: { phone: string }) => {
      const form = new FormData();
      form.append('phone', payload.phone);
      return updateProfileApi(form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update phone')
  });

  const { mutate: sendOtp, isPending: isSending } = useMutation(
    sendPhoneOtpMutationOptions({
      onSuccess: () => {
        cooldown.start();
        setOtpSent(true);
        toast.success('OTP sent to phone');
      }
    })
  );

  const { mutate: verifyOtp, isPending: isVerifying } = useMutation(
    verifyPhoneOtpMutationOptions({
      onSuccess: () => {
        toast.success('Phone verified');
        qc.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
        setOtp('');
        setOtpSent(false);
        onOpenChange(false);
        onSuccess?.();
      }
    })
  );

  const handleSaveAndSend = () => {
    if (!newPhone) return toast.error('Phone required');
    updateProfile({ phone: newPhone });
    sendOtp({ phone: newPhone });
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
          <DialogTitle>Change Phone</DialogTitle>
          <DialogDescription>Update and verify your phone number</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone-input">New Phone</Label>
            <Input
              id="phone-input"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
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
                <Label htmlFor="phone-otp">OTP</Label>
                <Input id="phone-otp" value={otp} onChange={(e) => setOtp(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => !cooldown.isCoolingDown && sendOtp({ phone: newPhone })}
                  disabled={cooldown.isCoolingDown || isSending}
                >
                  {cooldown.isCoolingDown ? `Resend (${cooldown.label})` : 'Resend OTP'}
                </Button>
                <Button
                  onClick={() => verifyOtp({ phone: newPhone, otp })}
                  loading={isVerifying}
                  disabled={isVerifying || !otp}
                >
                  Verify Phone
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
