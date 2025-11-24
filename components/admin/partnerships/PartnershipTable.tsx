'use client';

import { deletePartnershipApi } from '@/api/admin/partnership';
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
import PreviewImage from '@/components/ui/preview-image';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { STATUS_BADGE_VARIANT, STATUS_MAP } from '@/lib/constants';
import { hasCreatePermission, hasDeletePermission, hasEditPermission } from '@/lib/utils';
import { adminPartnershipsQueryOptions } from '@/queries/admin/partnership';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { Partnership } from '@/types/model';
import { IconEye, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import CreatePartnershipForm from './CreatePartnershipForm';
import EditPartnershipForm from './EditPartnershipForm';

const PartnershipTable = () => {
  const { data: me } = useQuery(adminProfileQueryOptions);
  const { confirmAndMutate } = useConfirmMutation(
    {
      mutationFn: deletePartnershipApi
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
      invalidate: adminPartnershipsQueryOptions.queryKey
    }
  );

  const colHelper = createColumnHelper<Partnership>();

  const columns = useMemo(
    () => [
      colHelper.accessor('logo', {
        header: 'Logo',
        cell: (info) => (
          <PreviewImage
            src={info.getValue() || ''}
            className="aspect-square w-auto"
            placeholder="No Logo"
          />
        )
      }),
      colHelper.accessor('name', {
        header: 'Nama',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('description', {
        header: 'Deskripsi',
        cell: (info) => <p className="line-clamp-2">{info.getValue() || '-'}</p>
      }),
      colHelper.accessor('isActive', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={STATUS_BADGE_VARIANT[Number(info.getValue())]}>
            {STATUS_MAP[Number(info.getValue())]}
          </Badge>
        )
      }),
      colHelper.accessor('createdAt', {
        header: 'Dibuat Pada',
        cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY HH:mm')
      }),
      colHelper.accessor('updatedAt', {
        header: 'Diperbarui Pada',
        cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY HH:mm')
      }),
      colHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ManagedDialog id={`${hasEditPermission(me?.role) ? 'edit' : 'view'}-partnership-${row.original.id}`}>
              <DialogTrigger asChild>
                <Button size="icon" variant="lightInfo">
                  {hasEditPermission(me?.role) ? <IconPencil /> : <IconEye />}
                </Button>
              </DialogTrigger>
              <DialogContent className="lg:min-w-xl">
                <DialogHeader className="mb-4">
                  <DialogTitle>{hasEditPermission(me?.role) ? 'Edit' : 'View'} Partnership</DialogTitle>
                </DialogHeader>
                <EditPartnershipForm data={row.original} />
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

  const { data, isPending } = useQuery(adminPartnershipsQueryOptions);

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
      addButton={
        hasCreatePermission(me?.role) ? (
          <ManagedDialog id="create-partnership">
            <DialogTrigger asChild>
              <Button>
                <IconPlus />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="lg:min-w-xl">
              <DialogHeader className="mb-4">
                <DialogTitle>Tambah Data Baru</DialogTitle>
              </DialogHeader>
              <CreatePartnershipForm />
            </DialogContent>
          </ManagedDialog>
        ) : undefined
      }
    />
  );
};
export default PartnershipTable;
