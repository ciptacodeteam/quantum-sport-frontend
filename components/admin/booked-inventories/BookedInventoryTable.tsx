'use client';

import { cancelBookedInventoryApi } from '@/api/admin/bookedInventory';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import DateRangeInput from '@/components/ui/date-range-input';
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
import {
  BOOKING_STATUS_BADGE_VARIANT,
  BOOKING_STATUS_MAP,
  ROLE,
  getCoachTypeLabel
} from '@/lib/constants';
import { formatSlotTime } from '@/lib/time-utils';
import { formatPhone } from '@/lib/utils';
import {
  adminBookedInventoriesQueryOptions,
  adminBookedInventoryQueryOptions,
  type AdminBookedInventoryDetail,
  type AdminBookedInventoryListItem
} from '@/queries/admin/bookedInventory';
import useAuthStore from '@/stores/useAuthStore';
import { IconEye, IconX } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';

const currency = (n: number) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;
const BALLBOY_PAYOUT_PER_SESSION = 30000;
const BALLBOY_QUANTUM_FEE_PER_SESSION = 15000;

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Semua',
  bola: 'Bola',
  raket: 'Raket',
  ballboy: 'Ballboy',
  coach: 'Coach',
  inventory: 'Inventori Lain'
};

const BookedInventoryTable = () => {
  const [source, setSource] = useState<string>('');
  const [category, setCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserRole = (currentUser as { role?: string } | null)?.role;
  const isCashier = currentUserRole?.toUpperCase?.() === ROLE.CASHIER;
  const queryClient = useQueryClient();

  const { confirmAndMutate: cancelBookedInventory } = useConfirmMutation(
    {
      mutationFn: (id: string) => cancelBookedInventoryApi(id, 'Cancelled by admin')
    },
    {
      title: 'Batalkan Inventori',
      description: 'Apakah Anda yakin ingin membatalkan inventori ini dari pemesanan?',
      confirmText: 'Batalkan',
      cancelText: 'Tutup',
      destructive: true,
      toastMessages: {
        loading: 'Membatalkan inventori...',
        success: () => 'Inventori berhasil dibatalkan.',
        error: 'Gagal membatalkan inventori.'
      },
      invalidate: ['admin', 'booked-inventories']
    }
  );

  const colHelper = createColumnHelper<AdminBookedInventoryListItem>();

  const columns = useMemo(
    () => [
      colHelper.accessor((row) => row.category || row.itemType || 'inventory', {
        id: 'category',
        header: 'Kategori',
        cell: (info) => (
          <Badge variant="outline">{CATEGORY_LABELS[info.getValue()] || 'Inventori'}</Badge>
        )
      }),
      colHelper.accessor((row) => row.inventory.name, {
        id: 'inventoryName',
        header: 'Item',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>
      }),
      colHelper.accessor('quantity', {
        header: 'Qty',
        cell: (info) => <span>{info.getValue()}</span>
      }),
      colHelper.accessor('unitPrice', {
        header: 'Harga Satuan',
        cell: (info) => <span className="tabular-nums">{currency(info.getValue())}</span>
      }),
      colHelper.accessor('totalPrice', {
        header: 'Total',
        cell: (info) => (
          <span className="font-medium tabular-nums">{currency(info.getValue())}</span>
        )
      }),
      colHelper.accessor((row) => row.booking.status, {
        id: 'bookingStatus',
        header: 'Status Pemesanan',
        cell: (info) => {
          const status = info.getValue() as keyof typeof BOOKING_STATUS_MAP;
          return (
            <Badge variant={BOOKING_STATUS_BADGE_VARIANT[status]}>
              {BOOKING_STATUS_MAP[status]}
            </Badge>
          );
        }
      }),
      colHelper.accessor((row) => row.booking?.customer ?? (row as any).customer, {
        id: 'customer',
        header: 'Pelanggan',
        cell: (info) => {
          const original = info.row.original as any;
          const customer =
            info.getValue() ||
            original?.booking?.customer ||
            original?.customer ||
            original?.user ||
            null;
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
      colHelper.accessor((row) => (row as any).invoice ?? row.booking?.invoice ?? null, {
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
      colHelper.accessor((row) => (row as any).courtSlots ?? row.booking?.courtSlots ?? [], {
        header: 'Lapangan & Waktu',
        cell: (info) => {
          let slots = info.getValue() || [];
          // Fallback: derive slots from booking.details if API doesn't return top-level courtSlots
          if ((!slots || slots.length === 0) && (info.row.original as any).booking?.details) {
            const details = (info.row.original as any).booking.details as Array<any>;
            slots = details.map((d) => ({
              court: d.court ?? null,
              startAt: d.slot?.startAt ?? d.startAt,
              endAt: d.slot?.endAt ?? d.endAt,
              date: d.date
                ? String(d.date)
                : formatSlotTime(d.slot?.startAt ?? d.startAt, 'YYYY-MM-DD'),
              time:
                (d.time as string) ||
                `${formatSlotTime(d.slot?.startAt ?? d.startAt)} - ${formatSlotTime(d.slot?.endAt ?? d.endAt)}`
            }));
          }
          if (slots.length === 0) return '-';
          const first = slots[0];
          const isExpired = dayjs(first.endAt).isBefore(dayjs());
          return (
            <Tooltip>
              <TooltipTrigger>
                <div className="flex flex-col">
                  <span className="font-medium">{first.court?.name || '-'}</span>
                  <span
                    className={`text-xs ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}
                  >
                    {first.date || formatSlotTime(first.startAt, 'DD MMM YYYY')} · {first.time}
                  </span>
                  {slots.length > 1 && (
                    <span className="text-muted-foreground text-xs">+{slots.length - 1} slot</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {slots.slice(0, 4).map((s, idx) => (
                    <div key={idx} className="text-xs">
                      {s.date || formatSlotTime(s.startAt, 'DD MMM')} - {s.court?.name || '-'} ({s.time})
                    </div>
                  ))}
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
              <ManagedDialog id={`view-booked-inventory-${item.id}`}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="lightInfo">
                    <IconEye />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader className="mb-4">
                    <DialogTitle>Detail Add-on</DialogTitle>
                  </DialogHeader>
                  {item.itemType && item.itemType !== 'inventory' ? (
                    <ServiceDetail item={item} />
                  ) : (
                    <InventoryDetail id={item.id} />
                  )}
                </DialogContent>
              </ManagedDialog>
              {(!item.itemType || item.itemType === 'inventory') && (
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => cancelBookedInventory(item.id)}
                  title="Batalkan Inventori"
                >
                  <IconX />
                </Button>
              )}
            </div>
          );
        }
      })
    ],
    [colHelper, cancelBookedInventory]
  );

  const { data, isPending } = useQuery(
    adminBookedInventoriesQueryOptions({
      ...(source && source !== 'all' ? { source } : {}),
      ...(category && category !== 'all' ? { category } : {}),
      ...(dateRange?.from ? { from: dayjs(dateRange.from).startOf('day').toISOString() } : {}),
      ...(dateRange?.to ? { to: dayjs(dateRange.to).endOf('day').toISOString() } : {})
    })
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

    (data || [])
      .filter((item) => item.itemType === 'ballboy' || item.category === 'ballboy')
      .forEach((item) => {
        const key = item.serviceStaff?.id || item.inventory.id || item.id;
        const start = item.slot?.startAt ? dayjs(item.slot.startAt) : null;
        const end = item.slot?.endAt ? dayjs(item.slot.endAt) : null;
        const durationHours =
          start?.isValid() && end?.isValid()
            ? Math.max(end.diff(start, 'minute') / 60, 1)
            : 1;
        const existing = summary.get(key) || {
          name: item.serviceStaff?.name || item.inventory.name.replace(/^Ballboy - /, ''),
          phone: item.serviceStaff?.phone,
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
  }, [data]);

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
        data={data || []}
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
            <div className="flex items-center gap-2">
              <label htmlFor="category-filter" className="text-sm font-medium">
                Kategori:
              </label>
              <Select value={category || 'all'} onValueChange={setCategory}>
                <SelectTrigger id="category-filter" className="w-[170px]">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="bola">Bola</SelectItem>
                  <SelectItem value="raket">Raket</SelectItem>
                  <SelectItem value="ballboy">Ballboy</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="inventory">Inventori Lain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="source-filter" className="text-sm font-medium">
                Sumber:
              </label>
              <Select value={source || 'all'} onValueChange={setSource}>
                <SelectTrigger id="source-filter" className="w-[160px]">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        columns={columns}
        enableRowSelection={false}
      />
    </div>
  );
};

const ServiceDetail = ({ item }: { item: AdminBookedInventoryListItem }) => {
  const customer = item.booking?.customer ?? null;
  const invoice = item.booking?.invoice ?? null;
  const bookingCourtSlots = item.booking?.courtSlots ?? [];
  const categoryLabel = CATEGORY_LABELS[item.category || item.itemType || 'inventory'] || 'Add-on';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Kategori</p>
          <Badge variant="outline">{categoryLabel}</Badge>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Item</p>
          <p className="font-medium">{item.inventory.name}</p>
          {item.inventory.description && (
            <p className="text-muted-foreground mt-1 text-xs">{item.inventory.description}</p>
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
          <p className="text-muted-foreground text-sm">Total</p>
          <p className="font-medium">{currency(item.totalPrice)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Status Pemesanan</p>
          <Badge
            variant={
              BOOKING_STATUS_BADGE_VARIANT[item.booking.status as keyof typeof BOOKING_STATUS_MAP]
            }
          >
            {BOOKING_STATUS_MAP[item.booking.status as keyof typeof BOOKING_STATUS_MAP]}
          </Badge>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Invoice</p>
          {invoice ? (
            <div className="flex flex-col">
              <span className="font-medium">{invoice.number}</span>
              <span className="text-muted-foreground text-xs">{invoice.status}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      </div>

      {item.slot && (
        <div>
          <p className="mb-2 text-sm font-medium">Slot Add-on</p>
          <div className="bg-muted/50 rounded-lg border p-3">
            <p className="font-medium">{item.serviceStaff?.name || item.inventory.name}</p>
            <p className="text-muted-foreground text-sm">
              {formatSlotTime(item.slot.startAt, 'DD MMM YYYY')} ·{' '}
              {formatSlotTime(item.slot.startAt)} - {formatSlotTime(item.slot.endAt)}
            </p>
            {item.serviceStaff?.phone && (
              <p className="text-muted-foreground text-xs">{formatPhone(item.serviceStaff.phone)}</p>
            )}
          </div>
        </div>
      )}

      {bookingCourtSlots?.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Slot Lapangan</p>
          <div className="space-y-2">
            {bookingCourtSlots.map((cs, idx) => (
              <div key={idx} className="bg-muted/50 rounded-lg border p-3">
                <p className="font-medium">{cs.court?.name || '-'}</p>
                <p className="text-muted-foreground text-sm">
                  {cs.date || formatSlotTime(cs.startAt, 'DD MMM YYYY')} · {cs.time}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const InventoryDetail = ({ id }: { id: string }) => {
  const { data, isPending } = useQuery(adminBookedInventoryQueryOptions(id));

  if (isPending || !data) {
    return <div className="text-muted-foreground text-sm">Memuat detail...</div>;
  }

  const detail = data as AdminBookedInventoryDetail;
  const customer =
    (detail as any).booking?.customer ??
    (detail as any).booking?.user ??
    (detail as any).customer ??
    null;
  const invoice = (detail as any).booking?.invoice ?? (detail as any).invoice ?? null;
  const bookingCourtSlots =
    ((detail as any).booking?.courtSlots as any[]) ?? ((detail as any).courtSlots as any[]) ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Inventori</p>
          <p className="font-medium">{detail.inventory.name}</p>
          {detail.inventory.description && (
            <p className="text-muted-foreground mt-1 text-xs">{detail.inventory.description}</p>
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
          <p className="text-muted-foreground text-sm">Jumlah</p>
          <p className="font-medium">
            {detail.quantity} × {currency(detail.unitPrice)} = {currency(detail.totalPrice)}
          </p>
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
        <div>
          <p className="text-muted-foreground text-sm">Dibuat</p>
          <p className="text-sm">
            {dayjs((detail as any).booking?.createdAt ?? detail.createdAt).format(
              'DD/MM/YYYY HH:mm'
            )}
          </p>
        </div>
      </div>

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
                        {cs.slot.date || formatSlotTime(cs.slot.startAt, 'DD MMM YYYY')} ·{' '}
                        {cs.slot.startTime || formatSlotTime(cs.slot.startAt)} -{' '}
                        {cs.slot.endTime || formatSlotTime(cs.slot.endAt)}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {cs.date || formatSlotTime(cs.startAt, 'DD MMM YYYY')} · {cs.time}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {detail.coaches?.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Coach</p>
          <div className="space-y-2">
            {detail.coaches.map((c, idx) => (
              <div key={idx} className="bg-muted/50 rounded-lg border p-3">
                <p className="font-medium">{c.staff.name}</p>
                <p className="text-muted-foreground text-sm">
                  {(c as any).coachType?.name ?? getCoachTypeLabel(c.coachType)} ·{' '}
                  {formatSlotTime(c.slot.startAt)} - {formatSlotTime(c.slot.endAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {detail.ballboys?.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Ballboy</p>
          <div className="space-y-2">
            {detail.ballboys.map((b, idx) => (
              <div key={idx} className="bg-muted/50 rounded-lg border p-3">
                <p className="font-medium">{b.staff.name}</p>
                <p className="text-muted-foreground text-sm">
                  {formatSlotTime(b.slot.startAt)} - {formatSlotTime(b.slot.endAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookedInventoryTable;
