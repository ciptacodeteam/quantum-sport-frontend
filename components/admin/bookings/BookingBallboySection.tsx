'use client';

import { Badge } from '@/components/ui/badge';
import { getBallboyCourtName } from '@/lib/ballboy-utils';
import { formatSlotTime } from '@/lib/time-utils';
import { formatPhone } from '@/lib/utils';
import type { BookingBallboy, BookingDetail } from '@/types/model';
import { IconBallTennis } from '@tabler/icons-react';

type BookingBallboySectionProps = {
  ballboys: BookingBallboy[];
  details?: BookingDetail[];
};

export function BookingBallboySection({ ballboys, details }: BookingBallboySectionProps) {
  if (ballboys.length === 0) return null;

  return (
    <div className="border-t pt-4">
      <div className="mb-3 flex items-center gap-2">
        <IconBallTennis className="h-4 w-4 text-emerald-600" />
        <p className="text-sm font-medium">Ballboys ({ballboys.length})</p>
      </div>
      <div className="space-y-2">
        {ballboys.map((bookingBallboy) => {
          const ballboy = bookingBallboy.slot?.staff;
          const courtName = getBallboyCourtName(bookingBallboy, details);

          return (
            <div
              key={bookingBallboy.id}
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-sm font-semibold">{ballboy?.name || 'Unknown Ballboy'}</p>
                    {ballboy?.role && (
                      <Badge variant="outline" className="h-4 px-1.5 py-0 text-[10px]">
                        {ballboy.role}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {bookingBallboy.slot && (
                      <p className="mb-1 text-xs font-medium text-emerald-700">
                        🕐 {formatSlotTime(bookingBallboy.slot.startAt)} -{' '}
                        {formatSlotTime(bookingBallboy.slot.endAt)}
                      </p>
                    )}
                    {courtName && (
                      <p className="text-muted-foreground text-xs">🏟️ {courtName}</p>
                    )}
                    {ballboy?.phone && (
                      <p className="text-muted-foreground text-xs">📞 {formatPhone(ballboy.phone)}</p>
                    )}
                    {ballboy?.email && (
                      <p className="text-muted-foreground text-xs">✉️ {ballboy.email}</p>
                    )}
                    {bookingBallboy.price !== undefined && (
                      <p className="mt-1 text-xs font-medium text-emerald-700">
                        💰 Rp {new Intl.NumberFormat('id-ID').format(bookingBallboy.price)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
