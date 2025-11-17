'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import PreviewImage from '@/components/ui/preview-image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { STATUS_BADGE_VARIANT, STATUS_MAP } from '@/lib/constants';
import { formatPhone, getNameInitial } from '@/lib/utils';
import { adminCustomersQueryOptions } from '@/queries/admin/customer';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { Customer } from '@/types/model';
import { ROLE } from '@/lib/constants';
import { IconCircleCheckFilled, IconCircleXFilled, IconPencil, IconEye } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useMemo } from 'react';

const CustomerTable = () => {
  const { data: me } = useQuery(adminProfileQueryOptions);
  const isCashier = me?.role?.toUpperCase?.() === 'CASHIER';

  // const { confirmAndMutate } = useConfirmMutation(
  //   {
  //     mutationFn: deleteCustomerApi
  //   },
  //   {
  //     title: 'Hapus Data',
  //     description: 'Apakah Anda yakin ingin menghapus data ini?',
  //     confirmText: 'Hapus',
  //     cancelText: 'Batal',
  //     destructive: true,
  //     toastMessages: {
  //       loading: 'Menghapus data...',
  //       success: () => 'Data berhasil dihapus.',
  //       error: 'Gagal menghapus data.'
  //     },
  //     invalidate: adminCustomersQueryOptions.queryKey
  //   }
  // );

  const colHelper = createColumnHelper<Customer>();

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
            <Link href={`/admin/kelola-kustomer/${row.original.id}`} prefetch>
              <Button size="icon" variant={isCashier ? 'lightInfo' : 'lightInfo'}>
                {isCashier ? <IconEye /> : <IconPencil />}
              </Button>
            </Link>
          </div>
        )
      })
    ],
    [colHelper, isCashier]
  );

  const { data, isPending } = useQuery(adminCustomersQueryOptions);

  return (
    <DataTable loading={isPending} data={data || []} columns={columns} enableRowSelection={false} />
  );
};
export default CustomerTable;
