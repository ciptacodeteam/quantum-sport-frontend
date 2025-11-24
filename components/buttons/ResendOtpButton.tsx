'use client';

import { useResendCountdown } from '@/hooks/useResendCountdown';
import { useState } from 'react';

type Props = {
  onSendOtp: () => Promise<void> | void; // your API call to send OTP
  seconds?: number; // default 60
  persistKey?: string; // e.g. "otp:cooldown:login"
  autoStart?: boolean; // whether to start countdown on mount
};

export function ResendOtpButton({
  onSendOtp,
  seconds = 60,
  persistKey = 'otp:cooldown',
  autoStart
}: Props) {
  const [loading, setLoading] = useState(false);
  const { isCoolingDown, label, start } = useResendCountdown({
    seconds,
    persistKey,
    autoStart
  });

  const handleClick = async () => {
    try {
      setLoading(true);
      await onSendOtp(); // call your backend to send OTP
      start(seconds); // begin cooldown after successful send
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || isCoolingDown}
      aria-disabled={loading || isCoolingDown}
      className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? 'Sending...' : isCoolingDown ? `Resend in ${label}` : 'Resend OTP'}
    </button>
  );
}
