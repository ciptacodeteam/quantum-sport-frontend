'use client';
import { useId, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coachingApi } from '@/api/admin/coaching';
import { useHasRole } from '@/hooks/useRoleAccess';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { useBookingClock } from '@/hooks/useBookingClock';
import { isCourtWallSlotBookable } from '@/lib/booking-time-policy';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatScheduleSlotTime } from '@/lib/admin-schedule-time';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ReplaceCoachDialog({
  bookingCoachId,
  currentName,
  startAt,
  status
}: {
  bookingCoachId: string;
  currentName: string;
  startAt: string;
  status?: string;
}) {
  const canWrite = useHasRole(['SUPER_ADMIN']);
  const { branchId } = useAdminCourtSports();
  const now = useBookingClock();
  const canReplace = canWrite && status === 'CONFIRMED' && isCourtWallSlotBookable(startAt, now);
  const [open, setOpen] = useState(false);
  const [slotId, setSlotId] = useState('');
  const [groupId, setGroupId] = useState<string>();
  const [reason, setReason] = useState('');
  const id = useId();
  const client = useQueryClient();
  const availability = useQuery({
    queryKey: ['admin', 'coaching', branchId, 'replacements', bookingCoachId],
    queryFn: () => coachingApi.replacements(bookingCoachId),
    enabled: open && canReplace,
    refetchInterval: open ? 10000 : false
  });
  const selected = availability.data?.options.find(
    (option) => option.slotId === slotId && (option.coachingGroupId ?? undefined) === groupId
  );
  const replace = useMutation({
    mutationFn: () =>
      coachingApi.replaceCoach(bookingCoachId, {
        slotId,
        ...(groupId ? { coachingGroupId: groupId } : {}),
        expectedSlotId: availability.data!.current.slotId,
        reason: reason.trim() || undefined
      }),
    onSuccess: (result) => {
      setOpen(false);
      setSlotId('');
      setReason('');
      for (const queryKey of [
        ['admin', 'coaching'],
        ['admin', 'schedule'],
        ['admin', 'bookings'],
        ['admin', 'booked-coaches'],
        ['admin', 'invoices'],
        ['invoice']
      ])
        void client.invalidateQueries({ queryKey });
      toast.success(`Coach berhasil diganti menjadi ${result.name}.`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Coach belum dapat diganti.'));
      setSlotId('');
      void availability.refetch();
    }
  });
  if (!canReplace) return null;
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        aria-label={`Ganti Coach ${currentName}`}
        onClick={() => {
          setSlotId('');
          setGroupId(undefined);
          setReason('');
          setOpen(true);
        }}
      >
        Ganti Coach
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!replace.isPending) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Ganti Coach</DialogTitle>
            <DialogDescription>
              Pilih coach tersedia dengan cabang, olahraga, jadwal, dan harga yang sama. Total
              invoice tetap.
            </DialogDescription>
          </DialogHeader>
          {availability.isPending ? (
            <p className="text-muted-foreground py-4 text-sm">Mencari coach pengganti...</p>
          ) : availability.isError ? (
            <div role="alert" className="space-y-3">
              <p>Coach pengganti belum dapat dimuat.</p>
              <Button variant="outline" onClick={() => void availability.refetch()}>
                Coba lagi
              </Button>
            </div>
          ) : (
            availability.data && (
              <div className="space-y-5">
                <div className="bg-muted/40 space-y-1 rounded-lg border p-4 text-sm">
                  <p className="text-muted-foreground text-xs">Coach saat ini</p>
                  <p className="font-semibold">{availability.data.current.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {availability.data.current.coachingGroupName || 'Coach Independen'}
                  </p>
                  <p>
                    {formatScheduleSlotTime(availability.data.current.startAt, 'DD MMM YYYY')} ·{' '}
                    {formatScheduleSlotTime(availability.data.current.startAt)}–
                    {formatScheduleSlotTime(availability.data.current.endAt)} WIB
                  </p>
                  <p className="font-medium tabular-nums">
                    Rp {availability.data.current.price.toLocaleString('id-ID')}
                  </p>
                </div>
                {!availability.data.options.length ? (
                  <p className="text-muted-foreground rounded-lg border border-dashed p-5 text-center text-sm">
                    Belum ada coach lain dengan jadwal dan harga yang sama. Atur jadwal atau tarif
                    coach di Master Data, lalu coba lagi.
                  </p>
                ) : (
                  <>
                    <fieldset className="space-y-2">
                      <legend className="mb-2 text-sm font-medium">Pilih coach pengganti</legend>
                      {availability.data.options.map((option) => (
                        <label
                          key={`${option.slotId}:${option.coachingGroupId || 'independent'}`}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 ${slotId === option.slotId && (option.coachingGroupId ?? undefined) === groupId ? 'border-primary bg-primary/5' : ''}`}
                        >
                          <span className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={id}
                              className="accent-primary size-4"
                              checked={
                                slotId === option.slotId &&
                                (option.coachingGroupId ?? undefined) === groupId
                              }
                              disabled={replace.isPending}
                              onChange={() => {
                                setSlotId(option.slotId);
                                setGroupId(option.coachingGroupId ?? undefined);
                              }}
                            />
                            <span>
                              <span className="block text-sm font-medium">{option.name}</span>
                              <span className="text-muted-foreground block text-xs">
                                {option.coachingGroupName || 'Coach Independen'}
                              </span>
                            </span>
                          </span>
                          <span className="text-sm tabular-nums">
                            Rp {option.price.toLocaleString('id-ID')}
                          </span>
                        </label>
                      ))}
                    </fieldset>
                    <div className="space-y-2">
                      <Label htmlFor={`${id}-reason`}>Alasan penggantian (opsional)</Label>
                      <Textarea
                        id={`${id}-reason`}
                        maxLength={500}
                        value={reason}
                        disabled={replace.isPending}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Contoh: coach berhalangan hadir"
                      />
                    </div>
                    {selected && (
                      <p role="status" className="rounded-lg border p-3 text-sm">
                        {availability.data.current.name} → <strong>{selected.name}</strong>
                        <span className="text-muted-foreground block text-xs">
                          {selected.coachingGroupName || 'Coach Independen'}
                        </span>
                        <span className="text-muted-foreground mt-1 block text-xs">
                          Selisih harga Rp 0. Jadwal dan invoice tetap.
                        </span>
                      </p>
                    )}
                  </>
                )}
              </div>
            )
          )}
          <DialogFooter>
            <Button variant="outline" disabled={replace.isPending} onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              disabled={!selected || replace.isPending || !canReplace || availability.isError}
              onClick={() => replace.mutate()}
            >
              {replace.isPending ? 'Mengganti coach...' : 'Konfirmasi Ganti Coach'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
