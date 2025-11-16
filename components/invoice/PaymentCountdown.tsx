'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

type PaymentCountdownProps = {
  dueDate: string | Date;
  status: string;
};

export default function PaymentCountdown({ dueDate, status }: PaymentCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = dayjs();
      const due = dayjs(dueDate);
      const diff = due.diff(now);

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const duration = dayjs.duration(diff);
      setTimeLeft({
        hours: Math.floor(duration.asHours()),
        minutes: duration.minutes(),
        seconds: duration.seconds(),
        isExpired: false
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [dueDate]);

  // Don't show if not pending
  if (!['PENDING', 'HOLD'].includes(status)) {
    return null;
  }

  // Show expired message if time is up
  if (timeLeft.isExpired) {
    return (
      <Badge className="flex w-fit items-center gap-1.5 bg-gray-600 px-3 py-1.5 text-white">
        <Clock className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Payment Expired</span>
      </Badge>
    );
  }

  return (
    <Badge className="flex w-fit items-center gap-1.5 bg-red-600 px-3 py-1.5 text-white">
      <Clock className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">
        {timeLeft.hours > 0 && `${timeLeft.hours} jam : `}
        {timeLeft.minutes} menit : {timeLeft.seconds} detik
      </span>
    </Badge>
  );
}
