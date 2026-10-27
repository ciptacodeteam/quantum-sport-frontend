'use client';

import {
  approveBookingApi,
  cancelBookingApi,
  exportBookingsApi,
  updateBookingStatusApi
} from '@/api/admin/booking';
import BookingDetailsDialog from '@/components/admin/bookings/BookingDetailsDialog';
import BookingStatusDialog from '@/components/admin/bookings/BookingStatusDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/clipboard-copy';
import { DataTable } from '@/components/ui/data-table';
import { DialogTrigger, ManagedDialog } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { BOOKING_STATUS_BADGE_VARIANT, BookingStatus } from '@/lib/constants';
import { bookingScheduleInJakarta, formatBookingDate } from '@/lib/booking-display';
import { formatPhone, getTwoWordName } from '@/lib/utils';
import { adminBookingsQueryOptions } from '@/queries/admin/booking';
import type { Booking } from '@/types/model';
import { IconEye, IconFileExcel, IconPencil, IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const formatDate = formatBookingDate;

const isBefore = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  return d1.getTime() < d2.getTime();
};

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

type BookingTableProps = {
  courtSport?: 'PADEL' | 'TENNIS';
};

const BookingTable = ({ courtSport }: BookingTableProps) => {
  const queryClient = useQueryClient();
  const [checkoutType, setCheckoutType] = useState('all');

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateBookingStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedule'] });
      toast.success('Status pemesanan berhasil diperbarui.');
    },
    onError: () => {
      toast.error('Gagal memperbarui status pemesanan.');
    }
  });

  const {
    mutate: approveBooking,
    isPending: isApproving,
    variables: approvingBookingId
  } = useMutation({
    mutationFn: (id: string) => approveBookingApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedule'] });
      toast.success('Pemesanan berhasil dikonfirmasi.');
    },
    onError: () => {
      toast.error('Gagal mengkonfirmasi pemesanan.');
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
      invalidate: [
        ['admin', 'bookings'],
        ['admin', 'schedule']
      ]
    }
  );

  const colHelper = createColumnHelper<Booking>();

  const columns = useMemo(
    () => [
      colHelper.accessor('invoice.number', {
        header: 'Invoice',
        cell: (info) => (
          <div className="flex min-w-44 items-center gap-2">
            <span className="font-mono text-xs" title={info.getValue() || undefined}>
              {info.getValue() || 'Belum ada invoice'}
            </span>
            {info.getValue() && (
              <CopyButton
                variant="ghost"
                size="sm"
                aria-label="Salin nomor invoice"
                content={info.getValue()}
              />
            )}
          </div>
        )
      }),
      colHelper.accessor('user.name', {
        header: 'Pelanggan',
        cell: ({ row, getValue }) => {
          const user = row.original.user;
          if (!user) return '-';
          return (
            <div className="flex flex-col">
              <span className="font-medium">{getValue()}</span>
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
          const schedules = bookingScheduleInJakarta(info.getValue() || []).flatMap((date) =>
            date.courts.flatMap((court) =>
              court.ranges.map((range) => ({ date: date.date, court: court.name, range }))
            )
          );
          if (!schedules.length) return '-';
          return (
            <div className="min-w-52 space-y-2">
              {schedules.slice(0, 2).map((schedule, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-sm font-medium">{schedule.court}</p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {formatBookingDate(schedule.range.start, 'DD MMM YYYY')} ·{' '}
                    {schedule.range.start.slice(11)}–{schedule.range.end.slice(11)} WIB
                  </p>
                </div>
              ))}
              {schedules.length > 2 && (
                <p className="text-muted-foreground text-xs">
                  +{schedules.length - 2} jadwal lainnya
                </p>
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
            <div className="space-y-1.5">
              <Badge variant={BOOKING_STATUS_BADGE_VARIANT[status]}>
                {status === BookingStatus.CONFIRMED
                  ? 'Dikonfirmasi'
                  : status === BookingStatus.HOLD
                    ? 'Menunggu'
                    : 'Dibatalkan'}
              </Badge>
              {status === BookingStatus.HOLD && info.row.original.holdExpiresAt && (
                <p className="text-muted-foreground text-xs">
                  Batas {formatDate(info.row.original.holdExpiresAt, 'DD MMM, HH:mm')}
                </p>
              )}
            </div>
          );
        }
      }),
      colHelper.accessor('totalPrice', {
        header: 'Total',
        cell: (info) => {
          const total = info.getValue();
          const processingFee = info.row.original.processingFee || 0;
          return (
            <div className="flex flex-col">
              <span className="font-semibold tabular-nums">
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
        cell: (info) => {
          return (
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">
                {info.row.original.cashier
                  ? `Kasir: ${getTwoWordName(info.row.original.cashier.name)}`
                  : 'Online'}
              </span>

              {formatDate(info.getValue(), 'DD/MM/YYYY HH:mm')}
            </div>
          );
        }
      }),
      colHelper.accessor('holdExpiresAt', {
        header: 'Kedaluwarsa',
        cell: (info) => {
          const expiresAt = info.getValue();
          if (!expiresAt) return '-';
          const now = new Date();
          const isExpired = isBefore(expiresAt, now);
          return (
            <Tooltip>
              <TooltipTrigger>
                <span className={isExpired ? 'text-destructive' : ''}>
                  {formatDate(expiresAt, 'DD/MM/YYYY HH:mm')}
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
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Lihat detail ${booking.invoice?.number || booking.id}`}
                    title="Lihat detail"
                  >
                    <IconEye />
                  </Button>
                </DialogTrigger>
                <BookingDetailsDialog
                  booking={booking}
                  status={status}
                  onRescheduleSuccess={() => {
                    void queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
                    void queryClient.invalidateQueries({ queryKey: ['admin', 'schedule'] });
                  }}
                />
              </ManagedDialog>

              {status !== BookingStatus.CANCELLED && (
                <ManagedDialog id={`edit-booking-${booking.id}`}>
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
                  <BookingStatusDialog
                    booking={booking}
                    status={status}
                    approving={isApproving && approvingBookingId === booking.id}
                    onApprove={() => approveBooking(booking.id)}
                    onCancel={() => void cancelBooking(booking.id)}
                  />
                </ManagedDialog>
              )}
            </div>
          );
        }
      })
    ],
    [
      colHelper,
      updateStatus,
      approveBooking,
      isApproving,
      approvingBookingId,
      cancelBooking,
      queryClient
    ]
  );

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (checkoutType !== 'all') params.checkoutType = checkoutType;
    if (courtSport) params.courtSport = courtSport;
    return params;
  }, [checkoutType, courtSport]);

  const { data, isPending } = useQuery(adminBookingsQueryOptions(queryParams));

  return (
    <div className="[&_thead]:bg-muted/50 min-w-0 space-y-4 [&_td]:align-middle [&_th]:text-xs">
      <DataTable
        loading={isPending}
        data={data || []}
        columns={columns}
        enableRowSelection={false}
        getRowId={(row) => row.id}
        searchPlaceholder="Cari invoice atau pelanggan..."
        columnVisibilityLabel="Kolom"
        columnVisibilityStorageKey={`quantum:booking-columns:${courtSport || 'all'}`}
        rightActions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <label htmlFor="checkout-filter" className="sr-only">
                Jenis checkout
              </label>
              <Select value={checkoutType} onValueChange={setCheckoutType}>
                <SelectTrigger id="checkout-filter" className="h-9 w-48 rounded-lg shadow-none">
                  <SelectValue placeholder="Semua checkout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua checkout</SelectItem>
                  <SelectItem value="regular">Reguler</SelectItem>
                  <SelectItem value="membership">Membership</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const params: Record<string, string> = {};
                  if (checkoutType !== 'all') params.checkoutType = checkoutType;
                  if (courtSport) params.courtSport = courtSport;

                  const blob = await exportBookingsApi(params);
                  const url = window.URL.createObjectURL(new Blob([blob]));
                  const link = document.createElement('a');
                  link.href = url;
                  const filename = `bookings-export-${new Date().toISOString().split('T')[0]}.xlsx`;
                  link.setAttribute('download', filename);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                  toast.success('Export Successful', {
                    description: 'Bookings data has been exported successfully.'
                  });
                } catch (error) {
                  console.error('Bookings export failed:', error);
                  toast.error('Export Failed', {
                    description: 'Failed to export bookings. Please try again.'
                  });
                }
              }}
              className="h-9 justify-start rounded-lg shadow-none"
            >
              <IconFileExcel className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        }
        addButton={
          <Button asChild className="h-9 rounded-lg">
            <Link
              href={`/admin/booking-lapangan${courtSport ? `?courtSport=${courtSport}` : ''}`}
              prefetch
            >
              <IconPlus />
              Tambah booking
            </Link>
          </Button>
        }
      />
    </div>
  );
};
export default BookingTable;
