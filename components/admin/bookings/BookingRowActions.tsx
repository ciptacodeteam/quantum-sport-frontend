'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconEye, IconPencil } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { adminBookingQueryOptions } from '@/queries/admin/booking';
import type { Booking } from '@/types/model';
import { BookingStatus } from '@/lib/constants';
import { getApiErrorMessage } from '@/lib/api-error';
import BookingDetailsDialog from './BookingDetailsDialog';
import BookingStatusDialog from './BookingStatusDialog';

export default function BookingRowActions({
  booking,
  status,
  approving,
  onApprove,
  onCancel,
  onRescheduleSuccess
}: {
  booking: Booking;
  status: BookingStatus;
  approving: boolean;
  onApprove: () => void;
  onCancel: () => void;
  onRescheduleSuccess: () => void;
}) {
  const [viewOpen, setViewOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const detail = useQuery({
    ...adminBookingQueryOptions(booking.id),
    enabled: viewOpen || manageOpen,
    staleTime: 0
  });
  const fallback = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Detail pemesanan</DialogTitle>
        <DialogDescription>Memuat data lengkap pemesanan.</DialogDescription>
      </DialogHeader>
      {detail.isError ? (
        <div role="alert" className="space-y-3">
          <p>{getApiErrorMessage(detail.error, 'Detail pemesanan belum dapat dimuat.')}</p>
          <Button variant="outline" onClick={() => void detail.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <p role="status">Memuat detail pemesanan...</p>
      )}
    </DialogContent>
  );
  const ready = detail.data && !detail.isError;
  return (
    <div className="flex items-center gap-2">
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Lihat detail ${booking.invoice?.number || booking.id}`}
            title="Lihat detail"
          >
            <IconEye />
          </Button>
        </DialogTrigger>
        {viewOpen &&
          (ready ? (
            <BookingDetailsDialog
              booking={detail.data!}
              status={detail.data!.status}
              onRescheduleSuccess={onRescheduleSuccess}
            />
          ) : (
            fallback
          ))}
      </Dialog>
      {status !== BookingStatus.CANCELLED && (
        <Dialog open={manageOpen} onOpenChange={setManageOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Kelola ${booking.invoice?.number || booking.id}`}
              title="Kelola pemesanan"
            >
              <IconPencil />
            </Button>
          </DialogTrigger>
          {manageOpen &&
            (ready ? (
              <BookingStatusDialog
                booking={detail.data!}
                status={detail.data!.status}
                approving={approving}
                onApprove={onApprove}
                onCancel={onCancel}
              />
            ) : (
              fallback
            ))}
        </Dialog>
      )}
    </div>
  );
}
