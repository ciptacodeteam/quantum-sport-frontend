'use client';

import { cancelBookedBallboyApi } from '@/api/admin/bookedBallboy';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { BOOKING_STATUS_BADGE_VARIANT, BOOKING_STATUS_MAP } from '@/lib/constants';
import { formatPhone } from '@/lib/utils';
import {
  adminBookedBallboyQueryOptions,
  adminBookedBallboysQueryOptions,
  type AdminBookedBallboyDetail,
  type AdminBookedBallboyListItem
} from '@/queries/admin/bookedBallboy';
import { IconEye, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';

const currency = (n: number) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;

type CourtSlotDisplay = {
  court: { id: string; name: string; sport?: string } | null;
  startAt?: string;
  endAt?: string;
  date?: string;
  time?: string;
  slot?: {
    id?: string;
    startAt: string;
    endAt: string;
    startTime?: string;
    endTime?: string;
  } | null;
};

const getCourtSlots = (item: AdminBookedBallboyListItem) => {
  const booking = item.booking ?? {};
  if (booking.courtSlots?.length) return booking.courtSlots as CourtSlotDisplay[];

  if (booking.details?.length) {
    return booking.details.map((detail) => ({
      court: detail.court ?? null,
      slot: detail.slot ?? null
    })) as CourtSlotDisplay[];
  }

  if (item.courtSlot) {
    return [
      {
        court: item.courtSlot.court ?? null,
        startAt: item.courtSlot.startAt,
        endAt: item.courtSlot.endAt,
        date: item.courtSlot.date,
        time:
          item.courtSlot.startTime && item.courtSlot.endTime
            ? `${item.courtSlot.startTime} - ${item.courtSlot.endTime}`
            : undefined
      }
    ] as CourtSlotDisplay[];
  }

  return [] as CourtSlotDisplay[];
};

const getSlotTimeText = (slot?: AdminBookedBallboyListItem['slot']) => {
  if (!slot) return '-';
  const startTime = slot.startTime || dayjs(slot.startAt).format('HH:mm');
  const endTime = slot.endTime || dayjs(slot.endAt).format('HH:mm');
  return `${dayjs(slot.startAt).format('DD MMM YYYY')} · ${startTime} - ${endTime}`;
};

const BookedBallboyTable = () => {
  const { confirmAndMutate: cancelBookedBallboy } = useConfirmMutation(
    {
      mutationFn: (id: string) => cancelBookedBallboyApi(id, 'Cancelled by admin')
    },
    {
      title: 'Batalkan Ballboy',
      description:
        'Apakah Anda yakin ingin membatalkan ballboy ini dari pemesanan? Ballboy akan hilang dari schedule dan detail booking.',
      confirmText: 'Batalkan',
      cancelText: 'Tutup',
      destructive: true,
      toastMessages: {
        loading: 'Membatalkan ballboy...',
        success: () => 'Ballboy berhasil dibatalkan.',
        error: 'Gagal membatalkan ballboy.'
      },
      invalidate: [
        ['admin', 'booked-ballboys'],
        ['admin', 'booked-inventories'],
        ['admin', 'bookings'],
        ['admin', 'schedule']
      ]
    }
  );

  const colHelper = createColumnHelper<AdminBookedBallboyListItem>();

  const columns = useMemo(
    () => [
      colHelper.accessor((row) => row.staff?.name ?? '-', {
        id: 'ballboy',
        header: 'Ballboy',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>
      }),
      colHelper.accessor((row) => row.booking?.status, {
        id: 'bookingStatus',
        header: 'Status Pemesanan',
        cell: (info) => {
          const bookingStatus = (info.getValue() || 'HOLD') as keyof typeof BOOKING_STATUS_MAP;
          return (
            <Badge variant={BOOKING_STATUS_BADGE_VARIANT[bookingStatus]}>
              {BOOKING_STATUS_MAP[bookingStatus]}
            </Badge>
          );
        }
      }),
      colHelper.accessor((row) => row.booking?.customer ?? row.booking?.user ?? null, {
        id: 'customer',
        header: 'Pelanggan',
        cell: (info) => {
          const customer = info.getValue();
          if (!customer) return '-';
          return (
            <div className="flex flex-col">
              <span className="font-medium">{customer.name}</span>
              {customer.phone && (
                <span className="text-muted-foreground text-xs">{formatPhone(customer.phone)}</span>
              )}
            </div>
          );
        }
      }),
      colHelper.accessor((row) => row.booking?.invoice ?? null, {
        header: 'Invoice',
        cell: (info) => {
          const invoice = info.getValue();
          if (!invoice) return <span className="text-muted-foreground">-</span>;
          return (
            <div className="flex flex-col">
              <span className="font-medium">{invoice.number}</span>
              <span className="text-muted-foreground text-xs">{invoice.status}</span>
            </div>
          );
        }
      }),
      colHelper.accessor((row) => row, {
        id: 'courtTime',
        header: 'Lapangan & Waktu',
        cell: (info) => {
          const slots = getCourtSlots(info.getValue());
          if (slots.length === 0) return '-';

          const first = slots[0];
          const startAt = first.slot?.startAt ?? first.startAt;
          const endAt = first.slot?.endAt ?? first.endAt;
          const time =
            first.time ||
            `${first.slot?.startTime || dayjs(startAt).format('HH:mm')} - ${
              first.slot?.endTime || dayjs(endAt).format('HH:mm')
            }`;
          const isExpired = endAt ? dayjs(endAt).isBefore(dayjs()) : false;

          return (
            <Tooltip>
              <TooltipTrigger>
                <div className="flex flex-col">
                  <span className="font-medium">{first.court?.name || '-'}</span>
                  <span
                    className={`text-xs ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}
                  >
                    {dayjs(startAt).format('DD MMM YYYY')} · {time}
                  </span>
                  {slots.length > 1 && (
                    <span className="text-muted-foreground text-xs">+{slots.length - 1} slot</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {slots.slice(0, 4).map((slot, idx) => {
                    const slotStartAt = slot.slot?.startAt ?? slot.startAt;
                    const slotEndAt = slot.slot?.endAt ?? slot.endAt;
                    const slotTime =
                      slot.time ||
                      `${slot.slot?.startTime || dayjs(slotStartAt).format('HH:mm')} - ${
                        slot.slot?.endTime || dayjs(slotEndAt).format('HH:mm')
                      }`;
                    return (
                      <div key={idx} className="text-xs">
                        {dayjs(slotStartAt).format('DD MMM')} - {slot.court?.name || '-'} (
                        {slotTime})
                      </div>
                    );
                  })}
                  {slots.length > 4 && (
                    <div className="text-muted-foreground text-xs">dan lainnya...</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        }
      }),
      colHelper.accessor((row) => row.slot, {
        id: 'ballboyTime',
        header: 'Waktu Ballboy',
        cell: (info) => <span className="text-sm">{getSlotTimeText(info.getValue())}</span>
      }),
      colHelper.accessor('price', {
        header: 'Harga',
        cell: (info) => <span className="tabular-nums">{currency(info.getValue())}</span>
      }),
      colHelper.accessor('createdAt', {
        header: 'Dibuat',
        cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY HH:mm')
      }),
      colHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2">
              <ManagedDialog id={`view-booked-ballboy-${item.id}`}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="lightInfo">
                    <IconEye />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader className="mb-4">
                    <DialogTitle>Detail Ballboy</DialogTitle>
                  </DialogHeader>
                  <BallboyDetail id={item.id} />
                </DialogContent>
              </ManagedDialog>
              <Button
                size="icon"
                variant="destructive"
                onClick={() => cancelBookedBallboy(item.id)}
                title="Batalkan Ballboy"
              >
                <IconX />
              </Button>
            </div>
          );
        }
      })
    ],
    [colHelper, cancelBookedBallboy]
  );

  const { data, isPending } = useQuery(adminBookedBallboysQueryOptions({}));

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
    />
  );
};

const BallboyDetail = ({ id }: { id: string }) => {
  const { data, isPending } = useQuery(adminBookedBallboyQueryOptions(id));

  if (isPending || !data) {
    return <div className="text-muted-foreground text-sm">Memuat detail...</div>;
  }

  const detail = data as AdminBookedBallboyDetail;
  const customer = detail.booking?.customer ?? detail.booking?.user ?? null;
  const invoice = detail.booking?.invoice ?? null;
  const courtSlots = getCourtSlots(detail);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Ballboy</p>
          <p className="font-medium">{detail.staff?.name || '-'}</p>
          {detail.staff?.phone && (
            <p className="text-muted-foreground text-xs">{formatPhone(detail.staff.phone)}</p>
          )}
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Pelanggan</p>
          <p className="font-medium">{customer?.name || '-'}</p>
          {customer?.phone && (
            <p className="text-muted-foreground text-xs">{formatPhone(customer.phone)}</p>
          )}
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Status Pemesanan</p>
          <Badge
            variant={
              BOOKING_STATUS_BADGE_VARIANT[
                detail.booking?.status as keyof typeof BOOKING_STATUS_MAP
              ]
            }
          >
            {BOOKING_STATUS_MAP[detail.booking?.status as keyof typeof BOOKING_STATUS_MAP]}
          </Badge>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Invoice</p>
          {invoice ? (
            <div className="flex flex-col">
              <span className="font-medium">{invoice.number}</span>
              <span className="text-muted-foreground text-xs">{invoice.status}</span>
              {invoice.payment?.method && (
                <span className="text-muted-foreground text-xs">
                  Metode: {(invoice.payment.method as any)?.name ?? invoice.payment.method}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Waktu Ballboy</p>
          <p className="text-sm">{getSlotTimeText(detail.slot)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Harga</p>
          <p className="text-sm">{currency(detail.price)}</p>
        </div>
      </div>

      {courtSlots.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Slot Lapangan</p>
          <div className="space-y-2">
            {courtSlots.map((courtSlot, idx) => {
              const startAt = courtSlot.slot?.startAt ?? courtSlot.startAt;
              const endAt = courtSlot.slot?.endAt ?? courtSlot.endAt;
              const time =
                courtSlot.time ||
                `${courtSlot.slot?.startTime || dayjs(startAt).format('HH:mm')} - ${
                  courtSlot.slot?.endTime || dayjs(endAt).format('HH:mm')
                }`;
              return (
                <div key={idx} className="bg-muted/50 rounded-lg border p-3">
                  <p className="font-medium">{courtSlot.court?.name || '-'}</p>
                  <p className="text-muted-foreground text-sm">
                    {dayjs(startAt).format('DD MMM YYYY')} · {time}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookedBallboyTable;
