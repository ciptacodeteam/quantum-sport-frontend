'use client';

import {
  approveBookingApi,
  cancelBookingApi,
  exportBookingsApi,
  updateBookingStatusApi
} from '@/api/admin/booking';
import {
  RescheduleCourtDialog,
  type BookingDetailWithSlot
} from '@/components/admin/bookings/RescheduleCourtDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/clipboard-copy';
import { DataTable } from '@/components/ui/data-table';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ManagedDialog
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { BOOKING_STATUS_BADGE_VARIANT, BOOKING_STATUS_MAP, BookingStatus } from '@/lib/constants';
import { formatSlotTime } from '@/lib/time-utils';
import { formatPhone, getTwoWordName } from '@/lib/utils';
import { adminBookingsQueryOptions } from '@/queries/admin/booking';
import type { Booking } from '@/types/model';
import { IconEye, IconFileExcel, IconPencil, IconPlus, IconX } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { format, subDays } from 'date-fns';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

// Helper function to parse ISO string without timezone conversion
const parseISOString = (
  value: string
): { year: number; month: number; day: number; hours: number; minutes: number } | null => {
  // Handle ISO format: "2024-01-15T07:00:00Z" or "2024-01-15T07:00:00+07:00" or "2024-01-15T07:00:00.000Z"
  const isoRegex =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
  const match = value.match(isoRegex);

  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10) - 1, // Month is 0-indexed
      day: parseInt(match[3], 10),
      hours: parseInt(match[4], 10),
      minutes: parseInt(match[5], 10)
    };
  }

  return null;
};

// Helper functions to replace dayjs
const formatDate = (date: Date | string, format: string): string => {
  let dateObj: Date;

  // Use native Date parsing which correctly handles timezones
  // The Date constructor will parse ISO strings and convert them to local time
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return '-';
  }

  // Get local time components (Date automatically converts UTC to local timezone)
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const day = dateObj.getDate();
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();

  const pad = (n: number) => n.toString().padStart(2, '0');

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  return format
    .replace('YYYY', year.toString())
    .replace('MMM', monthNames[month])
    .replace('MM', pad(month + 1))
    .replace('DD', pad(day))
    .replace('HH', pad(hours))
    .replace('mm', pad(minutes));
};

const formatSlotDate = (date: Date | string, format: string): string => {
  if (typeof date === 'string') {
    const parsed = parseISOString(date);
    if (parsed) {
      const dateObj = new Date(parsed.year, parsed.month, parsed.day, parsed.hours, parsed.minutes);
      return formatDate(dateObj, format);
    }
  }
  return formatDate(date, format);
};

const isBefore = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  return d1.getTime() < d2.getTime();
};

const differenceInDays = (date1: Date | string, date2: Date | string = new Date()): number => {
  const d1 = date1 instanceof Date ? new Date(date1.getTime()) : new Date(date1);
  const d2 = date2 instanceof Date ? new Date(date2.getTime()) : new Date(date2);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return 0;
  }

  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  const diff = d1.getTime() - d2.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
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

