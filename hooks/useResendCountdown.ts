import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Options = {
  seconds: number; // cooldown window, e.g. 60
  persistKey?: string; // localStorage key to persist deadline
  autoStart?: boolean; // start immediately
};

export function useResendCountdown({ seconds, persistKey, autoStart }: Options) {
  const [remaining, setRemaining] = useState<number>(0);
  const deadlineRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // Read persisted deadline on mount
  useEffect(() => {
    if (!persistKey) return;
    const raw = localStorage.getItem(persistKey);
    if (raw) {
      const savedDeadline = Number(raw);
      if (!Number.isNaN(savedDeadline)) {
        deadlineRef.current = savedDeadline;
        const left = Math.max(0, Math.ceil((savedDeadline - Date.now()) / 1000));
        setRemaining(left);
      }
    }
  }, [persistKey]);

  const clear = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const tick = useCallback(() => {
    if (!deadlineRef.current) return setRemaining(0);
    const left = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
    setRemaining(left);
    if (left === 0) clear();
  }, []);

  const start = useCallback(
    (customSeconds?: number) => {
      const total = (customSeconds ?? seconds) * 1000;
      deadlineRef.current = Date.now() + total;
      if (persistKey) localStorage.setItem(persistKey, String(deadlineRef.current));
      tick();
      clear();
      timerRef.current = window.setInterval(tick, 250); // 250ms keeps UI snappy & drift-safe
    },
    [seconds, persistKey, tick]
  );

  const reset = useCallback(() => {
    deadlineRef.current = null;
    if (persistKey) localStorage.removeItem(persistKey);
    setRemaining(0);
    clear();
  }, [persistKey]);

  useEffect(() => {
    if (autoStart) start();
    return clear; // cleanup on unmount
  }, [autoStart, start]);

  const isCoolingDown = remaining > 0;
  const label = useMemo(() => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
  }, [remaining]);

  return { remaining, isCoolingDown, label, start, reset };
}
