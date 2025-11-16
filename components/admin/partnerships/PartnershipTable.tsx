'use client';

import { deletePartnershipApi } from '@/api/admin/partnership';
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
import PreviewImage from '@/components/ui/preview-image';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { STATUS_BADGE_VARIANT, STATUS_MAP } from '@/lib/constants';
import { adminPartnershipsQueryOptions } from '@/queries/admin/partnership';
import type { Partnership } from '@/types/model';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import CreatePartnershipForm from './CreatePartnershipForm';
import EditPartnershipForm from './EditPartnershipForm';

const PartnershipTable = () => {
  const { confirmAndMutate } = useConfirmMutation({
    mutationFn: deletePartnershipApi,
    successMessage: 'Data berhasil dihapus!',
    invalidateQueryKey: adminPartnershipsQueryOptions.queryKey
  });

  const colHelper = createColumnHelper<Partnership>();

  const columns = useMemo(
    () => [
      colHelper.accessor('logo', {
        id: 'logo',
        header: 'Logo',
        cell: (info) => (
          <div className="w-16">
            <PreviewImage src={info.getValue() || ''} alt={info.row.original.name} className="rounded-md" />
          </div>
        )
      }),
      colHelper.accessor('name', { id: 'name', header: 'Name' }),
      colHelper.accessor('description', {
        id: 'description',
        header: 'Deskripsi',
        cell: (info) => info.getValue() || '-'
      }),
      colHelper.accessor('isActive', {
        id: 'isActive',
        header: 'Status',
        cell: (info) => (
          <Badge variant={STATUS_BADGE_VARIANT[Number(info.getValue())]}>
            {STATUS_MAP[Number(info.getValue())]}
          </Badge>
        )
      }),
      colHelper.accessor('createdAt', {
        id: 'createdAt',
        header: 'Dibuat',
        cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY HH:mm')
      }),
      colHelper.accessor('updatedAt', {
        id: 'updatedAt',
        header: 'Diperbarui',
        cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY HH:mm')
      }),
      colHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ManagedDialog id={`edit-partnership-${row.original.id}`}>
              <DialogTrigger asChild>
                <Button size="icon" variant="lightInfo">
                  <IconPencil />
                </Button>
              </DialogTrigger>
              <DialogContent className="lg:min-w-xl">
                <DialogHeader className="mb-4">
                  <DialogTitle>Edit Partnership</DialogTitle>
                </DialogHeader>
                <EditPartnershipForm data={row.original} />
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

  const { data, isPending } = useQuery(adminPartnershipsQueryOptions);

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
      addButton={
        <ManagedDialog id="create-partnership">
          <DialogTrigger asChild>
            <Button>
              <IconPlus />
              Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="lg:min-w-xl">
            <DialogHeader className="mb-4">
              <DialogTitle>Tambah Data Baru</DialogTitle>
            </DialogHeader>
            <CreatePartnershipForm />
          </DialogContent>
        </ManagedDialog>
      }
    />
  );
};
export default PartnershipTable;


