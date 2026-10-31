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
import { formatBookingDate } from '@/lib/booking-display';
import { membershipTypeLabels } from '@/lib/membership-hours';
import { formatNumber, hasCreatePermission, hasEditPermission } from '@/lib/utils';
import { adminMembershipsQueryOptions } from '@/queries/admin/membership';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { Membership } from '@/types/model';
import { IconPencil, IconPlus, IconEye } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type MembershipSportFilter = 'all' | 'PADEL' | 'TENNIS';

const sportLabels: Record<'PADEL' | 'TENNIS', string> = {
  PADEL: 'Padel',
  TENNIS: 'Tennis'
};
const colHelper = createColumnHelper<Membership>();
const initialColumnVisibility = {
  description: false,
  duration: false,
  sequence: false,
  createdAt: false
};

const MembershipTable = () => {
  const { data: me } = useQuery(adminProfileQueryOptions);
  const [sportFilter, setSportFilter] = useState<MembershipSportFilter>('all');

  const columns = useMemo(
    () => [
      colHelper.accessor('name', {
        header: 'Nama Value Pack',
        cell: ({ row, getValue }) => (
          <div className="max-w-64 min-w-44 space-y-1">
            <p className="truncate font-medium" title={getValue()}>
              {getValue()}
            </p>
            <p
              className="text-muted-foreground line-clamp-2 text-xs whitespace-normal"
              title={row.original.description || undefined}
            >
              {row.original.description || 'Tanpa deskripsi'}
            </p>
          </div>
        )
      }),
      colHelper.accessor('description', {
        header: 'Deskripsi',
        cell: (info) => (
          <p className="text-muted-foreground line-clamp-2 max-w-64 min-w-40 whitespace-normal">
            {info.getValue() || '—'}
          </p>
        )
      }),
      colHelper.accessor('sport', {
        header: 'Kategori',
        cell: (info) => {
          const sport = (info.getValue() ?? 'PADEL') as 'PADEL' | 'TENNIS';
          return <Badge variant="outline">{sportLabels[sport]}</Badge>;
        }
      }),
      colHelper.accessor('type', {
        header: 'Jenis Jam',
        cell: (info) => (
          <Badge variant="lightNeutral">{membershipTypeLabels[info.getValue()]}</Badge>
        )
      }),
      colHelper.accessor('duration', {
        header: 'Durasi (hari)',
        cell: (info) => <span className="tabular-nums">{info.getValue()} hari</span>
      }),
      colHelper.accessor('sessions', {
        header: 'Kuota & Durasi',
        cell: ({ row, getValue }) => (
          <div className="space-y-1 tabular-nums">
            <p className="font-medium">{getValue()} jam</p>
            <p className="text-muted-foreground text-xs">Berlaku {row.original.duration} hari</p>
          </div>
        )
      }),
      colHelper.accessor('price', {
        header: 'Harga',
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums">Rp {formatNumber(getValue())}</span>
        )
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
          <Badge variant={info.getValue() ? 'lightSuccess' : 'lightNeutral'}>
            {info.getValue() ? 'Aktif' : 'Nonaktif'}
          </Badge>
        )
      }),
      colHelper.accessor('createdAt', {
        header: 'Dibuat Pada',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground tabular-nums">
            {getValue() ? `${formatBookingDate(getValue(), 'DD MMM YYYY, HH:mm')} WIB` : '—'}
          </span>
        )
      }),
      colHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <Button asChild size="icon-sm" variant="ghost">
            <Link
              href={`/admin/kelola-membership/${row.original.id}`}
              prefetch
              aria-label={`${hasEditPermission(me?.role) ? 'Edit' : 'Lihat'} ${row.original.name}`}
              title={hasEditPermission(me?.role) ? 'Edit Value Pack' : 'Lihat detail'}
            >
              {hasEditPermission(me?.role) ? <IconPencil /> : <IconEye />}
            </Link>
          </Button>
        )
      })
    ],
    [me?.role]
  );

  const queryParams = useMemo(
    () => (sportFilter === 'all' ? undefined : { sport: sportFilter }),
    [sportFilter]
  );
  const { data, isPending } = useQuery(adminMembershipsQueryOptions(queryParams));

  return (
    <div className="[&_thead]:bg-muted/50 w-full min-w-0">
      <DataTable
        loading={isPending}
        data={data || []}
        columns={columns}
        enableRowSelection={false}
        getRowId={(membership) => membership.id}
        searchPlaceholder="Cari Value Pack..."
        columnVisibilityLabel="Kolom"
        initialColumnVisibility={initialColumnVisibility}
        columnVisibilityStorageKey="quantum:memberships:columns"
        rightActions={
          <div className="flex items-center gap-2">
            <label htmlFor="membership-sport-filter" className="text-sm font-medium">
              Kategori:
            </label>
            <Select
              value={sportFilter}
              onValueChange={(value) => setSportFilter(value as MembershipSportFilter)}
            >
              <SelectTrigger id="membership-sport-filter" className="h-9 w-32">
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
            <Button asChild className="rounded-lg">
              <Link href="/admin/kelola-membership/tambah" prefetch>
                <IconPlus />
                Tambah Value Pack
              </Link>
            </Button>
          ) : undefined
        }
      />
    </div>
  );
};
export default MembershipTable;
