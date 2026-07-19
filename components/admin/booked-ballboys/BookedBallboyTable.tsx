'use client';

import { cancelBookedBallboyApi } from '@/api/admin/bookedBallboy';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import DateRangeInput from '@/components/ui/date-range-input';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ManagedDialog
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { BOOKING_STATUS_BADGE_VARIANT, BOOKING_STATUS_MAP, ROLE } from '@/lib/constants';
import { formatPhone } from '@/lib/utils';
import {
  adminBookedBallboyQueryOptions,
  adminBookedBallboysQueryOptions,
  type AdminBookedBallboyDetail,
  type AdminBookedBallboyListItem
} from '@/queries/admin/bookedBallboy';
import useAuthStore from '@/stores/useAuthStore';
import { IconEye, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';

const currency = (n: number) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;
const BALLBOY_PAYOUT_PER_SESSION = 30000;
const BALLBOY_QUANTUM_FEE_PER_SESSION = 15000;

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
    date?: string;
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
  const date = slot.date || dayjs(slot.startAt).format('YYYY-MM-DD');
  return `${dayjs(date).format('DD MMM YYYY')} · ${startTime} - ${endTime}`;
};

const getCourtSlotDate = (slot: CourtSlotDisplay) => {
  const date = slot.slot?.date || slot.date;
  if (date) return dayjs(date);
  const startAt = slot.slot?.startAt ?? slot.startAt;
  return dayjs(startAt);
};

const getCustomer = (item: AdminBookedBallboyListItem) =>
  item.booking?.customer ?? item.booking?.user ?? null;

const getCustomerSearchText = (item: AdminBookedBallboyListItem) => {
  const customer = getCustomer(item);
  return [customer?.name, customer?.phone, customer?.email].filter(Boolean).join(' ');
};

const getBallboyStatus = (item: AdminBookedBallboyListItem) =>
  (item.status || item.ballboyStatus || item.booking?.status || 'HOLD') as keyof typeof BOOKING_STATUS_MAP;

const isActiveBallboyBooking = (item: AdminBookedBallboyListItem) =>
  getBallboyStatus(item) !== 'CANCELLED';

const isInDateRange = (item: AdminBookedBallboyListItem, range?: DateRange) => {
  if (!range?.from) return true;
  const slotDate = item.slot?.date
    ? dayjs(item.slot.date)
    : item.slot?.startAt
      ? dayjs(item.slot.startAt)
      : null;
  if (!slotDate?.isValid()) return false;

  const from = dayjs(range.from).startOf('day');
  const to = range.to ? dayjs(range.to).endOf('day') : dayjs(range.from).endOf('day');

  return !slotDate.isBefore(from) && !slotDate.isAfter(to);
};

const BookedBallboyTable = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserRole = (currentUser as { role?: string } | null)?.role;
  const isCashier = currentUserRole?.toUpperCase?.() === ROLE.CASHIER;

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
      colHelper.accessor((row) => getBallboyStatus(row), {
        id: 'bookingStatus',
        header: 'Status Ballboy',
        cell: (info) => {
          const bookingStatus = (info.getValue() || 'HOLD') as keyof typeof BOOKING_STATUS_MAP;
          return (
            <Badge variant={BOOKING_STATUS_BADGE_VARIANT[bookingStatus]}>
              {BOOKING_STATUS_MAP[bookingStatus]}
            </Badge>
          );
        }
      }),
      colHelper.accessor((row) => getCustomerSearchText(row), {
        id: 'customer',
        header: 'Pelanggan',
        cell: ({ row }) => {
          const customer = getCustomer(row.original);
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
                    {getCourtSlotDate(first).format('DD MMM YYYY')} · {time}
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
                        {getCourtSlotDate(slot).format('DD MMM')} - {slot.court?.name || '-'} (
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
          const canCancel = getBallboyStatus(item) !== 'CANCELLED';
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
              {canCancel && (
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => cancelBookedBallboy(item.id)}
                  title="Batalkan Ballboy"
                >
                  <IconX />
                </Button>
              )}
            </div>
          );
        }
      })
    ],
    [colHelper, cancelBookedBallboy]
  );

  const { data, isPending } = useQuery(adminBookedBallboysQueryOptions({}));
  const filteredData = useMemo(
    () => (data || []).filter((item) => isInDateRange(item, dateRange)),
    [data, dateRange]
  );
  const ballboySummary = useMemo(() => {
    const summary = new Map<
      string,
      {
        name: string;
        phone?: string | null;
        sessionHours: number;
        ballboyAmount: number;
        quantumAmount: number;
        bookingCount: number;
      }
    >();

    filteredData.filter(isActiveBallboyBooking).forEach((item) => {
      const key = item.staff?.id || item.id;
      const start = item.slot?.startAt ? dayjs(item.slot.startAt) : null;
      const end = item.slot?.endAt ? dayjs(item.slot.endAt) : null;
      const durationHours =
        start?.isValid() && end?.isValid() ? Math.max(end.diff(start, 'minute') / 60, 1) : 1;
      const existing = summary.get(key) || {
        name: item.staff?.name || 'Ballboy',
        phone: item.staff?.phone,
        sessionHours: 0,
        ballboyAmount: 0,
        quantumAmount: 0,
        bookingCount: 0
      };

      existing.sessionHours += durationHours;
      existing.ballboyAmount += durationHours * BALLBOY_PAYOUT_PER_SESSION;
      existing.quantumAmount += durationHours * BALLBOY_QUANTUM_FEE_PER_SESSION;
      existing.bookingCount += 1;
      summary.set(key, existing);
    });

    return Array.from(summary.values()).sort((a, b) => b.sessionHours - a.sessionHours);
  }, [filteredData]);

  return (
    <div className="space-y-4">
      {!isCashier && ballboySummary.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ballboySummary.map((item) => (
            <div key={item.name} className="rounded-md border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  {item.phone && (
                    <p className="text-muted-foreground text-xs">{formatPhone(item.phone)}</p>
                  )}
                </div>
                <Badge variant="outline">{item.bookingCount} booking</Badge>
              </div>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Sesi</p>
                  <p className="text-lg font-semibold">
                    {new Intl.NumberFormat('id-ID', {
                      maximumFractionDigits: 1
                    }).format(item.sessionHours)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ballboy</p>
                  <p className="text-lg font-semibold">{currency(item.ballboyAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quantum</p>
                  <p className="text-lg font-semibold">{currency(item.quantumAmount)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <DataTable
        loading={isPending}
        data={filteredData}
        rightActions={
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeInput
              value={dateRange}
              onValueChange={(range) => setDateRange(range ?? undefined)}
              className="sm:w-[260px]"
              placeholder="Range sesi"
            />
            {dateRange?.from && (
              <Button type="button" variant="outline" onClick={() => setDateRange(undefined)}>
                Reset Tanggal
              </Button>
            )}
          </div>
        }
        columns={columns}
        enableRowSelection={false}
      />
    </div>
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
                getBallboyStatus(detail)
              ]
            }
          >
            {BOOKING_STATUS_MAP[getBallboyStatus(detail)]}
          </Badge>
          {detail.cancelledAt && (
            <p className="text-muted-foreground mt-1 text-xs">
              Dibatalkan {dayjs(detail.cancelledAt).format('DD/MM/YYYY HH:mm')}
            </p>
          )}
          {detail.cancellationReason && (
            <p className="text-muted-foreground text-xs">{detail.cancellationReason}</p>
          )}
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
                    {getCourtSlotDate(courtSlot).format('DD MMM YYYY')} · {time}
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
