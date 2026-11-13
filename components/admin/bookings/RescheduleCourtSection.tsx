'use client';
import { useHasRole, useIsSuperAdmin } from '@/hooks/useRoleAccess';
import { getRescheduleNotice } from '@/lib/reschedule-policy';
import type { Booking, BookingDetail } from '@/types/model';
import { RescheduleCourtDialog } from './RescheduleCourtDialog';

export default function RescheduleCourtSection({
  detail,
  booking
}: {
  detail: BookingDetail;
  booking: Booking;
}) {
  const canWrite = useHasRole(['ADMIN', 'CASHIER']);
  const isSuperAdmin = useIsSuperAdmin();
  if (!canWrite || !detail.slot || booking.status === 'CANCELLED') return null;
  return (
    <section
      aria-label="Reschedule booking lapangan"
      className="space-y-3 rounded-xl border p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h3 className="font-semibold">Reschedule lapangan</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Ubah tanggal dan jam bermain.{' '}
            {getRescheduleNotice(isSuperAdmin ? 'SUPER_ADMIN' : undefined)}
          </p>
        </div>
        <RescheduleCourtDialog
          detail={detail}
          canReschedule={
            booking.status === 'CONFIRMED' &&
            (!booking.invoice || booking.invoice.status === 'PAID')
          }
          membershipCovered={
            (booking.membershipSessionsUsed ?? 0) > 0 &&
            (booking.courtDiscountPrice === 0 || detail.discountPrice === 0)
          }
        />
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">
        Tarif lebih tinggi dikenakan selisih. Tarif lebih rendah tidak mendapat refund; nilai
        pembayaran sebelumnya tetap berlaku. Coach dan ballboy yang terhubung harus tersedia pada
        jadwal pengganti.
      </p>
    </section>
  );
}
