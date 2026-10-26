'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { expireInvoiceApi } from '@/api/booking';

type Props = { dueDate: string | Date; status: string; invoiceId: string; onExpired?: () => void };
export default function PaymentCountdown({ dueDate, status, invoiceId, onExpired }: Props) {
  const deadline = new Date(dueDate).getTime();
  const [remaining, setRemaining] = useState(() => Math.max(0, deadline - Date.now()));
  const expiredRequest = useRef<string | null>(null);
  const pending = ['PENDING', 'HOLD', 'AWAITING_CONFIRMATION'].includes(status);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;
  const { mutate: expire } = useMutation({
    mutationFn: () => expireInvoiceApi(invoiceId),
    onSettled: () => onExpiredRef.current?.()
  });
  useEffect(() => {
    if (!pending || !Number.isFinite(deadline)) return;
    const update = () => {
      const diff = Math.max(0, deadline - Date.now());
      setRemaining(diff);
      const key = `${invoiceId}:${deadline}`;
      if (diff === 0 && expiredRequest.current !== key) {
        expiredRequest.current = key;
        expire();
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deadline, invoiceId, pending, expire]);
  if (!pending || !Number.isFinite(deadline)) return null;
  const seconds = Math.ceil(remaining / 1000);
  const hours = Math.floor(seconds / 3600);
  const display = `${hours > 0 ? `${String(hours).padStart(2, '0')}:` : ''}${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <div className="inline-flex items-center gap-2 border border-[#ad422b]/20 bg-[#ad422b]/5 px-3 py-2 text-xs text-[#ad422b]">
      <Clock3 className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span>
        {seconds === 0 ? (
          'Batas waktu pembayaran berakhir'
        ) : (
          <>
            Selesaikan dalam <span className="font-medium tabular-nums">{display}</span>
          </>
        )}
      </span>
    </div>
  );
}
