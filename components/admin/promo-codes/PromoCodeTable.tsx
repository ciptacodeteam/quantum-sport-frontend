'use client';

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
import { formatCurrency, formatNumber, hasCreatePermission, hasEditPermission } from '@/lib/utils';
import { adminPromoCodesQueryOptions } from '@/queries/admin/promo-code';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { PromoCode, PromoCodeStatus } from '@/types/model';
import { IconPencil, IconPlus, IconEye } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import CreatePromoCodeForm from './CreatePromoCodeForm';
import EditPromoCodeForm from './EditPromoCodeForm';

const STATUS_VARIANTS: Record<PromoCodeStatus, 'lightSuccess' | 'lightDestructive'> = {
  ACTIVE: 'lightSuccess',
  INACTIVE: 'lightDestructive'
};

const STATUS_LABELS: Record<PromoCodeStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
};

const PromoCodeTable = () => {
  const { data: me } = useQuery(adminProfileQueryOptions);
  const { data, isPending } = useQuery(adminPromoCodesQueryOptions);

  const colHelper = createColumnHelper<PromoCode>();

  const columns = useMemo(
    () => [
      colHelper.accessor('name', {
        header: 'Nama Promo',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('code', {
        header: 'Kode',
        cell: (info) => info.getValue()
      }),
      colHelper.display({
        id: 'discount',
        header: 'Diskon',
        cell: ({ row }) => {
          const percent = row.original.discountPercent;
          const amount = row.original.discountAmount;
          if (percent && percent > 0) {
            return `${formatNumber(percent)}%`;
          }
          if (amount && amount > 0) {
            return formatCurrency(amount);
          }
          return '-';
        }
      }),
      colHelper.accessor('startAt', {
        header: 'Mulai',
        cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY HH:mm')
      }),
      colHelper.accessor('endAt', {
        header: 'Selesai',
        cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY HH:mm')
      }),
      colHelper.accessor('usedCount', {
        header: 'Digunakan',
        cell: (info) => `${info.getValue()} / ${info.row.original.maxUsage}`
      }),
      colHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={STATUS_VARIANTS[info.getValue()]}>{STATUS_LABELS[info.getValue()]}</Badge>
        )
      }),
      colHelper.accessor('createdAt', {
        header: 'Dibuat',
        cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY HH:mm')
      }),
      colHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ManagedDialog
              id={`${hasEditPermission(me?.role) ? 'edit' : 'view'}-promo-${row.original.id}`}
            >
              <DialogTrigger asChild>
                <Button size="icon" variant="lightInfo">
                  {hasEditPermission(me?.role) ? <IconPencil /> : <IconEye />}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader className="mb-4">
                  <DialogTitle>
                    {hasEditPermission(me?.role) ? 'Edit' : 'View'} Promo Code
                  </DialogTitle>
                </DialogHeader>
                <EditPromoCodeForm data={row.original} readOnly={!hasEditPermission(me?.role)} />
              </DialogContent>
            </ManagedDialog>
          </div>
        )
      })
    ],
    [colHelper, me?.role]
  );

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
      addButton={
        hasCreatePermission(me?.role) ? (
          <ManagedDialog id="create-promo-code">
            <DialogTrigger asChild>
              <Button>
                <IconPlus />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="lg:min-w-xl">
              <DialogHeader className="mb-4">
                <DialogTitle>Tambah Promo Code</DialogTitle>
              </DialogHeader>
              <CreatePromoCodeForm />
            </DialogContent>
          </ManagedDialog>
        ) : undefined
      }
    />
  );
};

export default PromoCodeTable;
