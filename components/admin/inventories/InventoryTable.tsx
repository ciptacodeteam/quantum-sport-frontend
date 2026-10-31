'use client';

import { deleteInventoryApi } from '@/api/admin/inventory';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ManagedDialog
} from '@/components/ui/dialog';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import {
  formatNumber,
  hasCreatePermission,
  hasEditPermission,
  hasDeletePermission
} from '@/lib/utils';
import { adminInventoriesQueryOptions } from '@/queries/admin/inventory';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { Inventory } from '@/types/model';
import { IconPencil, IconPlus, IconTrash, IconEye, IconPhoto } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { formatBookingDate } from '@/lib/booking-display';
import PreviewImage from '@/components/ui/preview-image';
import { useMemo } from 'react';
import CreateInventoryForm from './CreateInventoryForm';
import EditInventoryForm from './EditInventoryForm';

const colHelper = createColumnHelper<Inventory>();
const initialColumnVisibility = { description: false, createdAt: false };
const inventoryDialogClassName =
  'max-h-[90dvh] w-full max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl p-5 sm:max-w-3xl sm:p-6';

const InventoryTable = () => {
  const { data: me } = useQuery(adminProfileQueryOptions);
  const { confirmAndMutate } = useConfirmMutation(
    {
      mutationFn: deleteInventoryApi
    },
    {
      title: 'Hapus Data',
      description: 'Apakah Anda yakin ingin menghapus data ini?',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      destructive: true,
      toastMessages: {
        loading: 'Menghapus data...',
        success: () => 'Data berhasil dihapus.',
        error: 'Gagal menghapus data.'
      },
      invalidate: adminInventoriesQueryOptions.queryKey
    }
  );

  const columns = useMemo(
    () => [
      colHelper.accessor('name', {
        header: 'Nama Alat',
        cell: ({ row, getValue }) => (
          <div className="flex min-w-60 items-center gap-3">
            {row.original.image ? (
              <PreviewImage
                src={row.original.image}
                alt={`Foto ${getValue()}`}
                className="h-12 w-16 rounded-lg border object-cover"
              />
            ) : (
              <div
                className="bg-muted/50 text-muted-foreground flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border"
                aria-label="Belum ada foto"
              >
                <IconPhoto className="size-5" />
              </div>
            )}
            <div className="max-w-64 min-w-0 space-y-1">
              <p className="truncate font-medium" title={getValue()}>
                {getValue()}
              </p>
              {row.original.description && (
                <p
                  className="text-muted-foreground line-clamp-2 text-xs whitespace-normal"
                  title={row.original.description}
                >
                  {row.original.description}
                </p>
              )}
            </div>
          </div>
        )
      }),
      colHelper.accessor('description', {
        header: 'Keterangan',
        cell: (info) => (
          <p className="text-muted-foreground line-clamp-2 max-w-64 min-w-40 whitespace-normal">
            {info.getValue() || '—'}
          </p>
        )
      }),
      colHelper.accessor('sport', {
        header: 'Kategori',
        cell: (info) => (
          <Badge variant="outline">{info.getValue() === 'TENNIS' ? 'Tennis' : 'Padel'}</Badge>
        )
      }),
      colHelper.accessor('quantity', {
        header: 'Jumlah',
        cell: (info) => (
          <Badge variant={info.getValue() ? 'lightNeutral' : 'lightWarning'}>
            {info.getValue() || 0} unit
          </Badge>
        )
      }),
      colHelper.accessor('price', {
        header: 'Harga',
        cell: (info) => (
          <span className="font-medium tabular-nums">
            Rp {formatNumber(info.getValue() as number)}
          </span>
        )
      }),
      colHelper.accessor('isActive', {
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge variant={getValue() ? 'lightSuccess' : 'lightNeutral'}>
            {getValue() ? 'Aktif' : 'Nonaktif'}
          </Badge>
        )
      }),
      colHelper.accessor('createdAt', {
        header: 'Dibuat Pada',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground tabular-nums">
            {getValue() ? `${formatBookingDate(getValue(), 'DD MMM YYYY, HH:mm')} WIB` : '—'}
          </span>
        )
      }),
      colHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <ManagedDialog
              id={`${hasEditPermission(me?.role) ? 'edit' : 'view'}-inventory-${row.original.id}`}
            >
              <DialogTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`${hasEditPermission(me?.role) ? 'Edit' : 'Lihat'} ${row.original.name}`}
                  title={hasEditPermission(me?.role) ? 'Edit inventori' : 'Lihat detail'}
                >
                  {hasEditPermission(me?.role) ? <IconPencil /> : <IconEye />}
                </Button>
              </DialogTrigger>
              <DialogContent className={inventoryDialogClassName}>
                <DialogHeader className="border-b pb-5">
                  <DialogTitle>
                    {hasEditPermission(me?.role) ? 'Edit' : 'Detail'} Inventori
                  </DialogTitle>
                  <DialogDescription>
                    Informasi alat, kategori, jumlah unit, dan status inventori.
                  </DialogDescription>
                </DialogHeader>
                <EditInventoryForm data={row.original} readOnly={!hasEditPermission(me?.role)} />
              </DialogContent>
            </ManagedDialog>
            {hasDeletePermission(me?.role) && (
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Hapus ${row.original.name}`}
                title="Hapus inventori"
                onClick={async () => await confirmAndMutate(row.original.id)}
              >
                <IconTrash />
              </Button>
            )}
          </div>
        )
      })
    ],
    [confirmAndMutate, me?.role]
  );

  const { data, isPending } = useQuery(adminInventoriesQueryOptions);

  return (
    <div className="[&_thead]:bg-muted/50 w-full min-w-0">
      <DataTable
        loading={isPending}
        data={data || []}
        columns={columns}
        enableRowSelection={false}
        getRowId={(inventory) => inventory.id}
        searchPlaceholder="Cari nama alat atau keterangan..."
        columnVisibilityLabel="Kolom"
        initialColumnVisibility={initialColumnVisibility}
        columnVisibilityStorageKey="quantum:inventories:columns"
        addButton={
          hasCreatePermission(me?.role) ? (
            <ManagedDialog id="create-inventory">
              <DialogTrigger asChild>
                <Button className="rounded-lg">
                  <IconPlus />
                  Tambah Inventori
                </Button>
              </DialogTrigger>
              <DialogContent className={inventoryDialogClassName}>
                <DialogHeader className="border-b pb-5">
                  <DialogTitle>Tambah Inventori</DialogTitle>
                  <DialogDescription>
                    Lengkapi informasi alat, jumlah unit, dan harga inventori.
                  </DialogDescription>
                </DialogHeader>
                <CreateInventoryForm />
              </DialogContent>
            </ManagedDialog>
          ) : undefined
        }
      />
    </div>
  );
};
export default InventoryTable;
