'use client';

import { deleteBannerApi } from '@/api/admin/banner';
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
import { hasCreatePermission, hasEditPermission, hasDeletePermission } from '@/lib/utils';
import { adminBannersQueryOptions } from '@/queries/admin/banner';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { Banner } from '@/types/model';
import { IconExternalLink, IconPencil, IconPlus, IconTrash, IconEye } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useMemo } from 'react';
import CreateBannerForm from './CreateBannerForm';
import EditBannerForm from './EditBannerForm';

const BannerTable = () => {
  const { data: me } = useQuery(adminProfileQueryOptions);
  const { confirmAndMutate } = useConfirmMutation(
    {
      mutationFn: deleteBannerApi
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
      invalidate: adminBannersQueryOptions.queryKey
    }
  );

  const colHelper = createColumnHelper<Banner>();

  const columns = useMemo(
    () => [
      colHelper.accessor('image', {
        header: 'Preview',
        cell: (info) => <PreviewImage src={info.getValue()} />
      }),
      colHelper.accessor('isActive', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={STATUS_BADGE_VARIANT[Number(info.getValue())]}>
            {STATUS_MAP[Number(info.getValue())]}
          </Badge>
        )
      }),
      colHelper.accessor('sequence', {
        header: 'Urutan',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('startAt', {
        header: 'Mulai Pada',
        cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY HH:mm')
      }),
      colHelper.accessor('endAt', {
        header: 'Selesai Pada',
        cell: (info) => (info.getValue() ? dayjs(info.getValue()).format('DD/MM/YYYY HH:mm') : '-')
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
            <ManagedDialog id={`${hasEditPermission(me?.role) ? 'edit' : 'view'}-banner-${row.original.id}`}>
              <DialogTrigger asChild>
                <Button size="icon" variant="lightInfo">
                  {hasEditPermission(me?.role) ? <IconPencil /> : <IconEye />}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader className="mb-4">
                  <DialogTitle>{hasEditPermission(me?.role) ? 'Edit' : 'View'} Banner</DialogTitle>
                </DialogHeader>
                <EditBannerForm data={row.original} />
              </DialogContent>
            </ManagedDialog>
            {row.original.link && (
              <Link href={row.original.link} target="_blank" rel="noopener noreferrer">
                <Button size="icon" variant="lightSuccess">
                  <IconExternalLink />
                </Button>
              </Link>
            )}
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

  const { data, isPending } = useQuery(adminBannersQueryOptions);

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
      addButton={
        hasCreatePermission(me?.role) ? (
          <ManagedDialog id="create-banner">
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
              <CreateBannerForm />
            </DialogContent>
          </ManagedDialog>
        ) : undefined
      }
    />
  );
};
export default BannerTable;
