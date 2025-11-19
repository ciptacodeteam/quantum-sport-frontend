'use client';

import { deleteInventoryApi } from '@/api/admin/inventory';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ManagedDialog
} from '@/components/ui/dialog';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { formatNumber, hasCreatePermission, hasEditPermission, hasDeletePermission } from '@/lib/utils';
import { adminInventoriesQueryOptions } from '@/queries/admin/inventory';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { Inventory } from '@/types/model';
import { IconPencil, IconPlus, IconTrash, IconEye } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import CreateInventoryForm from './CreateInventoryForm';
import EditInventoryForm from './EditInventoryForm';

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

  const colHelper = createColumnHelper<Inventory>();

  const columns = useMemo(
    () => [
      colHelper.accessor('name', {
        header: 'Nama Alat',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('description', {
        header: 'Keterangan',
        cell: (info) => <p className="line-clamp-2">{info.getValue() || '-'}</p>
      }),
      colHelper.accessor('quantity', {
        header: 'Qty',
        cell: (info) => info.getValue() || 0
      }),
      colHelper.accessor('price', {
        header: 'Harga',
        cell: (info) => `Rp ${formatNumber(info.getValue() as number)}`
      }),
      colHelper.accessor('createdAt', {
        header: 'Dibuat Pada',
        cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY HH:mm')
      }),
      colHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ManagedDialog id={`${hasEditPermission(me?.role) ? 'edit' : 'view'}-inventory-${row.original.id}`}>
              <DialogTrigger asChild>
                <Button size="icon" variant="lightInfo">
                  {hasEditPermission(me?.role) ? <IconPencil /> : <IconEye />}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader className="mb-4">
                  <DialogTitle>{hasEditPermission(me?.role) ? 'Edit' : 'View'} Inventory</DialogTitle>
                </DialogHeader>
                <EditInventoryForm data={row.original} />
              </DialogContent>
            </ManagedDialog>
            {hasDeletePermission(me?.role) && (
              <Button
                size="icon"
                variant="lightDanger"
                onClick={async () => await confirmAndMutate(row.original.id)}
              >
                <IconTrash />
              </Button>
            )}
          </div>
        )
      })
    ],
    [colHelper, confirmAndMutate, me?.role]
  );

  const { data, isPending } = useQuery(adminInventoriesQueryOptions);

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
      addButton={
        hasCreatePermission(me?.role) ? (
          <ManagedDialog id="create-inventory">
            <DialogTrigger asChild>
              <Button>
                <IconPlus />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="mb-4">
                <DialogTitle>Tambah Data Baru</DialogTitle>
              </DialogHeader>
              <CreateInventoryForm />
            </DialogContent>
          </ManagedDialog>
        ) : undefined
      }
    />
  );
};
export default InventoryTable;
