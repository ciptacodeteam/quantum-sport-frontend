'use client';

import { cancelBookingApi, updateBookingStatusApi } from '@/api/admin/booking';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ManagedDialog
} from '@/components/ui/dialog';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { BOOKING_STATUS_BADGE_VARIANT, BOOKING_STATUS_MAP, BookingStatus } from '@/lib/constants';
import { formatPhone } from '@/lib/utils';
import { adminBookingsQueryOptions } from '@/queries/admin/booking';
import type { Booking } from '@/types/model';
import { IconEye, IconPencil, IconPlus, IconX } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { toast } from 'sonner';

// Helper function to convert numeric status to BookingStatus enum
const getBookingStatus = (status: number | BookingStatus): BookingStatus => {
  if (typeof status === 'string') {
    return status as BookingStatus;
  }
  // Map numeric enum to string enum
  const statusMap: Record<number, BookingStatus> = {
    0: BookingStatus.HOLD,
    1: BookingStatus.CONFIRMED,
    2: BookingStatus.CANCELLED
  };
  return statusMap[status] || BookingStatus.HOLD;
};

const BookingTable = () => {
  const queryClient = useQueryClient();

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateBookingStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      toast.success('Status pemesanan berhasil diperbarui.');
    },
    onError: () => {
      toast.error('Gagal memperbarui status pemesanan.');
    }
  });

  const { confirmAndMutate: cancelBooking } = useConfirmMutation(
    {
      mutationFn: (id: string) => cancelBookingApi(id, 'Dibatalkan oleh admin')
    },
    {
      title: 'Batalkan Pemesanan',
      description: 'Apakah Anda yakin ingin membatalkan pemesanan ini?',
      confirmText: 'Batalkan',
      cancelText: 'Batal',
      destructive: true,
      toastMessages: {
        loading: 'Membatalkan pemesanan...',
        success: () => 'Pemesanan berhasil dibatalkan.',
        error: 'Gagal membatalkan pemesanan.'
      },
      invalidate: ['admin', 'bookings']
    }
  );

  const colHelper = createColumnHelper<Booking>();

  const columns = useMemo(
    () => [
      colHelper.accessor('id', {
        header: 'ID Pemesanan',
        cell: (info) => <span className="font-mono text-xs">{info.getValue().slice(0, 8)}...</span>
      }),
      colHelper.accessor('user', {
        header: 'Pelanggan',
        cell: (info) => {
          const user = info.getValue();
          if (!user) return '-';
          return (
            <div className="flex flex-col">
              <span className="font-medium">{user.name}</span>
              {user.phone && (
                <span className="text-muted-foreground text-xs">{formatPhone(user.phone)}</span>
              )}
            </div>
          );
        }
      }),
      colHelper.accessor('details', {
        header: 'Lapangan & Waktu',
        cell: (info) => {
          const details = info.getValue();
          if (!details || details.length === 0) return '-';
          const firstDetail = details[0];
          const court = firstDetail.court;
          const slot = firstDetail.slot;
          return (
            <div className="flex flex-col">
              <span className="font-medium">{court?.name || '-'}</span>
              {slot && (
                <span className="text-muted-foreground text-xs">
                  {dayjs(slot.startAt).format('DD MMM YYYY')} -{' '}
                  {dayjs(slot.startAt).format('HH:mm')} - {dayjs(slot.endAt).format('HH:mm')}
                </span>
              )}
              {details.length > 1 && (
                <span className="text-muted-foreground text-xs">+{details.length - 1} slot</span>
              )}
            </div>
          );
        }
      }),
      colHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = getBookingStatus(info.getValue() as number | BookingStatus);
          return (
            <Badge variant={BOOKING_STATUS_BADGE_VARIANT[status]}>
              {BOOKING_STATUS_MAP[status]}
            </Badge>
          );
        }
      }),
      colHelper.accessor('totalPrice', {
        header: 'Total Harga',
        cell: (info) => {
          const total = info.getValue();
          const processingFee = info.row.original.processingFee || 0;
          return (
            <div className="flex flex-col">
              <span className="font-medium">
                Rp {new Intl.NumberFormat('id-ID').format(total + processingFee)}
              </span>
              {processingFee > 0 && (
                <span className="text-muted-foreground text-xs">
                  (termasuk fee: Rp {new Intl.NumberFormat('id-ID').format(processingFee)})
                </span>
              )}
            </div>
          );
        }
      }),
      colHelper.accessor('createdAt', {
        header: 'Dibuat Pada',
        cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY HH:mm')
      }),
      colHelper.accessor('holdExpiresAt', {
        header: 'Kedaluwarsa',
        cell: (info) => {
          const expiresAt = info.getValue();
          if (!expiresAt) return '-';
          const isExpired = dayjs(expiresAt).isBefore(dayjs());
          return (
            <Tooltip>
              <TooltipTrigger>
                <span className={isExpired ? 'text-destructive' : ''}>
                  {dayjs(expiresAt).format('DD/MM/YYYY HH:mm')}
                </span>
              </TooltipTrigger>
              {isExpired && (
                <TooltipContent>
                  <p>Pemesanan sudah kedaluwarsa</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        }
      }),
      colHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const booking = row.original;
          const status = getBookingStatus(booking.status as number | BookingStatus);

          return (
            <div className="flex items-center gap-2">
              <ManagedDialog id={`view-booking-${booking.id}`}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="lightInfo">
                    <IconEye />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader className="mb-4">
                    <DialogTitle>Detail Pemesanan</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground text-sm">ID Pemesanan</p>
                        <p className="font-mono text-sm">{booking.id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Status</p>
                        <Badge variant={BOOKING_STATUS_BADGE_VARIANT[status]}>
                          {BOOKING_STATUS_MAP[status]}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Pelanggan</p>
                        <p className="font-medium">{booking.user?.name || '-'}</p>
                        {booking.user?.phone && (
                          <p className="text-muted-foreground text-xs">
                            {formatPhone(booking.user.phone)}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Total Harga</p>
                        <p className="font-medium">
                          Rp{' '}
                          {new Intl.NumberFormat('id-ID').format(
                            booking.totalPrice + (booking.processingFee || 0)
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Dibuat Pada</p>
                        <p className="text-sm">
                          {dayjs(booking.createdAt).format('DD/MM/YYYY HH:mm')}
                        </p>
                      </div>
                      {booking.holdExpiresAt && (
                        <div>
                          <p className="text-muted-foreground text-sm">Kedaluwarsa</p>
                          <p className="text-sm">
                            {dayjs(booking.holdExpiresAt).format('DD/MM/YYYY HH:mm')}
                          </p>
                        </div>
                      )}
                    </div>
                    {booking.details && booking.details.length > 0 && (
                      <div className="border-t pt-4">
                        <p className="mb-2 text-sm font-medium">Detail Slot</p>
                        <div className="space-y-2">
                          {booking.details.map((detail) => (
                            <div key={detail.id} className="bg-muted/50 rounded-lg border p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium">{detail.court?.name || '-'}</p>
                                  {detail.slot && (
                                    <p className="text-muted-foreground text-xs">
                                      {dayjs(detail.slot.startAt).format('DD MMM YYYY')} -{' '}
                                      {dayjs(detail.slot.startAt).format('HH:mm')} -{' '}
                                      {dayjs(detail.slot.endAt).format('HH:mm')}
                                    </p>
                                  )}
                                </div>
                                <p className="text-base font-medium">
                                  Rp {new Intl.NumberFormat('id-ID').format(detail.price)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {booking.cancellationReason && (
                      <div>
                        <p className="text-muted-foreground text-sm">Alasan Pembatalan</p>
                        <p className="text-sm">{booking.cancellationReason}</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </ManagedDialog>

              {status !== BookingStatus.CANCELLED && (
                <ManagedDialog id={`edit-booking-${booking.id}`}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="lightInfo">
                      <IconPencil />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader className="mb-2">
                      <DialogTitle className="text-base">Ubah Status Pemesanan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Booking Info Summary */}
                      <div className="bg-muted/50 space-y-3 rounded-lg border p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-muted-foreground text-xs">ID Pemesanan</p>
                            <p className="font-mono text-sm">{booking.id.slice(0, 12)}...</p>
                          </div>
                          <Badge variant={BOOKING_STATUS_BADGE_VARIANT[status]}>
                            {BOOKING_STATUS_MAP[status]}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div>
                            <p className="text-muted-foreground text-xs">Pelanggan</p>
                            <p className="text-sm font-medium">{booking.user?.name || '-'}</p>
                            {booking.user?.phone && (
                              <p className="text-muted-foreground text-xs">
                                {formatPhone(booking.user.phone)}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Total Harga</p>
                            <p className="text-sm font-medium">
                              Rp{' '}
                              {new Intl.NumberFormat('id-ID').format(
                                booking.totalPrice + (booking.processingFee || 0)
                              )}
                            </p>
                          </div>
                        </div>

                        {booking.details && booking.details.length > 0 && (
                          <div className="border-t pt-3">
                            <p className="text-muted-foreground mb-2 text-xs">Detail Pemesanan</p>
                            <div className="space-y-2">
                              {booking.details.slice(0, 2).map((detail) => (
                                <div
                                  key={detail.id}
                                  className="flex items-start justify-between text-sm"
                                >
                                  <div>
                                    <p className="font-medium">{detail.court?.name || '-'}</p>
                                    {detail.slot && (
                                      <p className="text-muted-foreground text-xs">
                                        {dayjs(detail.slot.startAt).format('DD MMM, HH:mm')} -{' '}
                                        {dayjs(detail.slot.endAt).format('HH:mm')}
                                      </p>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground text-xs">
                                    Rp {new Intl.NumberFormat('id-ID').format(detail.price)}
                                  </p>
                                </div>
                              ))}
                              {booking.details.length > 2 && (
                                <p className="text-muted-foreground text-xs">
                                  +{booking.details.length - 2} slot lainnya
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {booking.holdExpiresAt && status === BookingStatus.HOLD && (
                          <div className="border-t pt-3">
                            <p className="text-muted-foreground text-xs">Kedaluwarsa</p>
                            <p className="text-sm">
                              {dayjs(booking.holdExpiresAt).format('DD MMM YYYY, HH:mm')}
                            </p>
                            {dayjs(booking.holdExpiresAt).isBefore(dayjs()) && (
                              <p className="text-destructive mt-1 text-xs">
                                ⚠️ Pemesanan sudah kedaluwarsa
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status Actions */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium">Tindakan yang Tersedia</p>
                        <div className="flex flex-col gap-2">
                          {status === BookingStatus.HOLD && (
                            <Button
                              onClick={() =>
                                updateStatus({
                                  id: booking.id,
                                  status: BookingStatus.CONFIRMED
                                })
                              }
                              className="w-full justify-start py-7"
                              variant="default"
                            >
                              <IconPencil className="mr-2" />
                              <div className="flex flex-col items-start">
                                <span>Konfirmasi Pemesanan</span>
                                <span className="text-xs opacity-80">
                                  Ubah status menjadi Confirmed
                                </span>
                              </div>
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            onClick={() => cancelBooking(booking.id)}
                            className="w-full justify-start py-7"
                          >
                            <IconX className="mr-2" />
                            <div className="flex flex-col items-start">
                              <span>Batalkan Pemesanan</span>
                              <span className="text-xs opacity-80">
                                Pemesanan tidak dapat diproses
                              </span>
                            </div>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </ManagedDialog>
              )}
            </div>
          );
        }
      })
    ],
    [colHelper, updateStatus, cancelBooking]
  );

  const { data, isPending } = useQuery(adminBookingsQueryOptions());

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
      addButton={
        <Link href="/admin/kelola-pemesanan/lapangan/tambah" prefetch>
          <Button>
            <IconPlus />
            Tambah
          </Button>
        </Link>
      }
    />
  );
};
export default BookingTable;
