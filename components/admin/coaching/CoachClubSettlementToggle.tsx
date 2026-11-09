'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { coachingApi, type CoachingBooking } from '@/api/admin/coaching';
import { useHasRole } from '@/hooks/useRoleAccess';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { formatBookingDate } from '@/lib/booking-display';
import { handleMutationError } from '@/lib/handle-mutation-error';

export default function CoachClubSettlementToggle({ booking }: { booking: CoachingBooking }) {
  const canEdit = useHasRole(['ADMIN']);
  const client = useQueryClient();
  const settled = booking.isClubSettled === true;
  const mutation = useMutation({
    mutationKey: ['admin', 'coach-club-settlement', booking.id],
    mutationFn: (isSettled: boolean) =>
      coachingApi.setClubSettlement(booking.id, isSettled, settled),
    onSuccess: async (_, isSettled) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['admin', 'coaching'] }),
        client.invalidateQueries({ queryKey: ['admin', 'analytics'] })
      ]);
      toast.success(
        isSettled ? 'Coach ditandai lunas ke club.' : 'Tagihan coach ke club dibuka kembali.'
      );
    },
    onError: (error) => {
      handleMutationError(error);
      void client.invalidateQueries({ queryKey: ['admin', 'coaching'] });
    }
  });
  const eligible = booking.status === 'CONFIRMED' && booking.invoice?.status === 'PAID';
  return (
    <div className="min-w-36 space-y-1.5">
      <div className="flex items-center gap-2">
        {canEdit && (
          <Switch
            aria-label={`Lunas ke club untuk ${booking.name}, ${booking.customer}, ${formatBookingDate(booking.startAt, 'DD MMM YYYY HH:mm')}`}
            checked={settled}
            disabled={mutation.isPending || (!settled && !eligible)}
            onCheckedChange={(checked) => mutation.mutate(checked)}
          />
        )}
        <Badge variant={settled ? 'lightSuccess' : eligible ? 'lightWarning' : 'lightNeutral'}>
          {settled ? 'Lunas ke Club' : eligible ? 'Belum lunas ke Club' : 'Tidak ditagihkan'}
        </Badge>
      </div>
      {booking.clubSettlementUpdatedAt && (
        <p className="text-muted-foreground text-xs">
          Diperbarui {formatBookingDate(booking.clubSettlementUpdatedAt, 'DD MMM YYYY, HH:mm')} WIB
        </p>
      )}
    </div>
  );
}
