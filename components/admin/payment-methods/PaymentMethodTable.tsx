'use client';

import { deletePaymentMethodApi } from '@/api/admin/paymentMethod';
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
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { adminPaymentMethodsQueryOptions } from '@/queries/admin/paymentMethod';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { PaymentMethod } from '@/types/model';
import { IconPencil, IconPlus, IconTrash, IconEye } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { formatBookingDate } from '@/lib/booking-display';
import { CreditCard } from 'lucide-react';
import { useMemo } from 'react';
import CreatePaymentMethodForm from './CreatePaymentMethodForm';
import EditPaymentMethodForm from './EditPaymentMethodForm';
import PreviewImage from '@/components/ui/preview-image';
import { Badge } from '@/components/ui/badge';
import { hasCreatePermission, hasEditPermission, hasDeletePermission } from '@/lib/utils';

const colHelper = createColumnHelper<PaymentMethod>();
const initialColumnVisibility = { channel: false, sequence: false, createdAt: false };
const dialogClassName =
  'max-h-[90dvh] w-full max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl p-5 sm:max-w-3xl sm:p-6';

const PaymentMethodTable = () => {
  const { data: me } = useQuery(adminProfileQueryOptions);
  const { confirmAndMutate } = useConfirmMutation(
    {
      mutationFn: deletePaymentMethodApi
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
      invalidate: adminPaymentMethodsQueryOptions.queryKey
    }
  );

  const columns = useMemo(
    () => [
      colHelper.accessor('name', {
        header: 'Metode Pembayaran',
        cell: ({ row, getValue }) => (
          <div className="flex min-w-60 items-center gap-3">
            {row.original.logo ? (
              <PreviewImage
                src={row.original.logo}
                alt={`Logo ${getValue()}`}
                className="h-10 w-14 rounded-lg border bg-white object-contain p-1"
              />
            ) : (
              <div className="bg-muted/50 text-muted-foreground flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border">
                <CreditCard className="size-5" />
              </div>
            )}
            <div className="max-w-64 min-w-0 space-y-1">
              <p className="truncate font-medium" title={getValue()}>
                {getValue()}
              </p>
              {row.original.channel && (
                <p
                  className="text-muted-foreground truncate font-mono text-xs"
                  title={row.original.channel}
                >
                  {row.original.channel}
                </p>
              )}
            </div>
          </div>
        )
      }),
      colHelper.accessor('channel', {
        header: 'Channel',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground font-mono text-xs">{getValue() || '—'}</span>
        )
      }),
      colHelper.accessor('fees', {
        header: 'Biaya Layanan',
        cell: (info) => (
          <span className="font-medium tabular-nums">
            Rp {info.getValue().toLocaleString('id-ID')}
          </span>
        )
      }),
      colHelper.accessor('percentage', {
        header: 'Biaya Persentase',
        cell: (info) => <span className="tabular-nums">{info.getValue()}%</span>
      }),
      colHelper.accessor('sequence', {
        header: 'Urutan',
        cell: (info) => info.getValue()
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
              id={`${hasEditPermission(me?.role) ? 'edit' : 'view'}-payment-method-${row.original.id}`}
            >
              <DialogTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`${hasEditPermission(me?.role) ? 'Edit' : 'Lihat'} ${row.original.name}`}
                  title={hasEditPermission(me?.role) ? 'Edit metode pembayaran' : 'Lihat detail'}
                >
                  {hasEditPermission(me?.role) ? <IconPencil /> : <IconEye />}
                </Button>
              </DialogTrigger>
              <DialogContent className={dialogClassName}>
                <DialogHeader className="border-b pb-5">
                  <DialogTitle>
                    {hasEditPermission(me?.role) ? 'Edit' : 'Detail'} Metode Pembayaran
                  </DialogTitle>
                  <DialogDescription>
                    Informasi metode pembayaran, biaya layanan, dan status ketersediaan.
                  </DialogDescription>
                </DialogHeader>
                <EditPaymentMethodForm
                  data={row.original}
                  readOnly={!hasEditPermission(me?.role)}
                />
              </DialogContent>
            </ManagedDialog>
            {hasDeletePermission(me?.role) && (
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Hapus ${row.original.name}`}
                title="Hapus metode pembayaran"
                onClick={async () => await confirmAndMutate(row.original.id)}
              >
                <IconTrash />
              </Button>
            )}
          </div>
        )
      })
    ],
    [confirmAndMutate, me?.role]
  );

  const { data, isPending } = useQuery(adminPaymentMethodsQueryOptions);

  return (
    <div className="[&_thead]:bg-muted/50 w-full min-w-0">
      <DataTable
        loading={isPending}
        data={data || []}
        columns={columns}
        enableRowSelection={false}
        getRowId={(method) => method.id}
        searchPlaceholder="Cari metode pembayaran atau channel..."
        columnVisibilityLabel="Kolom"
        initialColumnVisibility={initialColumnVisibility}
        columnVisibilityStorageKey="quantum:payment-methods:columns"
        addButton={
          hasCreatePermission(me?.role) ? (
            <ManagedDialog id="create-payment-method">
              <DialogTrigger asChild>
                <Button className="rounded-lg">
                  <IconPlus />
                  Tambah Metode
                </Button>
              </DialogTrigger>
              <DialogContent className={dialogClassName}>
                <DialogHeader className="border-b pb-5">
                  <DialogTitle>Tambah Metode Pembayaran</DialogTitle>
                  <DialogDescription>
                    Informasi metode pembayaran, biaya layanan, dan status ketersediaan.
                  </DialogDescription>
                </DialogHeader>
                <CreatePaymentMethodForm />
              </DialogContent>
            </ManagedDialog>
          ) : undefined
        }
      />
    </div>
  );
};
export default PaymentMethodTable;
