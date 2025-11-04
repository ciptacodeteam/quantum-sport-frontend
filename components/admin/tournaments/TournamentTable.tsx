'use client';

import { deleteTournamentApi } from '@/api/admin/tournament';
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
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { formatNumber } from '@/lib/utils';
import { adminTournamentsQueryOptions } from '@/queries/admin/tournament';
import type { Tournament } from '@/types/model';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import CreateTournamentForm from './CreateTournamentForm';
import EditTournamentForm from './EditTournamentForm';

const TournamentTable = () => {
  const { confirmAndMutate } = useConfirmMutation(
    {
      mutationFn: deleteTournamentApi
    },
    {
      title: 'Hapus Turnamen',
      description: 'Apakah Anda yakin ingin menghapus turnamen ini?',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      destructive: true,
      toastMessages: {
        loading: 'Menghapus turnamen...',
        success: () => 'Turnamen berhasil dihapus.',
        error: 'Gagal menghapus turnamen.'
      },
      invalidate: adminTournamentsQueryOptions().queryKey
    }
  );

  const colHelper = createColumnHelper<Tournament>();

  const columns = useMemo(
    () => [
      colHelper.accessor('name', {
        header: 'Nama Turnamen',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('startDate', {
        header: 'Tanggal Mulai',
        cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY')
      }),
      colHelper.accessor('endDate', {
        header: 'Tanggal Selesai',
        cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY')
      }),
      colHelper.accessor('startTime', {
        header: 'Waktu Mulai',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('endTime', {
        header: 'Waktu Selesai',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('location', {
        header: 'Lokasi',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('maxTeams', {
        header: 'Maks Tim',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('teamSize', {
        header: 'Ukuran Tim',
        cell: (info) => `${info.getValue()} pemain`
      }),
      colHelper.accessor('entryFee', {
        header: 'Biaya Pendaftaran',
        cell: (info) => `Rp ${formatNumber(info.getValue())}`
      }),
      colHelper.accessor('isActive', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={info.getValue() ? 'success' : 'secondary'}>
            {info.getValue() ? 'Active' : 'Inactive'}
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
            <ManagedDialog id={`edit-tournament-${row.original.id}`}>
              <DialogTrigger asChild>
                <Button size="icon" variant="lightInfo">
                  <IconPencil />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mb-4">
                  <DialogTitle>Edit Turnamen</DialogTitle>
                </DialogHeader>
                <EditTournamentForm data={row.original} />
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

  const { data, isPending } = useQuery(adminTournamentsQueryOptions());

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
      addButton={
        <ManagedDialog id="create-tournament">
          <DialogTrigger asChild>
            <Button>
              <IconPlus />
              Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle>Tambah Turnamen Baru</DialogTitle>
            </DialogHeader>
            <CreateTournamentForm />
          </DialogContent>
        </ManagedDialog>
      }
    />
  );
};
export default TournamentTable;

