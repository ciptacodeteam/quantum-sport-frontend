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
      className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/20 bg-transparent px-5 py-2 text-xs font-medium text-[#ad422b] transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ad422b] disabled:cursor-not-allowed disabled:text-black/40"
    >
      {loading ? 'Mengirim...' : isCoolingDown ? `Kirim ulang dalam ${label}` : 'Kirim ulang kode'}
    </button>
  );
}
