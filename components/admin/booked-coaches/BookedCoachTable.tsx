'use client';

import { cancelBookedCoachApi } from '@/api/admin/bookedCoach';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
  adminBookedCoachQueryOptions,
  adminBookedCoachesQueryOptions,
  type AdminBookedCoachDetail,
  type AdminBookedCoachListItem
} from '@/queries/admin/bookedCoach';
import { IconEye, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

const BookedCoachTable = () => {
  const [source, setSource] = useState<string>('');
  const { confirmAndMutate: cancelBookedCoach } = useConfirmMutation(
    {
      mutationFn: (id: string) => cancelBookedCoachApi(id, 'Cancelled by admin')
    },
    {
      title: 'Batalkan Coach',
      description: 'Apakah Anda yakin ingin membatalkan coach ini dari pemesanan?',
      confirmText: 'Batalkan',
      cancelText: 'Tutup',
      destructive: true,
      toastMessages: {
        loading: 'Membatalkan coach...',
        success: () => 'Coach berhasil dibatalkan.',
        error: 'Gagal membatalkan coach.'
      },
      invalidate: ['admin', 'booked-coaches']
    }
  );

  const colHelper = createColumnHelper<AdminBookedCoachListItem>();

  const columns = useMemo(
    () => [
      // Coach info (with fallbacks for different API shapes) – only show coach name
      colHelper.accessor((row) => row, {
        id: 'coach',
        header: 'Coach',
        cell: (info) => {
          const row = info.getValue() as AdminBookedCoachListItem & {
            staff?: any;
            coachName?: string;
          };

          // Primary source: row.coach
          const coach: any = row.coach ?? null;

          // Fallbacks if API sends flattened staff/coach fields
          const staff = coach?.staff ?? (row as any).staff ?? null;
          const name: string =
            staff?.name ?? coach?.name ?? (row as any).coachName ?? (row as any).name ?? '-';

          if (!name || name === '-') {
            return '-';
          }

          return <span className="font-medium">{name}</span>;
        }
      }),
      colHelper.accessor((row) => row.booking?.status, {
        id: 'bookingStatus',
        header: 'Status Pemesanan',
        cell: (info) => {
          const status = (info.getValue() || 'HOLD') as keyof typeof BOOKING_STATUS_MAP;
          return (
            <Badge variant={BOOKING_STATUS_BADGE_VARIANT[status]}>
              {BOOKING_STATUS_MAP[status]}
            </Badge>
          );
        }
      }),
      colHelper.accessor((row) => row.booking?.customer, {
        id: 'customer',
        header: 'Pelanggan',
        cell: (info) => {
          const customer = info.getValue() as any;
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
          const invoice = info.getValue() as any;
          if (!invoice) return <span className="text-muted-foreground">-</span>;
          return (
            <div className="flex flex-col">
              <span className="font-medium">{invoice.number}</span>
              <span className="text-muted-foreground text-xs">{invoice.status}</span>
            </div>
          );
        }
      }),
      // Court & time info (Lapangan & Waktu) with multiple fallbacks
      colHelper.accessor((row) => row, {
        id: 'courtTime',
        header: 'Lapangan & Waktu',
        cell: (info) => {
          const row = info.getValue() as AdminBookedCoachListItem & {
            courtSlots?: any[];
            booking?: any;
            slot?: any;
          };

          // Primary: court slots on the booking
          const booking = row.booking ?? {};
          let slots: any[] =
            booking.courtSlots ??
            // Fallback: some APIs may put court slots directly on the row
            (row as any).courtSlots ??
            [];

          // Additional fallback: derive from booking.details (if present)
          if ((!slots || slots.length === 0) && Array.isArray(booking.details)) {
            slots = booking.details.map((d: any) => ({
              court: d.court ?? null,
              startAt: d.slot?.startAt ?? d.startAt,
              endAt: d.slot?.endAt ?? d.endAt,
              time: d.slot ? `${d.slot.startTime} - ${d.slot.endTime}` : (d.time ?? null)
            }));
          }

          // Fallback: derive from top-level slot (list API example)
          if ((!slots || slots.length === 0) && row.slot) {
            const s = row.slot as any;
            slots = [
              {
                court: null,
                startAt: s.startAt,
                endAt: s.endAt,
                time: s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : null
              }
            ];
          }

          if (!slots || slots.length === 0) return '-';

          const first = slots[0];
          const isExpired = first.endAt ? dayjs(first.endAt).isBefore(dayjs()) : false;
          const timeDisplay =
            first.time ||
            `${dayjs(first.startAt).format('HH:mm')} - ${dayjs(first.endAt).format('HH:mm')}`;

          return (
            <Tooltip>
              <TooltipTrigger>
                <div className="flex flex-col">
                  <span className="font-medium">{first.court?.name || '-'}</span>
                  <span
                    className={`text-xs ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}
                  >
                    {dayjs(first.startAt).format('DD MMM YYYY')} · {timeDisplay}
                  </span>
                  {slots.length > 1 && (
                    <span className="text-muted-foreground text-xs">+{slots.length - 1} slot</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {slots.slice(0, 4).map((s, idx) => {
                    const t =
                      s.time ||
                      `${dayjs(s.startAt).format('HH:mm')} - ${dayjs(s.endAt).format('HH:mm')}`;
                    return (
                      <div key={idx} className="text-xs">
                        {dayjs(s.startAt).format('DD MMM')} — {s.court?.name || '-'} ({t})
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
              <ManagedDialog id={`view-booked-coach-${item.id}`}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="lightInfo">
                    <IconEye />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader className="mb-4">
                    <DialogTitle>Detail Coach</DialogTitle>
                  </DialogHeader>
                  <CoachDetail id={item.id} />
                </DialogContent>
              </ManagedDialog>
              <Button
                size="icon"
                variant="destructive"
                onClick={() => cancelBookedCoach(item.id)}
                title="Batalkan Coach"
              >
                <IconX />
              </Button>
            </div>
          );
        }
      })
    ],
    [colHelper, cancelBookedCoach]
  );

  const { data, isPending } = useQuery(
    adminBookedCoachesQueryOptions(source && source !== 'all' ? { source } : {})
  );

  return (
    <div className="space-y-4">
      <DataTable
        loading={isPending}
        data={data || []}
        rightActions={
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
        }
        columns={columns}
        enableRowSelection={false}
      />
    </div>
  );
};

const CoachDetail = ({ id }: { id: string }) => {
  const { data, isPending } = useQuery(adminBookedCoachQueryOptions(id));

  if (isPending || !data) {
    return <div className="text-muted-foreground text-sm">Memuat detail...</div>;
  }

  const detail = data as AdminBookedCoachDetail;
  const customer =
    (detail as any).booking?.customer ??
    (detail as any).booking?.user ??
    (detail as any).customer ??
    null;
  const invoice = (detail as any).booking?.invoice ?? (detail as any).invoice ?? null;
  const bookingCourtSlots =
    ((detail as any).booking?.courtSlots as any[]) ?? ((detail as any).courtSlots as any[]) ?? [];
  const coachDescription: string | null =
    (detail as any).description ??
    // Fallback: some APIs might nest it under coach
    (detail as any).coach?.description ??
    null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Coach</p>
          <p className="font-medium">
            {/* Support both nested and top-level coach/staff structures */}
            {detail.coach?.staff?.name ||
              (detail as any).staff?.name ||
              (detail as any).coachName ||
              (detail as any).name ||
              '-'}
          </p>
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
                (detail as any).booking?.status as keyof typeof BOOKING_STATUS_MAP
              ]
            }
          >
            {BOOKING_STATUS_MAP[(detail as any).booking?.status as keyof typeof BOOKING_STATUS_MAP]}
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
        {detail.slot && (
          <div>
            <p className="text-muted-foreground text-sm">Waktu Coach</p>
            <p className="text-sm">
              {dayjs(detail.slot.startAt).format('DD MMM YYYY')} ·{' '}
              {detail.slot.startTime || dayjs(detail.slot.startAt).format('HH:mm')} -{' '}
              {detail.slot.endTime || dayjs(detail.slot.endAt).format('HH:mm')}
            </p>
          </div>
        )}
        <div>
          <p className="text-muted-foreground text-sm">Dibuat</p>
          <p className="text-sm">
            {dayjs((detail as any).booking?.createdAt ?? detail.createdAt).format(
              'DD/MM/YYYY HH:mm'
            )}
          </p>
        </div>
      </div>

      {coachDescription && (
        <div className="border-t pt-4">
          <p className="mb-2 text-sm font-medium">Deskripsi</p>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm whitespace-pre-line">{coachDescription}</p>
          </div>
        </div>
      )}

      {bookingCourtSlots?.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Slot Lapangan</p>
          <div className="space-y-2">
            {bookingCourtSlots.map((cs: any, idx: number) => (
              <div key={idx} className="bg-muted/50 rounded-lg border p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{(cs.court as any)?.name || '-'}</p>
                    {cs.slot ? (
                      <p className="text-muted-foreground text-sm">
                        {dayjs(cs.slot.startAt).format('DD MMM YYYY')} · {cs.slot.startTime} -{' '}
                        {cs.slot.endTime}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {dayjs(cs.startAt).format('DD MMM YYYY')} · {cs.time}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookedCoachTable;
