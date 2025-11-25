'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import PreviewImage from '@/components/ui/preview-image';
import { ROLE_MAP, STATUS_BADGE_VARIANT, STATUS_MAP } from '@/lib/constants';
import { formatPhone, getNameInitial, hasCreatePermission, hasEditPermission } from '@/lib/utils';
import { adminStaffsQueryOptions } from '@/queries/admin/staff';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { Staff } from '@/types/model';
import { IconPencil, IconPlus, IconEye } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useMemo } from 'react';

const StaffTable = () => {
  const colHelper = createColumnHelper<Staff>();
  const { data: me } = useQuery(adminProfileQueryOptions);

  const columns = useMemo(
    () => [
      colHelper.accessor('image', {
        header: 'Foto',
        cell: (info) => (
          <PreviewImage
            src={info.getValue()}
            placeholder={getNameInitial(info.row.original.name)}
            className="aspect-square w-auto"
          />
        )
      }),
      colHelper.accessor('name', {
        header: 'Nama Lengkap',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('email', {
        header: 'Email',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('phone', {
        header: 'No. Telepon',
        cell: (info) => formatPhone(info.getValue())
      }),
      colHelper.accessor('role', {
        header: 'Role',
        cell: (info) => {
          const value = info.getValue();
          const label = ROLE_MAP[value as keyof typeof ROLE_MAP] ?? value;
          return <Badge variant={'lightNeutral'}>{label}</Badge>;
        }
      }),
      colHelper.accessor('joinedAt', {
        header: 'Bergabung Pada',
        cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY')
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
            <Link href={`/admin/kelola-karyawan/${row.original.id}`} prefetch>
              <Button size="icon" variant="lightInfo">
                {hasEditPermission(me?.role) ? <IconPencil /> : <IconEye />}
              </Button>
            </Link>
          </div>
        )
      })
    ],
    [colHelper, me?.role]
  );

  const { data, isPending } = useQuery(adminStaffsQueryOptions);

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
      addButton={
        hasCreatePermission(me?.role) ? (
          <Link href="/admin/kelola-karyawan/tambah" prefetch>
            <Button>
              <IconPlus />
              Tambah
            </Button>
          </Link>
        ) : undefined
      }
    />
  );
};
export default StaffTable;
