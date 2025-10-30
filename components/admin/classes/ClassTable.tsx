'use client';

import { deleteClassApi } from '@/api/admin/class';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import PreviewImage from '@/components/ui/preview-image';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { STATUS_BADGE_VARIANT, STATUS_MAP } from '@/lib/constants';
import { adminClassesQueryOptions } from '@/queries/admin/class';
import type { Class } from '@/types/model';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useMemo } from 'react';

const ClassTable = () => {
  const { confirmAndMutate } = useConfirmMutation(
    {
      mutationFn: deleteClassApi
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
      invalidate: adminClassesQueryOptions.queryKey
    }
  );

  const colHelper = createColumnHelper<Class>();

  const columns = useMemo(
    () => [
      colHelper.accessor('image', {
        header: 'Preview',
        cell: (info) => <PreviewImage src={info.getValue()} />
      }),
      colHelper.accessor('name', {
        header: 'Nama Kelas',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('organizerName', {
        header: 'Penyelenggara',
        cell: (info) => info.getValue() || '-'
      }),
      colHelper.accessor('speakerName', {
        header: 'Pembicara',
        cell: (info) => info.getValue() || '-'
      }),
      colHelper.accessor('price', {
        header: 'Harga',
        cell: (info) => `Rp ${info.getValue().toLocaleString('id-ID')}`
      }),
      colHelper.accessor('startDate', {
        header: 'Perlaksanaan',
        cell: ({ row }) =>
          `${dayjs(row.original.startDate).format('DD/MM/YYYY')} - ${dayjs(row.original.endDate).format('DD/MM/YYYY')}`
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
            <Link href={`/admin/kelola-kelas/${row.original.id}`}>
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

  const { data, isPending } = useQuery(adminClassesQueryOptions);

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
      addButton={
        <Link href="/admin/kelola-kelas/tambah">
          <Button>
            <IconPlus />
            Tambah
          </Button>
        </Link>
      }
    />
  );
};
export default ClassTable;
