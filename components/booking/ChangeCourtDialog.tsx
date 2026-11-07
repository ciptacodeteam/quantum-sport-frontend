'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { changeCourtApi, getCourtChangeOptionsApi, type MyCourtBooking } from '@/api/court-change';
import { getApiErrorMessage } from '@/lib/api-error';
import { parseScheduleDatetime } from '@/lib/admin-schedule-time';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export default function ChangeCourtDialog({
  booking,
  branchId,
  userId,
  onClose
}: {
  booking: MyCourtBooking;
  branchId: string;
  userId: string;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [targetId, setTargetId] = useState('');
  const [error, setError] = useState('');
  const options = useQuery({
    queryKey: ['courts', 'change-options', branchId, userId, booking.detailId, booking.slotId],
    queryFn: () => getCourtChangeOptionsApi(booking.detailId),
    staleTime: 0,
    refetchInterval: 10000,
    retry: false
  });
  const target = options.data?.find((option) => option.slotId === targetId);
  const refreshSchedules = async () => {
    await Promise.all(
      ['courts', 'invoice', 'invoices', 'memberships'].map((key) =>
        client.invalidateQueries({ queryKey: [key] })
      )
    );
  };
  const change = useMutation({
    mutationFn: () => changeCourtApi(booking.detailId, booking.slotId, targetId),
    onSuccess: async () => {
      toast.success('Lapangan berhasil diganti. Tanggal, jam, dan biaya tetap.');
      await refreshSchedules();
      onClose();
    },
    onError: async (failure) => {
      setError(getApiErrorMessage(failure, 'Lapangan belum dapat diganti. Silakan coba lagi.'));
      setTargetId('');
      await refreshSchedules();
    }
  });
  const start = parseScheduleDatetime(booking.startAt);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !change.isPending) onClose();
      }}
    >
      <DialogContent showCloseButton={!change.isPending} className="bg-[#f8f8f6]">
        <DialogHeader>
          <DialogTitle>Ganti lapangan</DialogTitle>
          <DialogDescription>
            {booking.courtName} · {start.format('DD MMM YYYY')} · {start.format('HH:mm')}–
            {parseScheduleDatetime(booking.endAt).format('HH:mm')} WIB. Tanggal, jam, dan biaya
            tetap sama.
          </DialogDescription>
        </DialogHeader>
        {options.isPending ? (
          <p role="status" className="p-6 text-center text-sm">
            Memuat lapangan kosong...
          </p>
        ) : options.isError ? (
          <div role="alert" className="space-y-2 text-sm text-red-700">
            <p>{getApiErrorMessage(options.error, 'Lapangan kosong belum dapat dimuat.')}</p>
            <Button variant="outline" onClick={() => void options.refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : !options.data?.length ? (
          <p role="status" className="text-sm text-black/60">
            Tidak ada lapangan kosong dengan jam dan tarif yang sama.
          </p>
        ) : (
          <fieldset disabled={change.isPending} className="max-h-64 space-y-2 overflow-y-auto">
            <legend className="mb-2 text-sm font-medium">Pilih lapangan tujuan</legend>
            {options.data.map((option) => (
              <label
                key={option.slotId}
                className="flex cursor-pointer items-center gap-3 border border-black/15 bg-white p-4 text-sm"
              >
                <input
                  type="radio"
                  name="target-court"
                  value={option.slotId}
                  checked={targetId === option.slotId}
                  onChange={() => {
                    setTargetId(option.slotId);
                    setError('');
                  }}
                />
                {option.courtName}
              </label>
            ))}
          </fieldset>
        )}
        {target && (
          <p className="text-sm">
            Pindahkan {booking.courtName} ke <strong>{target.courtName}</strong>?
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={change.isPending} onClick={onClose}>
            Batal
          </Button>
          <Button
            disabled={!target || options.isFetching || options.isError || change.isPending}
            onClick={() => change.mutate()}
          >
            {change.isPending ? 'Memindahkan...' : 'Konfirmasi pindah'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
