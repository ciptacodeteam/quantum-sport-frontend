'use client';

import { deleteCourtApi } from '@/api/admin/court';
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
import { adminCourtsQueryOptions } from '@/queries/admin/court';
import type { Court } from '@/types/model';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useMemo } from 'react';
import CreateCourtForm from './CreateCourtForm';

const CourtTable = () => {
  const { confirmAndMutate } = useConfirmMutation(
    {
      mutationFn: deleteCourtApi
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
      invalidate: adminCourtsQueryOptions().queryKey
    }
  );

  const colHelper = createColumnHelper<Court>();

  const columns = useMemo(
    () => [
      colHelper.accessor('image', {
        header: 'Preview',
        cell: (info) => <PreviewImage src={info.getValue()} className="object-cover" />
      }),
      colHelper.accessor('name', {
        header: 'Nama Lapangan',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('description', {
        header: 'Deskripsi',
        cell: (info) => info.getValue() || '-'
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
      colHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link href={`/admin/kelola-lapangan/${row.original.id}`} prefetch>
              <Button size="icon" variant="lightInfo">
                <IconPencil />
              </Button>
            </Link>
            <Button
              size="icon"
              variant="lightDanger"
              onClick={async () => await confirmAndMutate(row.original.id)}
            >
              <IconTrash />
            </Button>
          </div>
        )
      })
    ],
    [colHelper, confirmAndMutate]
  );

  const { data, isPending } = useQuery(adminCourtsQueryOptions());

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
      addButton={
        <ManagedDialog id="create-court">
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
            <CreateCourtForm />
          </DialogContent>
        </ManagedDialog>
      }
    />
  );
};
export default CourtTable;
