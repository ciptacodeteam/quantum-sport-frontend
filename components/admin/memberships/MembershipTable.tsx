'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { STATUS_BADGE_VARIANT, STATUS_MAP } from '@/lib/constants';
import { adminMembershipsQueryOptions } from '@/queries/admin/membership';
import type { Membership } from '@/types/model';
import { IconPencil, IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useMemo } from 'react';

const MembershipTable = () => {
  const colHelper = createColumnHelper<Membership>();

  const columns = useMemo(
    () => [
      colHelper.accessor('name', {
        header: 'Nama Membership',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('description', {
        header: 'Deskripsi',
        cell: (info) => <p className="line-clamp-2">{info.getValue() || '-'}</p>,
        meta: {
          width: 300
        }
      }),
      colHelper.accessor('duration', {
        header: 'Durasi (hari)',
        cell: (info) => info.getValue() + ' hari',
        meta: { width: 150 }
      }),
      colHelper.accessor('sessions', {
        header: 'Jam',
        cell: (info) => info.getValue() + ' jam',
        meta: { width: 100 }
      }),
      colHelper.accessor('sequence', {
        header: 'Urutan',
        cell: (info) => info.getValue(),
        meta: {
          width: 100
        }
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
            <Link href={`/admin/kelola-membership/${row.original.id}`} prefetch>
              <Button size="icon" variant="lightInfo">
                <IconPencil />
              </Button>
            </Link>
          </div>
        )
      })
    ],
    [colHelper]
  );

  const { data, isPending } = useQuery(adminMembershipsQueryOptions);

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
      addButton={
        <Link href="/admin/kelola-membership/tambah" prefetch>
          <Button>
            <IconPlus />
            Tambah
          </Button>
        </Link>
      }
    />
  );
};
export default MembershipTable;
