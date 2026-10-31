'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  DialogContent,
  DialogDescription,
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
import { formatBookingDate } from '@/lib/booking-display';
import { useMemo } from 'react';
import CreatePromoCodeForm from './CreatePromoCodeForm';
import EditPromoCodeForm from './EditPromoCodeForm';

const STATUS_VARIANTS: Record<PromoCodeStatus, 'lightSuccess' | 'lightNeutral'> = {
  ACTIVE: 'lightSuccess',
  INACTIVE: 'lightNeutral'
};

const STATUS_LABELS: Record<PromoCodeStatus, string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Nonaktif'
};

const colHelper = createColumnHelper<PromoCode>();
const initialColumnVisibility = { code: false, endAt: false, createdAt: false };
const dialogClassName =
  'max-h-[90dvh] w-full max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl p-5 sm:max-w-3xl sm:p-6';

const PromoCodeTable = () => {
  const { data: me } = useQuery(adminProfileQueryOptions);
  const { data, isPending } = useQuery(adminPromoCodesQueryOptions);

  const columns = useMemo(
    () => [
      colHelper.accessor('name', {
        header: 'Promo',
        cell: ({ row, getValue }) => (
          <div className="max-w-64 min-w-44 space-y-1">
            <p className="truncate font-medium" title={getValue()}>
              {getValue()}
            </p>
            <span className="text-muted-foreground font-mono text-xs tracking-wide">
              {row.original.code}
            </span>
          </div>
        )
      }),
      colHelper.accessor('code', {
        header: 'Kode',
        cell: (info) => <span className="font-mono text-xs tracking-wide">{info.getValue()}</span>
      }),
      colHelper.display({
        id: 'discount',
        header: 'Diskon',
        cell: ({ row }) => {
          const percent = row.original.discountPercent;
          const amount = row.original.discountAmount;
          if (percent && percent > 0) {
            return <span className="font-medium tabular-nums">{formatNumber(percent)}%</span>;
          }
          if (amount && amount > 0) {
            return <span className="font-medium tabular-nums">{formatCurrency(amount)}</span>;
          }
          return '-';
        }
      }),
      colHelper.accessor('startAt', {
        header: 'Periode Berlaku',
        cell: ({ row, getValue }) => (
          <div className="space-y-1 text-xs tabular-nums">
            <p>{formatBookingDate(getValue(), 'DD MMM YYYY, HH:mm')} WIB</p>
            <p className="text-muted-foreground">
              {row.original.endAt
                ? `s.d. ${formatBookingDate(row.original.endAt, 'DD MMM YYYY, HH:mm')} WIB`
                : 'Tanpa batas akhir'}
            </p>
          </div>
        )
      }),
      colHelper.accessor('endAt', {
        header: 'Selesai',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-xs tabular-nums">
            {getValue() ? `${formatBookingDate(getValue(), 'DD MMM YYYY, HH:mm')} WIB` : '—'}
          </span>
        )
      }),
      colHelper.accessor('usedCount', {
        header: 'Digunakan',
        cell: (info) => (
          <div className="tabular-nums">
            <span className="font-medium">{formatNumber(info.getValue())}</span>
            <span className="text-muted-foreground text-xs">
              {' '}
              / {formatNumber(info.row.original.maxUsage)} kali
            </span>
          </div>
        )
      }),
      colHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={STATUS_VARIANTS[info.getValue()]}>{STATUS_LABELS[info.getValue()]}</Badge>
        )
      }),
      colHelper.accessor('createdAt', {
        header: 'Dibuat',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-xs tabular-nums">
            {getValue() ? `${formatBookingDate(getValue(), 'DD MMM YYYY, HH:mm')} WIB` : '—'}
          </span>
        )
      }),
      colHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <ManagedDialog
              id={`${hasEditPermission(me?.role) ? 'edit' : 'view'}-promo-${row.original.id}`}
            >
              <DialogTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`${hasEditPermission(me?.role) ? 'Edit' : 'Lihat'} ${row.original.name}`}
                  title={hasEditPermission(me?.role) ? 'Edit promo' : 'Lihat detail'}
                >
                  {hasEditPermission(me?.role) ? <IconPencil /> : <IconEye />}
                </Button>
              </DialogTrigger>
              <DialogContent className={dialogClassName}>
                <DialogHeader className="border-b pb-5">
                  <DialogTitle>
                    {hasEditPermission(me?.role) ? 'Edit' : 'Detail'} Promo Code
                  </DialogTitle>
                  <DialogDescription>
                    Informasi promo, ketentuan diskon, dan periode penggunaan.
                  </DialogDescription>
                </DialogHeader>
                <EditPromoCodeForm data={row.original} readOnly={!hasEditPermission(me?.role)} />
              </DialogContent>
            </ManagedDialog>
          </div>
        )
      })
    ],
    [me?.role]
  );

  return (
    <div className="[&_thead]:bg-muted/50 w-full min-w-0">
      <DataTable
        loading={isPending}
        data={data || []}
        columns={columns}
        enableRowSelection={false}
        getRowId={(promo) => promo.id}
        searchPlaceholder="Cari nama atau kode promo..."
        columnVisibilityLabel="Kolom"
        initialColumnVisibility={initialColumnVisibility}
        columnVisibilityStorageKey="quantum:promo-codes:columns"
        addButton={
          hasCreatePermission(me?.role) ? (
            <ManagedDialog id="create-promo-code">
              <DialogTrigger asChild>
                <Button className="rounded-lg">
                  <IconPlus />
                  Tambah Promo
                </Button>
              </DialogTrigger>
              <DialogContent className={dialogClassName}>
                <DialogHeader className="border-b pb-5">
                  <DialogTitle>Tambah Promo Code</DialogTitle>
                  <DialogDescription>
                    Informasi promo, ketentuan diskon, dan periode penggunaan.
                  </DialogDescription>
                </DialogHeader>
                <CreatePromoCodeForm />
              </DialogContent>
            </ManagedDialog>
          ) : undefined
        }
      />
    </div>
  );
};

export default PromoCodeTable;
