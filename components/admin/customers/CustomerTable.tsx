'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ROLE } from '@/lib/constants';
import { formatPhone, getNameInitial } from '@/lib/utils';
import { formatBookingDate } from '@/lib/booking-display';
import { adminCustomersQueryOptions } from '@/queries/admin/customer';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { Customer } from '@/types/model';
import { IconCircleCheckFilled, IconEye, IconPencil } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo } from 'react';

const sources = { ONLINE: 'Online', WALK_IN: 'Walk-in', ADMIN_CREATED: 'Admin' } as const;
const helper = createColumnHelper<Customer>();
export default function CustomerTable() {
  const { data: me } = useQuery(adminProfileQueryOptions);
  const query = useQuery(adminCustomersQueryOptions);
  const canEdit = [ROLE.ADMIN, ROLE.SUPER_ADMIN, ROLE.CASHIER].some(
    (role) => role === me?.role?.toUpperCase()
  );
  const columns = useMemo(
    () => [
      helper.accessor((item) => [item.name, item.email].filter(Boolean).join(' '), {
        id: 'customer',
        header: 'Kustomer',
        cell: ({ row }) => (
          <div className="flex min-w-44 items-center gap-4">
            <Avatar className="size-9 shrink-0 rounded-lg">
              <AvatarImage src={row.original.image || undefined} alt="" />
              <AvatarFallback className="bg-muted text-muted-foreground rounded-lg text-xs font-medium">
                {getNameInitial(row.original.name)}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-60 truncate text-sm font-medium" title={row.original.name}>
              {row.original.name}
            </span>
          </div>
        )
      }),
      helper.accessor('phone', {
        header: 'Telepon',
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-2 text-sm tabular-nums">
            {getValue() ? formatPhone(getValue()) : '—'}
            {getValue() && row.original.phoneVerified && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} aria-label="WhatsApp terverifikasi">
                    <IconCircleCheckFilled className="size-4 text-emerald-600" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>WhatsApp terverifikasi</TooltipContent>
              </Tooltip>
            )}
          </div>
        )
      }),
      helper.accessor('banned', {
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge variant={getValue() ? 'lightDestructive' : 'lightSuccess'}>
            {getValue() ? 'Diblokir' : 'Aktif'}
          </Badge>
        )
      }),
      helper.accessor('source', {
        header: 'Sumber',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm">{sources[getValue() || 'ONLINE']}</span>
        )
      }),
      helper.accessor('createdAt', {
        header: 'Bergabung',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm tabular-nums">
            {formatBookingDate(getValue(), 'DD MMM YYYY')}
          </span>
        )
      }),
      helper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <Button asChild size="icon-sm" variant="ghost">
            <Link
              href={`/admin/kelola-kustomer/${row.original.id}`}
              aria-label={`${canEdit ? 'Edit' : 'Lihat'} ${row.original.name}`}
              title={canEdit ? 'Edit kustomer' : 'Lihat detail'}
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
        <p className="text-muted-foreground text-sm">Data kustomer belum dapat dimuat.</p>
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
        getRowId={(item) => item.id}
        searchPlaceholder="Cari nama, telepon, atau email..."
        columnVisibilityLabel="Kolom"
        columnVisibilityStorageKey="quantum:customers:columns"
      />
    </div>
  );
}
