'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ROLE_MAP } from '@/lib/constants';
import { formatBookingDate } from '@/lib/booking-display';
import { formatPhone, getNameInitial, hasCreatePermission, hasEditPermission } from '@/lib/utils';
import { adminStaffsQueryOptions } from '@/queries/admin/staff';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { Staff } from '@/types/model';
import { IconPencil, IconPlus, IconEye } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo } from 'react';

const helper = createColumnHelper<Staff>();
const initialColumnVisibility = { createdAt: false };

export default function StaffTable() {
  const { data: me } = useQuery(adminProfileQueryOptions);
  const query = useQuery(adminStaffsQueryOptions);
  const canEdit = hasEditPermission(me?.role);
  const columns = useMemo(
    () => [
      helper.accessor((staff) => [staff.name, staff.email].filter(Boolean).join(' '), {
        id: 'staff',
        header: 'Karyawan',
        cell: ({ row }) => (
          <div className="flex min-w-60 items-center gap-3">
            <Avatar className="size-10 shrink-0 rounded-lg">
              <AvatarImage src={row.original.image || undefined} alt="" />
              <AvatarFallback className="bg-muted text-muted-foreground rounded-lg font-medium">
                {getNameInitial(row.original.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <p className="max-w-72 truncate font-medium" title={row.original.name}>
                {row.original.name}
              </p>
              {row.original.email && (
                <p
                  className="text-muted-foreground max-w-72 truncate text-xs"
                  title={row.original.email}
                >
                  {row.original.email}
                </p>
              )}
            </div>
          </div>
        )
      }),
      helper.accessor('phone', {
        header: 'Telepon',
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue() ? formatPhone(getValue()) : '—'}</span>
        )
      }),
      helper.accessor('role', {
        header: 'Peran',
        cell: ({ getValue }) => (
          <Badge variant="lightNeutral">
            {ROLE_MAP[getValue() as keyof typeof ROLE_MAP] ?? getValue()}
          </Badge>
        )
      }),
      helper.accessor('isActive', {
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge variant={getValue() ? 'lightSuccess' : 'lightNeutral'}>
            {getValue() ? 'Aktif' : 'Nonaktif'}
          </Badge>
        )
      }),
      helper.accessor('joinedAt', {
        header: 'Bergabung',
        cell: ({ getValue }) => {
          const joinedAt = getValue();
          return (
            <span className="text-muted-foreground tabular-nums">
              {joinedAt ? formatBookingDate(joinedAt, 'DD MMM YYYY') : '—'}
            </span>
          );
        }
      }),
      helper.accessor('createdAt', {
        header: 'Dibuat pada',
        cell: ({ getValue }) => (
          <span className="tabular-nums">
            {getValue() ? `${formatBookingDate(getValue(), 'DD MMM YYYY, HH:mm')} WIB` : '—'}
          </span>
        )
      }),
      helper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <Button asChild size="icon-sm" variant="ghost">
            <Link
              href={`/admin/kelola-karyawan/${row.original.id}`}
              aria-label={`${canEdit ? 'Edit' : 'Lihat'} ${row.original.name}`}
              title={canEdit ? 'Edit karyawan' : 'Lihat detail'}
            >
              {canEdit ? <IconPencil /> : <IconEye />}
            </Link>
          </Button>
        )
      })
    ],
    [canEdit]
  );

  if (query.isError)
    return (
      <div role="alert" className="space-y-3 rounded-xl border p-8 text-center">
        <p className="text-muted-foreground text-sm">Data karyawan belum dapat dimuat.</p>
        <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
          Coba lagi
        </Button>
      </div>
    );

  return (
    <div className="[&_thead]:bg-muted/50 min-w-0">
      <DataTable
        loading={query.isPending}
        data={query.data || []}
        columns={columns}
        enableRowSelection={false}
        getRowId={(staff) => staff.id}
        searchPlaceholder="Cari nama, email, atau telepon..."
        columnVisibilityLabel="Kolom"
        initialColumnVisibility={initialColumnVisibility}
        columnVisibilityStorageKey="quantum:staffs:columns"
        addButton={
          hasCreatePermission(me?.role) ? (
            <Button asChild className="rounded-lg">
              <Link href="/admin/kelola-karyawan/tambah">
                <IconPlus />
                Tambah karyawan
              </Link>
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
