'use client';

import { deletePaymentMethodApi } from '@/api/admin/paymentMethod';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  DialogContent,
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
import dayjs from 'dayjs';
import { useMemo } from 'react';
import CreatePaymentMethodForm from './CreatePaymentMethodForm';
import EditPaymentMethodForm from './EditPaymentMethodForm';
import PreviewImage from '@/components/ui/preview-image';
import { Badge } from '@/components/ui/badge';
import { STATUS_BADGE_VARIANT, STATUS_MAP } from '@/lib/constants';
import { hasCreatePermission, hasEditPermission, hasDeletePermission } from '@/lib/utils';

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

  const colHelper = createColumnHelper<PaymentMethod>();

  const columns = useMemo(
    () => [
      colHelper.accessor('logo', {
        header: 'Logo',
        cell: (info) => (
          <PreviewImage
            src={info.getValue()}
            className="aspect-square w-auto"
            placeholder="No Logo"
          />
        )
      }),
      colHelper.accessor('name', {
        header: 'Nama Metode',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('fees', {
        header: 'Biaya Layanan',
        cell: (info) => 'Rp ' + info.getValue().toLocaleString('id-ID')
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
            <ManagedDialog id={`${hasEditPermission(me?.role) ? 'edit' : 'view'}-payment-method-${row.original.id}`}>
              <DialogTrigger asChild>
                <Button size="icon" variant="lightInfo">
                  {hasEditPermission(me?.role) ? <IconPencil /> : <IconEye />}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader className="mb-4">
                  <DialogTitle>{hasEditPermission(me?.role) ? 'Edit' : 'View'} Metode Pembayaran</DialogTitle>
                </DialogHeader>
                <EditPaymentMethodForm data={row.original} />
              </DialogContent>
            </ManagedDialog>
            {hasDeletePermission(me?.role) && (
              <Button
                size="icon"
                variant="lightDanger"
                onClick={async () => await confirmAndMutate(row.original.id)}
              >
                <IconTrash />
              </Button>
            )}
          </div>
        )
      })
    ],
    [colHelper, confirmAndMutate, me?.role]
  );

  const { data, isPending } = useQuery(adminPaymentMethodsQueryOptions);

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
      addButton={
        hasCreatePermission(me?.role) ? (
          <ManagedDialog id="create-payment-method">
            <DialogTrigger asChild>
              <Button>
                <IconPlus />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="mb-4">
                <DialogTitle>Tambah Data Baru</DialogTitle>
              </DialogHeader>
              <CreatePaymentMethodForm />
            </DialogContent>
          </ManagedDialog>
        ) : undefined
      }
    />
  );
};
export default PaymentMethodTable;
