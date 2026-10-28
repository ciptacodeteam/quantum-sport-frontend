'use client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/clipboard-copy';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { BOOKING_STATUS_BADGE_VARIANT } from '@/lib/constants';
import { formatBookingDate } from '@/lib/booking-display';
import { formatPhone } from '@/lib/utils';
import {
  hasText,
  hasAmount,
  inventoryCategoryLabels,
  inventoryStatusLabels,
  itemCategory,
  itemCustomer,
  itemInvoice,
  itemSchedules,
  paymentStatusLabels,
  scheduleDate,
  scheduleTime
} from '@/lib/booked-inventory-display';
import {
  adminBookedInventoryQueryOptions,
  type AdminBookedInventoryListItem
} from '@/queries/admin/bookedInventory';

export const inventoryCurrency = (value: number) =>
  `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
function Schedule({ item }: { item: AdminBookedInventoryListItem }) {
  const schedules = itemSchedules(item);
  if (!schedules.length) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Jadwal</h3>
      <div className="divide-y rounded-lg border px-3">
        {schedules.map((slot, index) => (
          <div key={index} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="space-y-1">
              {slot.court && <p className="text-sm font-medium">{slot.court}</p>}
              <p className="text-muted-foreground text-xs">{scheduleDate(slot)}</p>
            </div>
            <p className="text-sm tabular-nums">{scheduleTime(slot)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
export function BookedInventoryDetailsDialog({ item }: { item: AdminBookedInventoryListItem }) {
  const isInventory = !item.itemType || item.itemType === 'inventory';
  const query = useQuery({ ...adminBookedInventoryQueryOptions(item.id), enabled: isInventory });
  const detail = isInventory ? query.data : item;
  const customer = detail ? itemCustomer(detail) : undefined;
  const invoice = detail ? itemInvoice(detail) : undefined;
  const paymentMethod = invoice?.payment?.method;
  const methodName = typeof paymentMethod === 'string' ? paymentMethod : paymentMethod?.name;
  const relatedCoaches = (isInventory ? (query.data?.coaches ?? []) : []).filter((coach) =>
    hasText(coach.staff?.name)
  );
  const status = detail?.booking?.status;
  const created = detail?.createdAt
    ? formatBookingDate(detail.createdAt, 'DD MMM YYYY, HH:mm')
    : undefined;
  return (
    <DialogContent className="flex max-h-[90dvh] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-xl">
      <DialogHeader className="shrink-0 gap-2 border-b px-5 py-5 pr-12 text-left">
        <DialogTitle className="text-foreground text-lg">
          Detail {isInventory ? 'inventori' : 'layanan'}
        </DialogTitle>
        {hasText(item.inventory?.name) && (
          <DialogDescription>{item.inventory.name}</DialogDescription>
        )}
      </DialogHeader>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        {isInventory && query.isPending ? (
          <p role="status" className="text-muted-foreground py-6 text-center text-sm">
            Memuat detail...
          </p>
        ) : !detail || (isInventory && query.isError) ? (
          <div role="alert" className="space-y-3 py-6 text-center">
            <p className="text-muted-foreground text-sm">Detail belum dapat dimuat.</p>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {inventoryCategoryLabels[itemCategory(detail)] && (
                <Badge variant="outline">{inventoryCategoryLabels[itemCategory(detail)]}</Badge>
              )}
              {status && inventoryStatusLabels[status] && (
                <Badge
                  variant={
                    BOOKING_STATUS_BADGE_VARIANT[
                      status as keyof typeof BOOKING_STATUS_BADGE_VARIANT
                    ]
                  }
                >
                  {inventoryStatusLabels[status]}
                </Badge>
              )}
            </div>
            {hasText(detail.inventory?.description) && (
              <p className="text-muted-foreground text-sm leading-relaxed break-words">
                {detail.inventory.description}
              </p>
            )}
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(hasText(customer?.name) ||
                hasText(customer?.phone) ||
                hasText(customer?.email)) && (
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-xs">Pelanggan</dt>
                  {hasText(customer?.name) && (
                    <dd className="text-sm font-medium break-words">{customer.name}</dd>
                  )}
                  {hasText(customer?.phone) && (
                    <dd className="text-muted-foreground text-xs">{formatPhone(customer.phone)}</dd>
                  )}
                  {hasText(customer?.email) && (
                    <dd className="text-muted-foreground text-xs break-all">{customer.email}</dd>
                  )}
                </div>
              )}
              {created && created !== '-' && (
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-xs">Dibuat pada</dt>
                  <dd className="text-sm tabular-nums">{created} WIB</dd>
                </div>
              )}
              {hasAmount(detail.quantity) && (
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-xs">Jumlah</dt>
                  <dd className="text-sm font-medium">{detail.quantity}</dd>
                </div>
              )}
              {hasAmount(detail.unitPrice) && (
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-xs">Harga satuan</dt>
                  <dd className="text-sm tabular-nums">{inventoryCurrency(detail.unitPrice)}</dd>
                </div>
              )}
            </dl>
            <Schedule item={detail} />
            {invoice &&
              (hasText(invoice.number) ||
                paymentStatusLabels[invoice.status] ||
                hasText(methodName)) && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Pembayaran</h3>
                  <div className="space-y-3 rounded-lg border p-3 text-sm">
                    {hasText(invoice.number) && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-muted-foreground text-xs">Invoice</span>
                        <span className="flex items-center gap-2 font-mono text-xs">
                          {invoice.number}
                          <CopyButton
                            content={invoice.number}
                            variant="ghost"
                            size="sm"
                            aria-label="Salin nomor invoice"
                          />
                        </span>
                      </div>
                    )}
                    {paymentStatusLabels[invoice.status] && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground text-xs">Status pembayaran</span>
                        <span>{paymentStatusLabels[invoice.status]}</span>
                      </div>
                    )}
                    {hasText(methodName) && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground text-xs">Metode</span>
                        <span>{methodName}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}
            {relatedCoaches.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Pelatih terkait</h3>
                <div className="divide-y rounded-lg border px-3">
                  {relatedCoaches.map((coach, index) => (
                    <div key={index} className="space-y-1 py-3">
                      <p className="text-sm font-medium">{coach.staff.name}</p>
                      {coach.slot?.startAt && coach.slot?.endAt && (
                        <p className="text-muted-foreground text-xs">
                          {formatBookingDate(coach.slot.startAt, 'HH:mm')}–
                          {formatBookingDate(coach.slot.endAt, 'HH:mm')} WIB
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      <footer className="bg-muted/20 flex shrink-0 items-center justify-between gap-3 border-t px-5 py-4">
        <div>
          {detail && !query.isError && hasAmount(detail.totalPrice) && (
            <>
              <p className="text-muted-foreground text-xs">Total item</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {inventoryCurrency(detail.totalPrice)}
              </p>
            </>
          )}
        </div>
        <DialogClose asChild>
          <Button variant="outline" className="rounded-lg px-5 shadow-none">
            Tutup
          </Button>
        </DialogClose>
      </footer>
    </DialogContent>
  );
}
export function CancelBookedInventoryDialog({
  item,
  pending,
  onClose,
  onConfirm
}: {
  item: AdminBookedInventoryListItem | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent className="flex max-h-[90dvh] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 gap-2 border-b p-5 pr-12 text-left">
          <DialogTitle className="text-foreground text-lg">Batalkan inventori</DialogTitle>
          <DialogDescription>
            Item akan dihapus dari pemesanan dan total tagihan disesuaikan.
          </DialogDescription>
        </DialogHeader>
        {item && (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <div className="bg-muted/30 space-y-2 rounded-lg border p-3">
              {hasText(item.inventory?.name) && (
                <p className="text-sm font-semibold">{item.inventory.name}</p>
              )}
              {hasText(itemCustomer(item)?.name) && (
                <p className="text-muted-foreground text-xs">{itemCustomer(item)!.name}</p>
              )}
              {hasAmount(item.quantity) && hasAmount(item.unitPrice) && (
                <p className="text-sm tabular-nums">
                  {item.quantity} × {inventoryCurrency(item.unitPrice)}
                </p>
              )}
              {hasAmount(item.totalPrice) && (
                <p className="text-sm font-semibold tabular-nums">
                  {inventoryCurrency(item.totalPrice)}
                </p>
              )}
            </div>
            <Schedule item={item} />
          </div>
        )}
        <footer className="bg-muted/20 flex shrink-0 justify-end gap-2 border-t p-4">
          <Button
            variant="outline"
            className="rounded-lg shadow-none"
            onClick={onClose}
            disabled={pending}
          >
            Kembali
          </Button>
          <Button
            variant="destructive"
            className="rounded-lg"
            loading={pending}
            aria-label="Ya, batalkan"
            onClick={onConfirm}
          >
            Ya, batalkan
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
