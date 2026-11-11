'use client';
import { useQuery } from '@tanstack/react-query';
import { coachingApi, type CoachingBooking } from '@/api/admin/coaching';
import { useHasRole } from '@/hooks/useRoleAccess';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { RescheduleCourtDialog } from '@/components/admin/bookings/RescheduleCourtDialog';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';

export default function ServiceRescheduleSection({
  booking,
  kind,
  onSuccess
}: {
  booking: CoachingBooking;
  kind: 'COACH' | 'BALLBOY';
  onSuccess?: () => void;
}) {
  const allowed = useHasRole(['ADMIN', 'CASHIER']);
  const { branchId } = useAdminCourtSports();
  const query = useQuery({
    queryKey: ['admin', 'coaching', branchId, 'reschedule-court', kind, booking.id],
    queryFn: () => coachingApi.rescheduleCourt(kind, booking.id),
    enabled: allowed && booking.status === 'CONFIRMED',
    retry: false
  });
  if (!allowed) return null;
  return (
    <section
      aria-label="Reschedule lapangan dan layanan"
      className="space-y-3 rounded-xl border p-4"
    >
      <h3 className="font-semibold">Reschedule lapangan & layanan</h3>
      <p className="text-muted-foreground text-xs leading-relaxed">
        Lapangan, coach, dan ballboy yang terhubung dipindahkan bersama. Seluruh layanan harus
        tersedia pada jadwal pengganti; durasi dan harga tetap mengikuti aturan reschedule lapangan.
      </p>
      {booking.status !== 'CONFIRMED' ? (
        <p className="text-muted-foreground text-xs">
          Hanya booking aktif yang dapat dijadwalkan ulang.
        </p>
      ) : query.isPending ? (
        <p role="status" className="text-muted-foreground text-xs">
          Memuat jadwal lapangan...
        </p>
      ) : query.isError ? (
        <div role="alert" className="space-y-2 text-xs">
          <p>{getApiErrorMessage(query.error, 'Jadwal lapangan belum dapat dimuat.')}</p>
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : (
        query.data && (
          <RescheduleCourtDialog
            detail={query.data.detail}
            canReschedule
            membershipCovered={query.data.membershipCovered}
            onSuccess={onSuccess}
          />
        )
      )}
    </section>
  );
}
