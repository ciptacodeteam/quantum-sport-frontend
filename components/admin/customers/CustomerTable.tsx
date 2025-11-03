'use client';

import { deleteUserApi } from '@/api/admin/user';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import PreviewImage from '@/components/ui/preview-image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { STATUS_BADGE_VARIANT, STATUS_MAP } from '@/lib/constants';
import { formatPhone, getNameInitial } from '@/lib/utils';
import { adminUsersQueryOptions } from '@/queries/admin/user';
import type { UserProfile } from '@/types/model';
import {
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconPencil,
  IconTrash
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useMemo } from 'react';

const UserTable = () => {
  const { confirmAndMutate } = useConfirmMutation(
    {
      mutationFn: deleteUserApi
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
      invalidate: adminUsersQueryOptions.queryKey
    }
  );

  const colHelper = createColumnHelper<UserProfile>();

  const columns = useMemo(
    () => [
      colHelper.accessor('image', {
        header: 'Preview',
        cell: (info) => (
          <PreviewImage
            src={info.getValue()}
            className="aspect-square w-auto object-cover"
            placeholder={getNameInitial(info.row.original.name)}
          />
        )
      }),
      colHelper.accessor('name', {
        header: 'Nama Lapangan',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('phone', {
        header: 'Telepon',
        cell: (info) => (
          <div className="flex items-center gap-2">
            {formatPhone(info.getValue()) || '-'}
            {info.getValue() && (
              <Tooltip>
                <TooltipTrigger>
                  {info.row.original.emailVerified ? (
                    <IconCircleCheckFilled className="text-green-500" />
                  ) : (
                    <IconCircleXFilled className="text-red-500" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {info.row.original.emailVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )
      }),
      colHelper.accessor('email', {
        header: 'Email',
        cell: (info) => (
          <div className="flex items-center gap-2">
            {info.getValue() || '-'}
            {info.getValue() && (
              <Tooltip>
                <TooltipTrigger>
                  {info.row.original.emailVerified ? (
                    <IconCircleCheckFilled className="text-green-500" />
                  ) : (
                    <IconCircleXFilled className="text-red-500" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {info.row.original.emailVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )
      }),
      colHelper.accessor('banned', {
        header: 'Status',
        cell: (info) => (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant={STATUS_BADGE_VARIANT[Number(!info.getValue())]}>
                {STATUS_MAP[Number(!info.getValue())]}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {info.getValue() ? 'Pengguna diblokir' : 'Pengguna aktif'}
            </TooltipContent>
          </Tooltip>
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

  const { data, isPending } = useQuery(adminUsersQueryOptions);

  return (
    <DataTable loading={isPending} data={data || []} columns={columns} enableRowSelection={false} />
  );
};
export default UserTable;
