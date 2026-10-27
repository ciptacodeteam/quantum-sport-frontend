'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { IconEye, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';
import { cancelBookedInventoryApi } from '@/api/admin/bookedInventory';
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
import { BOOKING_STATUS_BADGE_VARIANT } from '@/lib/constants';
import {
  hasAmount,
  hasText,
  inventoryCategoryLabels,
  inventoryStatusLabels,
  itemCategory,
  itemCustomer,
  itemInvoice,
  itemSchedules,
  scheduleDate,
  scheduleTime
} from '@/lib/booked-inventory-display';
import {
  adminBookedInventoriesQueryOptions,
  type AdminBookedInventoryListItem
} from '@/queries/admin/bookedInventory';
import {
  BookedInventoryDetailsDialog,
  CancelBookedInventoryDialog,
  inventoryCurrency
} from './BookedInventoryDialogs';

const helper = createColumnHelper<AdminBookedInventoryListItem>();
export default function BookedInventoryTable() {
  const [category, setCategory] = useState('all');
  const [cancelItem, setCancelItem] = useState<AdminBookedInventoryListItem | null>(null);
  const queryClient = useQueryClient();
  const query = useQuery(adminBookedInventoriesQueryOptions());
  const allItems = useMemo(
    () =>
      (query.data || []).filter(
        (item) => item.itemType !== 'ballboy' && item.category !== 'ballboy'
      ),
    [query.data]
  );
  const categories = useMemo(
    () => [...new Set(allItems.map(itemCategory))].filter((key) => inventoryCategoryLabels[key]),
    [allItems]
  );
  useEffect(() => {
    if (category !== 'all' && !categories.includes(category)) setCategory('all');
  }, [categories, category]);
  const items = useMemo(
    () =>
      category === 'all' ? allItems : allItems.filter((item) => itemCategory(item) === category),
    [allItems, category]
  );
  const cancel = useMutation({
    mutationFn: (id: string) => cancelBookedInventoryApi(id, 'Dibatalkan oleh admin'),
    onSuccess: () => {
      setCancelItem(null);
      toast.success('Inventori berhasil dibatalkan.');
      for (const key of ['booked-inventories', 'bookings', 'inventory', 'inventories', 'analytics'])
        void queryClient.invalidateQueries({ queryKey: ['admin', key] });
    },
    onError: (error: Error) => toast.error(error.message || 'Gagal membatalkan inventori.')
  });
  const columns = useMemo(
    () => [
      helper.accessor((item) => item.inventory?.name, {
        id: 'item',
        header: 'Item',
        cell: ({ row, getValue }) =>
          hasText(getValue()) ? (
            <p
              className="max-w-64 truncate font-medium"
              title={`${getValue()}${inventoryCategoryLabels[itemCategory(row.original)] ? ` · ${inventoryCategoryLabels[itemCategory(row.original)]}` : ''}`}
            >
              {getValue()}
            </p>
          ) : null
      }),
      ...(allItems.some(
        (item) =>
          hasText(itemCustomer(item)?.name) ||
          hasText(itemCustomer(item)?.phone) ||
          hasText(itemCustomer(item)?.email) ||
          hasText(itemInvoice(item)?.number)
      )
        ? [
            helper.accessor(
              (item) =>
                [itemCustomer(item)?.name, itemCustomer(item)?.phone, itemInvoice(item)?.number]
                  .filter(hasText)
                  .join(' '),
              {
                id: 'customer',
                header: 'Pelanggan',
                cell: ({ row }) => {
                  const customer = itemCustomer(row.original);
                  const invoice = itemInvoice(row.original);
                  return (
                    <div className="flex min-w-36 items-center gap-1.5">
                      <span
                        className="max-w-48 truncate font-medium"
                        title={customer?.name || customer?.email || customer?.phone || undefined}
                      >
                        {customer?.name || customer?.email || customer?.phone || '—'}
                      </span>
                      {hasText(invoice?.number) && (
                        <CopyButton
                          content={invoice.number}
                          variant="ghost"
                          size="sm"
                          aria-label={`Salin invoice ${invoice.number}`}
                          title={invoice.number}
                        />
                      )}
                    </div>
                  );
                }
              }
            )
          ]
        : []),
      ...(allItems.some((item) => itemSchedules(item).length)
        ? [
            helper.accessor(
              (item) =>
                itemSchedules(item)
                  .map((slot) => `${slot.court || ''} ${slot.start}`)
                  .join(' '),
              {
                id: 'schedule',
                header: 'Jadwal (WIB)',
                cell: ({ row }) => (
                  <div className="space-y-1">
                    {itemSchedules(row.original)
                      .slice(0, 1)
                      .map((slot, index) => (
                        <div key={index} className="space-y-1">
                          <p className="font-medium">{slot.court || scheduleDate(slot)}</p>
                          <p className="text-muted-foreground text-sm tabular-nums">
                            {slot.court ? `${scheduleDate(slot)} · ` : ''}
                            {scheduleTime(slot)}
                          </p>
                        </div>
                      ))}
                    {itemSchedules(row.original).length > 1 && (
                      <span className="text-muted-foreground text-sm">
                        +{itemSchedules(row.original).length - 1} jadwal
                      </span>
                    )}
                  </div>
                )
              }
            )
          ]
        : []),
      ...(allItems.some((item) => hasAmount(item.quantity))
        ? [
            helper.accessor('quantity', {
              header: 'Jumlah',
              cell: ({ row }) => (
                <span
                  className="tabular-nums"
                  title={
                    hasAmount(row.original.unitPrice)
                      ? `Harga satuan ${inventoryCurrency(row.original.unitPrice)}`
                      : undefined
                  }
                >
                  {hasAmount(row.original.quantity) ? row.original.quantity : '—'}
                </span>
              )
            })
          ]
        : []),
      ...(allItems.some((item) => hasAmount(item.totalPrice))
        ? [
            helper.accessor('totalPrice', {
              header: 'Total',
              cell: ({ getValue }) =>
                hasAmount(getValue()) ? (
                  <span className="font-semibold tabular-nums">
                    {inventoryCurrency(getValue())}
                  </span>
                ) : null
            })
          ]
        : []),
      ...(allItems.some((item) => hasText(item.booking?.status))
        ? [
            helper.accessor((item) => item.booking?.status, {
              id: 'status',
              header: 'Status',
              cell: ({ getValue }) =>
                hasText(getValue()) ? (
                  <Badge
                    variant={
                      BOOKING_STATUS_BADGE_VARIANT[
                        getValue() as keyof typeof BOOKING_STATUS_BADGE_VARIANT
                      ]
                    }
                  >
                    {inventoryStatusLabels[getValue()] || getValue()}
                  </Badge>
                ) : null
            })
          ]
        : []),
      helper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const item = row.original;
          const canCancel =
            (!item.itemType || item.itemType === 'inventory') &&
            ['HOLD', 'CONFIRMED'].includes(item.booking?.status);
          return (
            <div className="flex items-center gap-1">
              <ManagedDialog
                id={`view-booked-inventory-${item.itemType || 'inventory'}-${item.id}`}
              >
                <DialogTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Lihat detail ${item.inventory?.name || 'item'}`}
                    title="Lihat detail"
                  >
                    <IconEye />
                  </Button>
                </DialogTrigger>
                <BookedInventoryDetailsDialog item={item} />
              </ManagedDialog>
              {canCancel && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/5 hover:text-destructive"
                  aria-label={`Batalkan ${item.inventory?.name || 'item'}`}
                  title="Batalkan item"
                  onClick={() => setCancelItem(item)}
                >
                  <IconX />
                </Button>
              )}
            </div>
          );
        }
      })
    ],
    [allItems]
  );

  if (query.isError)
    return (
      <div role="alert" className="space-y-3 rounded-xl border p-8 text-center">
        <p className="text-muted-foreground text-sm">Data inventori belum dapat dimuat.</p>
        <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  return (
    <div className="[&_thead]:bg-muted/50 min-w-0 space-y-4 [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3">
      <DataTable
        loading={query.isPending}
        data={items}
        columns={columns}
        getRowId={(item) => `${item.itemType || 'inventory'}-${item.id}`}
        enableRowSelection={false}
        searchPlaceholder="Cari item, pelanggan, atau invoice..."
        columnVisibilityLabel="Kolom"
        columnVisibilityStorageKey="quantum:booked-inventories:columns"
        rightActions={
          categories.length > 1 ? (
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                className="h-9 w-44 rounded-lg shadow-none"
                aria-label="Kategori inventori"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kategori</SelectItem>
                {categories.map((key) => (
                  <SelectItem key={key} value={key}>
                    {inventoryCategoryLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />
      <CancelBookedInventoryDialog
        item={cancelItem}
        pending={cancel.isPending}
        onClose={() => setCancelItem(null)}
        onConfirm={() => {
          if (cancelItem) cancel.mutate(cancelItem.id);
        }}
      />
    </div>
  );
}
