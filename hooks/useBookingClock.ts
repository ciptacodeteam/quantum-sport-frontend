'use client';

import { useEffect, useState } from 'react';

/** Recheck slot eligibility every second and immediately when returning to a tab. */
export function useBookingClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const update = () => setNow(Date.now());
    const visible = () => {
      if (document.visibilityState === 'visible') update();
    };
    const timer = window.setInterval(update, 1000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', visible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', visible);
    };
  }, []);
  return now;
}
