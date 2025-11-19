'use client';

import { deleteTournamentApi } from '@/api/admin/tournament';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { STATUS_BADGE_VARIANT, STATUS_MAP } from '@/lib/constants';
import { formatNumber, hasCreatePermission, hasEditPermission, hasDeletePermission } from '@/lib/utils';
import { adminTournamentsQueryOptions } from '@/queries/admin/tournament';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { Tournament } from '@/types/model';
import { IconPencil, IconPlus, IconTrash, IconEye } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

const TournamentTable = () => {
  const router = useRouter();
  const { data: me } = useQuery(adminProfileQueryOptions);

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
        header: 'Tanggal',
        cell: (info) =>
          `${dayjs(info.getValue()).format('DD/MM/YYYY HH:mm')} - ${dayjs(info.row.original.endDate).format('DD/MM/YYYY HH:mm')}`
      }),
      colHelper.accessor('location', {
        header: 'Lokasi',
        cell: (info) => <p className="line-clamp-1">{info.getValue()}</p>
      }),
      colHelper.accessor('maxTeams', {
        header: 'Maks Tim',
        cell: (info) => info.getValue()
      }),
      colHelper.accessor('entryFee', {
        header: 'Biaya Pendaftaran',
        cell: (info) => `Rp ${formatNumber(info.getValue())}`
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
            <Button
              size="icon"
              variant="lightInfo"
              onClick={() => router.push(`/admin/kelola-turnamen/${row.original.id}`)}
            >
              {hasEditPermission(me?.role) ? <IconPencil /> : <IconEye />}
            </Button>
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
    [colHelper, confirmAndMutate, router, me?.role]
  );

  const { data, isPending } = useQuery(adminTournamentsQueryOptions());

  return (
    <DataTable
      loading={isPending}
      data={data || []}
      columns={columns}
      enableRowSelection={false}
      addButton={
        hasCreatePermission(me?.role) ? (
          <Button onClick={() => router.push('/admin/kelola-turnamen/tambah')}>
            <IconPlus />
            Tambah
          </Button>
        ) : undefined
      }
    />
  );
};
export default TournamentTable;
