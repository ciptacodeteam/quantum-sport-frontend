'use client';

import { deleteCourtApi } from '@/api/admin/court';
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
import PreviewImage from '@/components/ui/preview-image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { formatBookingDate } from '@/lib/booking-display';
import { hasCreatePermission, hasEditPermission, hasDeletePermission } from '@/lib/utils';
import { adminCourtsQueryOptions } from '@/queries/admin/court';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { Court } from '@/types/model';
import { IconPencil, IconPlus, IconTrash, IconEye, IconPhoto } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo } from 'react';
import CreateCourtForm from './CreateCourtForm';

const colHelper = createColumnHelper<Court>();
const initialColumnVisibility = { createdAt: false };

const CourtTable = () => {
  const { data: me } = useQuery(adminProfileQueryOptions);
  const { canCreateTennis } = useAdminCourtSports();
  const { confirmAndMutate } = useConfirmMutation(
    {
      mutationFn: deleteCourtApi
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
      invalidate: adminCourtsQueryOptions().queryKey
    }
  );

  const columns = useMemo(
    () => [
      colHelper.accessor('name', {
        header: 'Lapangan',
        cell: ({ row, getValue }) => (
          <div className="flex min-w-60 items-center gap-3">
            {row.original.image ? (
              <PreviewImage
                src={row.original.image}
                alt={`Foto ${getValue()}`}
                className="h-12 w-16 shrink-0 rounded-lg border object-cover"
              />
            ) : (
              <div
                className="bg-muted/50 text-muted-foreground flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border"
                aria-label="Belum ada foto"
              >
                <IconPhoto className="size-5" />
              </div>
            )}
            <span className="max-w-72 truncate font-medium" title={getValue()}>
              {getValue()}
            </span>
          </div>
        )
      }),
      colHelper.accessor('description', {
        header: 'Deskripsi',
        cell: ({ getValue }) => (
          <p
            className="text-muted-foreground line-clamp-2 max-w-72 min-w-40 text-sm whitespace-normal"
            title={getValue() || undefined}
          >
            {getValue() || '—'}
          </p>
        )
      }),
      colHelper.accessor('sport', {
        header: 'Kategori',
        cell: (info) => (
          <Badge variant="outline">{info.getValue() === 'TENNIS' ? 'Tennis' : 'Padel'}</Badge>
        )
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
        header: 'Dibuat pada',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm tabular-nums">
            {getValue() ? `${formatBookingDate(getValue(), 'DD MMM YYYY, HH:mm')} WIB` : '—'}
          </span>
        )
      }),
      colHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button asChild size="icon-sm" variant="ghost">
              <Link
                href={`/admin/kelola-lapangan/${row.original.id}`}
                prefetch
                aria-label={`${hasEditPermission(me?.role) ? 'Edit' : 'Lihat'} ${row.original.name}`}
                title={hasEditPermission(me?.role) ? 'Edit lapangan' : 'Lihat detail'}
              >
                {hasEditPermission(me?.role) ? <IconPencil /> : <IconEye />}
              </Link>
            </Button>
            {hasDeletePermission(me?.role) && (
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Hapus ${row.original.name}`}
                title="Hapus lapangan"
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

  const { data, isPending } = useQuery(adminCourtsQueryOptions());

  return (
    <Tabs defaultValue="PADEL" className="w-full min-w-0 gap-4">
      <TabsList aria-label="Kategori lapangan">
        <TabsTrigger value="PADEL">Padel</TabsTrigger>
        <TabsTrigger value="TENNIS">Tennis</TabsTrigger>
      </TabsList>
      {(['PADEL', 'TENNIS'] as const).map((sport) => (
        <TabsContent key={sport} value={sport} className="[&_thead]:bg-muted/50 min-w-0">
          <DataTable
            loading={isPending}
            data={(data || []).filter((court) => court.sport === sport)}
            columns={columns}
            searchPlaceholder={`Cari lapangan ${sport === 'PADEL' ? 'Padel' : 'Tennis'}...`}
            enableRowSelection={false}
            getRowId={(court) => court.id}
            columnVisibilityLabel="Kolom"
            initialColumnVisibility={initialColumnVisibility}
            columnVisibilityStorageKey={`quantum:courts:columns:${sport}`}
            addButton={
              hasCreatePermission(me?.role) && (sport === 'PADEL' || canCreateTennis) ? (
                <ManagedDialog id="create-court">
                  <DialogTrigger asChild>
                    <Button>
                      <IconPlus />
                      Tambah {sport === 'PADEL' ? 'Padel' : 'Tennis'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90dvh] w-full max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl p-5 sm:max-w-3xl sm:p-6">
                    <DialogHeader className="border-b pb-5">
                      <DialogTitle>
                        Tambah Lapangan {sport === 'PADEL' ? 'Padel' : 'Tennis'}
                      </DialogTitle>
                      <DialogDescription>
                        Tambahkan foto dan informasi lapangan baru.
                      </DialogDescription>
                    </DialogHeader>
                    <CreateCourtForm defaultSport={sport} />
                  </DialogContent>
                </ManagedDialog>
              ) : undefined
            }
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};
export default CourtTable;
