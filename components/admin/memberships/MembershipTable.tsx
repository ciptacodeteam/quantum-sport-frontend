'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { STATUS_BADGE_VARIANT, STATUS_MAP } from '@/lib/constants';
import { membershipTypeLabels } from '@/lib/membership-hours';
import { hasCreatePermission, hasEditPermission } from '@/lib/utils';
import { adminMembershipsQueryOptions } from '@/queries/admin/membership';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { Membership } from '@/types/model';
import { IconPencil, IconPlus, IconEye } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type MembershipSportFilter = 'all' | 'PADEL' | 'TENNIS';

const sportLabels: Record<'PADEL' | 'TENNIS', string> = {
  PADEL: 'Padel',
  TENNIS: 'Tennis'
};

const MembershipTable = () => {
  const colHelper = createColumnHelper<Membership>();
  const { data: me } = useQuery(adminProfileQueryOptions);
  const [sportFilter, setSportFilter] = useState<MembershipSportFilter>('all');

  const columns = useMemo(
    () => [
      colHelper.accessor('name', {
        header: 'Nama Value Pack',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('description', {
        header: 'Deskripsi',
        cell: (info) => <p className="line-clamp-2">{info.getValue() || '-'}</p>,
        meta: {
          width: 300
        }
      }),
      colHelper.accessor('sport', {
        header: 'Kategori',
        cell: (info) => {
          const sport = (info.getValue() ?? 'PADEL') as 'PADEL' | 'TENNIS';
          return <Badge variant="outline">{sportLabels[sport]}</Badge>;
        },
        meta: { width: 120 }
      }),
      colHelper.accessor('type', {
        header: 'Jenis Jam',
        cell: (info) => <Badge variant="secondary">{membershipTypeLabels[info.getValue()]}</Badge>,
        meta: { width: 140 }
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
                {hasEditPermission(me?.role) ? <IconPencil /> : <IconEye />}
              </Button>
            </Link>
          </div>
        )
      })
    ],
    [colHelper, me?.role]
  );

  const queryParams = useMemo(
    () => (sportFilter === 'all' ? undefined : { sport: sportFilter }),
    [sportFilter]
  );
  const { data, isPending } = useQuery(adminMembershipsQueryOptions(queryParams));

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
      rightActions={
        <div className="flex items-center gap-2">
          <label htmlFor="membership-sport-filter" className="text-sm font-medium">
            Kategori:
          </label>
          <Select
            value={sportFilter}
            onValueChange={(value) => setSportFilter(value as MembershipSportFilter)}
          >
            <SelectTrigger id="membership-sport-filter" className="w-[150px]">
              <SelectValue placeholder="Semua" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="PADEL">Padel</SelectItem>
              <SelectItem value="TENNIS">Tennis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
      addButton={
        hasCreatePermission(me?.role) ? (
          <Link href="/admin/kelola-membership/tambah" prefetch>
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
export default MembershipTable;