const BookingTable = () => {
  const queryClient = useQueryClient();
  const [source, setSource] = useState<string>('');
  const [range, setRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

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

  const { mutate: approveBooking } = useMutation({
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
          <div className="flex items-center gap-2">
            {info.getValue()?.slice(0, 8) + '...'}
            <CopyButton variant={'ghost'} size={'sm'} content={info.getValue() || '-'} />
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
                  {formatSlotDate(slot.startAt, 'DD MMM YYYY')} - {formatSlotTime(slot.startAt)} -{' '}
                  {formatSlotTime(slot.endAt)}
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
                  <Button size="icon" variant="lightInfo">
                    <IconEye />
                  </Button>
                </DialogTrigger>
                <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col">
                  <DialogHeader className="mb-4 shrink-0">
                    <DialogTitle>Detail Pemesanan</DialogTitle>
                  </DialogHeader>
                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground text-sm">ID Pemesanan</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm">{booking.invoice?.number}</p>
                          <CopyButton
                            content={booking.invoice?.number || '-'}
                            variant={'ghost'}
                            size={'sm'}
                          />
                        </div>
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
                          {formatDate(booking.createdAt, 'DD/MM/YYYY HH:mm')}
                        </p>
                      </div>
                      {booking.holdExpiresAt && (
                        <div>
                          <p className="text-muted-foreground text-sm">Kedaluwarsa</p>
                          <p className="text-sm">
                            {formatDate(booking.holdExpiresAt, 'DD/MM/YYYY HH:mm')}
                          </p>
                        </div>
                      )}
                    </div>
                    {booking.details && booking.details.length > 0 && (
                      <div className="border-t pt-4">
                        <p className="mb-2 text-sm font-medium">Detail Slot</p>
                        <div className="space-y-2">
                          {booking.details.map((detail) => {
                            const slotStart = detail.slot?.startAt;
                            const daysUntil = slotStart ? differenceInDays(slotStart) : -1;
                            const canReschedule = !!slotStart && daysUntil >= 3;

                            return (
                              <div key={detail.id} className="bg-muted/50 rounded-lg border p-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="text-sm font-medium">
                                      {detail.court?.name || '-'}
                                    </p>
                                    {detail.slot && (
                                      <p className="text-muted-foreground text-xs">
                                        {formatSlotDate(detail.slot.startAt, 'DD MMM YYYY')} -{' '}
                                        {formatSlotTime(detail.slot.startAt)} -{' '}
                                        {formatSlotTime(detail.slot.endAt)}
                                      </p>
                                    )}
                                    {!canReschedule && slotStart && (
                                      <p className="mt-1 text-[11px] text-amber-600">
                                        Reschedule hanya tersedia hingga H-3 (
                                        {Math.max(daysUntil, 0)} hari tersisa)
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <p className="text-base font-medium">
                                      Rp {new Intl.NumberFormat('id-ID').format(detail.price)}
                                    </p>
                                    {detail.slot && status !== BookingStatus.CANCELLED && (
                                      <RescheduleCourtDialog
                                        detail={detail as BookingDetailWithSlot}
                                        canReschedule={canReschedule}
                                        onSuccess={() =>
                                          queryClient.invalidateQueries({
                                            queryKey: ['admin', 'bookings']
                                          })
                                        }
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
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
                  <DialogContent className="flex max-h-[90vh] max-w-lg flex-col">
                    <DialogHeader className="mb-2 shrink-0">
                      <DialogTitle className="text-base">Ubah Status Pemesanan</DialogTitle>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
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
                                        {formatSlotDate(detail.slot.startAt, 'DD MMM, HH:mm')} -{' '}
                                        {formatSlotTime(detail.slot.endAt)}
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
                              {formatDate(booking.holdExpiresAt, 'DD MMM YYYY, HH:mm')}
                            </p>
                            {isBefore(booking.holdExpiresAt, new Date()) && (
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
                              onClick={() => approveBooking(booking.id)}
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
    [colHelper, updateStatus, approveBooking, cancelBooking, queryClient]
  );

  const { data, isPending } = useQuery(
    adminBookingsQueryOptions(source && source !== 'all' ? { source } : {})
  );

  return (
    <div className="space-y-4">
      <DataTable
        loading={isPending}
        data={data || []}
        columns={columns}
        enableRowSelection={false}
        rightActions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="source-filter" className="text-sm font-medium">
                Filter Sumber:
              </label>
              <Select value={source || 'all'} onValueChange={setSource}>
                <SelectTrigger id="source-filter" className="w-[180px]">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* <DateRangeInput value={range} onValueChange={(r) => setRange(r ?? undefined)} /> */}

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const startDate = range?.from
                    ? format(range.from, "yyyy-MM-dd'T'00:00:00'Z'")
                    : undefined;
                  const endDate = range?.to
                    ? format(range.to, "yyyy-MM-dd'T'23:59:59'Z'")
                    : undefined;

                  const params: any = {};
                  if (source && source !== 'all') params.source = source;
                  if (startDate) params.startDate = startDate;
                  if (endDate) params.endDate = endDate;

                  const blob = await exportBookingsApi(params);
                  const url = window.URL.createObjectURL(new Blob([blob]));
                  const link = document.createElement('a');
                  link.href = url;
                  const filename = `bookings-export-${new Date().toISOString().split('T')[0]}.xlsx`;
                  link.setAttribute('download', filename);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
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
              className="justify-start"
            >
              <IconFileExcel className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        }
        addButton={
          <Link href="/admin/booking-lapangan" prefetch>
            <Button>
              <IconPlus />
              Tambah
            </Button>
          </Link>
        }
      />
    </div>
  );
};
export default BookingTable;
