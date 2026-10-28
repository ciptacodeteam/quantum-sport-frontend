'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import {
  IconExternalLink,
  IconPencil,
  IconPlus,
  IconTrash,
  IconEye,
  IconPhoto
} from '@tabler/icons-react';
import { deleteBannerApi } from '@/api/admin/banner';
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
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { bannerLink } from '@/lib/banner-form-schema';
import { formatBookingDate } from '@/lib/booking-display';
import { hasCreatePermission, hasEditPermission, hasDeletePermission } from '@/lib/utils';
import { adminBannersQueryOptions } from '@/queries/admin/banner';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { Banner } from '@/types/model';
import CreateBannerForm from './CreateBannerForm';
import EditBannerForm from './EditBannerForm';

const helper = createColumnHelper<Banner>();
const visibility = { createdAt: false };
const dialogClass =
  'flex max-h-[90dvh] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-2xl';

export default function BannerTable() {
  const { data: me } = useQuery(adminProfileQueryOptions);
  const query = useQuery(adminBannersQueryOptions);
  const canEdit = hasEditPermission(me?.role);
  const canDelete = hasDeletePermission(me?.role);
  const { confirmAndMutate } = useConfirmMutation(
    { mutationFn: deleteBannerApi },
    {
      title: 'Hapus banner?',
      description: 'Banner akan dihapus dan tidak lagi ditampilkan kepada pelanggan.',
      confirmText: 'Hapus banner',
      cancelText: 'Batal',
      destructive: true,
      toastMessages: {
        loading: 'Menghapus banner...',
        success: 'Banner berhasil dihapus.',
        error: 'Gagal menghapus banner.'
      },
      invalidate: adminBannersQueryOptions.queryKey
    }
  );
  const columns = useMemo(
    () => [
      helper.accessor((banner) => `Banner ${banner.sequence} ${banner.link || ''}`, {
        id: 'banner',
        header: 'Banner',
        cell: ({ row }) => (
          <div className="flex min-w-52 items-center gap-3">
            <div className="bg-muted/30 relative flex h-12 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
              {row.original.image ? (
                <Image
                  src={row.original.image}
                  alt={`Banner urutan ${row.original.sequence}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <IconPhoto className="text-muted-foreground size-5" />
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="font-medium">Banner #{row.original.sequence}</p>
              <p
                className="text-muted-foreground max-w-48 truncate text-xs"
                title={row.original.link || undefined}
              >
                {bannerLink(row.original.link) ? new URL(row.original.link!).host : 'Tanpa tautan'}
              </p>
            </div>
          </div>
        )
      }),
      helper.accessor('isActive', {
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge variant={getValue() ? 'lightSuccess' : 'lightNeutral'}>
            {getValue() ? 'Aktif' : 'Nonaktif'}
          </Badge>
        )
      }),
      helper.accessor('sequence', {
        header: 'Urutan',
        cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>
      }),
      helper.accessor('startAt', {
        header: 'Jadwal tayang (WIB)',
        cell: ({ row }) => (
          <div className="space-y-1">
            <p>
              {row.original.startAt
                ? formatBookingDate(row.original.startAt, 'DD MMM YYYY, HH:mm')
                : 'Tanpa tanggal mulai'}
            </p>
            <p className="text-muted-foreground text-xs">
              {row.original.endAt
                ? `s.d. ${formatBookingDate(row.original.endAt, 'DD MMM YYYY, HH:mm')}`
                : 'Tanpa batas akhir'}
            </p>
          </div>
        )
      }),
      helper.accessor('createdAt', {
        header: 'Dibuat pada',
        cell: ({ getValue }) => formatBookingDate(getValue(), 'DD MMM YYYY, HH:mm')
      }),
      helper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const banner = row.original;
          const link = bannerLink(banner.link);
          return (
            <div className="flex items-center gap-1">
              <ManagedDialog id={`${canEdit ? 'edit' : 'view'}-banner-${banner.id}`}>
                <DialogTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`${canEdit ? 'Edit' : 'Lihat'} banner ${banner.sequence}`}
                    title={canEdit ? 'Edit banner' : 'Lihat banner'}
                  >
                    {canEdit ? <IconPencil /> : <IconEye />}
                  </Button>
                </DialogTrigger>
                <DialogContent className={dialogClass}>
                  <DialogHeader className="shrink-0 gap-1.5 border-b px-5 py-5 pr-12 text-left">
                    <DialogTitle className="text-foreground text-lg">
                      {canEdit ? 'Edit banner' : 'Detail banner'}
                    </DialogTitle>
                    <DialogDescription>
                      {canEdit
                        ? 'Perbarui gambar, tautan, dan jadwal penayangan banner.'
                        : 'Pratinjau dan informasi penayangan banner.'}
                    </DialogDescription>
                  </DialogHeader>
                  <EditBannerForm data={banner} readOnly={!canEdit} />
                </DialogContent>
              </ManagedDialog>
              {link && (
                <Button asChild size="icon-sm" variant="ghost">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Buka tautan"
                    aria-label={`Buka tautan banner ${banner.sequence}`}
                  >
                    <IconExternalLink />
                  </a>
                </Button>
              )}
              {canDelete && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/5 hover:text-destructive"
                  title="Hapus banner"
                  aria-label={`Hapus banner ${banner.sequence}`}
                  onClick={() => confirmAndMutate(banner.id)}
                >
                  <IconTrash />
                </Button>
              )}
            </div>
          );
        }
      })
    ],
    [canEdit, canDelete, confirmAndMutate]
  );

  if (query.isError)
    return (
      <div role="alert" className="space-y-3 rounded-xl border p-8 text-center">
        <p className="text-muted-foreground text-sm">Data banner belum dapat dimuat.</p>
        <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  return (
    <div className="[&_thead]:bg-muted/50 min-w-0 space-y-3">
      <p className="text-muted-foreground bg-muted/20 rounded-lg border px-4 py-3 text-sm">
        Berlaku untuk semua cabang. Penambahan, perubahan, dan penghapusan banner diterapkan di
        seluruh lokasi.
      </p>
      <DataTable
        loading={query.isPending}
        data={query.data || []}
        columns={columns}
        enableRowSelection={false}
        getRowId={(banner) => banner.id}
        searchPlaceholder="Cari banner atau tautan..."
        columnVisibilityLabel="Kolom"
        columnVisibilityStorageKey="quantum:banners:columns"
        initialColumnVisibility={visibility}
        addButton={
          hasCreatePermission(me?.role) ? (
            <ManagedDialog id="create-banner">
              <DialogTrigger asChild>
                <Button className="rounded-lg">
                  <IconPlus />
                  Tambah banner
                </Button>
              </DialogTrigger>
              <DialogContent className={dialogClass}>
                <DialogHeader className="shrink-0 gap-1.5 border-b px-5 py-5 pr-12 text-left">
                  <DialogTitle className="text-foreground text-lg">Tambah banner</DialogTitle>
                  <DialogDescription>
                    Unggah gambar dan atur penayangan banner untuk pelanggan.
                  </DialogDescription>
                </DialogHeader>
                <CreateBannerForm />
              </DialogContent>
            </ManagedDialog>
          ) : undefined
        }
      />
    </div>
  );
}
