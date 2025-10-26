'use client';

import { deletePaymentMethodApi } from '@/api/admin/payment-method';
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
import { adminPaymentMethodsQueryOptions } from '@/queries/admin/payment-method';
import type { PaymentMethod } from '@/types/model';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import CreatePaymentMethodForm from './CreatePaymentMethodForm';
import EditPaymentMethodForm from './EditPaymentMethodForm';

const PaymentMethodTable = () => {
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
      colHelper.accessor('name', {
        header: 'Nama Alat',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('description', {
        header: 'Keterangan',
        cell: (info) => <p className="line-clamp-2">{info.getValue() || '-'}</p>
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
            <ManagedDialog id={`edit-paymentMethod-${row.original.id}`}>
              <DialogTrigger asChild>
                <Button size="icon" variant="lightInfo">
                  <IconPencil />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader className="mb-4">
                  <DialogTitle>Edit PaymentMethod</DialogTitle>
                </DialogHeader>
                {/* You would typically have an EditPaymentMethodForm component here */}
                <EditPaymentMethodForm data={row.original} />
              </DialogContent>
            </ManagedDialog>
            <Button
              size="icon"
              variant="lightDanger"
              onClick={async () => await confirmAndMutate(row.original.id)}
            >
              <IconTrash />
            </Button>
          </div>
        )
      })
    ],
    [colHelper, confirmAndMutate]
  );

  const { data, isPending } = useQuery(adminPaymentMethodsQueryOptions);

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
      addButton={
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
      }
    />
  );
};
export default PaymentMethodTable;
