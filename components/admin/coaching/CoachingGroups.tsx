'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { IconPlus, IconPencil } from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  coachingGroupApi,
  type CoachingGroup,
  type CoachingGroupInput
} from '@/api/admin/coachingGroup';
import { getAdminBranches } from '@/api/branch';
import { useHasRole, useRoleAccess } from '@/hooks/useRoleAccess';
import { getApiErrorMessage } from '@/lib/api-error';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
const empty = (): CoachingGroupInput => ({
  name: '',
  description: '',
  sports: ['PADEL'],
  branchIds: [],
  isActive: true
});
const col = createColumnHelper<CoachingGroup>();
export default function CoachingGroups() {
  const { hasAccess, isLoading } = useRoleAccess({ allowedRoles: ['ADMIN'] });
  const canEdit = useHasRole(['SUPER_ADMIN']);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['admin', 'coaching-groups'],
    queryFn: () => coachingGroupApi.list(),
    enabled: hasAccess
  });
  const branches = useQuery({
    queryKey: ['admin', 'branches'],
    queryFn: getAdminBranches,
    enabled: hasAccess && canEdit
  });
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<string>();
  const [draft, setDraft] = useState(empty);
  const [existingLogo, setExistingLogo] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState('');
  const logoInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!draft.logo) {
      setLogoPreview(draft.removeLogo ? null : existingLogo);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(String(reader.result));
    reader.onerror = () => setLogoError('Gambar belum dapat dibaca. Pilih ulang file.');
    reader.readAsDataURL(draft.logo);
    return () => {
      if (reader.readyState === FileReader.LOADING) reader.abort();
    };
  }, [draft.logo, draft.removeLogo, existingLogo]);
  const begin = (group?: CoachingGroup) => {
    setId(group?.id);
    setExistingLogo(group?.logo || null);
    setLogoPreview(group?.logo || null);
    setLogoError('');
    setDraft(
      group
        ? {
            name: group.name,
            description: group.description || '',
            sports: group.sports,
            branchIds: group.branches.map((b) => b.branchId),
            isActive: group.isActive
          }
        : empty()
    );
    setOpen(true);
  };
  const save = useMutation({
    mutationFn: () => coachingGroupApi.save(id, draft),
    onSuccess: () => {
      setOpen(false);
      for (const queryKey of [
        ['admin', 'coaching-groups'],
        ['admin', 'coaching']
      ])
        void client.invalidateQueries({ queryKey });
      toast.success('Grup coaching disimpan.');
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'Grup coaching belum dapat disimpan.'))
  });
  const columns = useMemo(
    () => [
      col.accessor('name', {
        header: 'Nama grup',
        cell: ({ row }) => (
          <div className="flex min-w-44 items-center gap-3">
            <Avatar className="size-10 rounded-lg">
              <AvatarImage src={row.original.logo || undefined} alt={row.original.name} />
              <AvatarFallback className="rounded-lg">
                {row.original.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-muted-foreground max-w-sm text-xs whitespace-normal">
                {row.original.description}
              </p>
            </div>
          </div>
        )
      }),
      col.accessor((g) => g.sports.map((s) => (s === 'PADEL' ? 'Padel' : 'Tennis')).join(' & '), {
        id: 'sports',
        header: 'Olahraga'
      }),
      col.accessor((g) => g.branches.map((b) => b.branch.name).join(', '), {
        id: 'branches',
        header: 'Cabang',
        cell: ({ getValue }) => (
          <span className="block max-w-xs whitespace-normal">{getValue()}</span>
        )
      }),
      col.accessor((g) => g.coaches.length, { id: 'coaches', header: 'Jumlah coach' }),
      col.accessor('isActive', {
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge variant={getValue() ? 'lightSuccess' : 'lightNeutral'}>
            {getValue() ? 'Aktif' : 'Nonaktif'}
          </Badge>
        )
      }),
      col.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) =>
          canEdit ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit grup ${row.original.name}`}
              onClick={() => begin(row.original)}
            >
              <IconPencil />
            </Button>
          ) : (
            '—'
          )
      })
    ],
    [canEdit]
  );
  if (isLoading || !hasAccess) return <p>Memuat...</p>;
  return (
    <main className="min-w-0 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Grup Coaching</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Kelola brand coaching dan cabang layanan. Anggota coach diatur melalui profil Coach.
        </p>
      </div>
      {!canEdit && (
        <p className="text-muted-foreground text-sm">
          Pengaturan grup lintas cabang dikelola oleh Super Admin. Admin dapat mengatur keanggotaan
          melalui profil coach di cabangnya.
        </p>
      )}
      {query.isError ? (
        <div role="alert">
          <p>Grup belum dapat dimuat.</p>
          <Button onClick={() => void query.refetch()}>Coba lagi</Button>
        </div>
      ) : (
        <DataTable
          data={query.data ?? []}
          columns={columns}
          loading={query.isPending}
          enableRowSelection={false}
          searchPlaceholder="Cari grup, olahraga, atau cabang..."
          columnVisibilityLabel="Kolom"
          addButton={
            canEdit && (
              <Button onClick={() => begin()}>
                <IconPlus />
                Tambah grup
              </Button>
            )
          }
        />
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!save.isPending) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{id ? 'Edit' : 'Tambah'} grup coaching</DialogTitle>
            <DialogDescription>
              Grup hanya dipilih oleh admin saat menambahkan coach. Jadwal dan harga tetap mengikuti
              coach.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!logoError) save.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="group-name">Nama grup</Label>
              <Input
                id="group-name"
                required
                maxLength={100}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="group-logo">Logo grup (opsional)</Label>
              <div className="bg-muted/20 flex min-h-32 items-center justify-center rounded-lg border p-4">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Pratinjau logo grup"
                    width={120}
                    height={120}
                    unoptimized
                    className="size-28 object-contain"
                  />
                ) : (
                  <span className="text-muted-foreground text-sm">Belum ada logo</span>
                )}
              </div>
              <Input
                ref={logoInput}
                id="group-logo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={save.isPending}
                aria-invalid={!!logoError}
                aria-describedby="group-logo-help"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setLogoError('');
                  if (
                    file &&
                    (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
                      file.size === 0 ||
                      file.size > 5 * 1024 * 1024)
                  ) {
                    setLogoError('Gunakan gambar JPG, PNG, atau WebP, maksimal 5 MB.');
                    setDraft({ ...draft, logo: undefined });
                    event.target.value = '';
                    return;
                  }
                  setDraft({ ...draft, logo: file, ...(file ? { removeLogo: false } : {}) });
                }}
              />
              <p id="group-logo-help" className="text-muted-foreground text-xs">
                JPG, PNG, atau WebP, maksimal 5 MB.
                {id ? ' Logo lama tetap dipakai jika tidak memilih file baru.' : ''}
              </p>
              {logoError && (
                <p role="alert" className="text-destructive text-xs">
                  {logoError}
                </p>
              )}
              {(logoPreview || draft.logo) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={save.isPending}
                  onClick={() => {
                    setDraft({ ...draft, logo: undefined, removeLogo: true });
                    setLogoError('');
                    if (logoInput.current) logoInput.current.value = '';
                  }}
                >
                  Hapus logo
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Deskripsi (opsional)</Label>
              <Textarea
                id="group-description"
                maxLength={2000}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">Olahraga</legend>
              <div className="flex gap-5">
                {(['PADEL', 'TENNIS'] as const).map((sport) => (
                  <label key={sport} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.sports.includes(sport)}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          sports: e.target.checked
                            ? [...draft.sports, sport]
                            : draft.sports.filter((s) => s !== sport)
                        })
                      }
                    />
                    {sport === 'PADEL' ? 'Padel' : 'Tennis'}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">Cabang layanan</legend>
              {branches.isError ? (
                <p role="alert">Cabang belum dapat dimuat. Tutup dan coba lagi.</p>
              ) : branches.isPending ? (
                <p>Memuat cabang...</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {(branches.data ?? [])
                    .filter((b) => b.isActive || draft.branchIds.includes(b.id))
                    .map((branch) => (
                      <label
                        key={branch.id}
                        className="flex items-center gap-2 rounded-lg border p-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={draft.branchIds.includes(branch.id)}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              branchIds: e.target.checked
                                ? [...draft.branchIds, branch.id]
                                : draft.branchIds.filter((id) => id !== branch.id)
                            })
                          }
                        />
                        {branch.name}
                      </label>
                    ))}
                </div>
              )}
            </fieldset>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              />
              Grup aktif
            </label>
            <p className="text-muted-foreground text-xs">
              Nonaktifkan grup untuk menghentikan pemilihan baru. Riwayat booking tetap disimpan.
            </p>
            <Button
              className="w-full"
              disabled={
                save.isPending ||
                !!logoError ||
                !draft.name.trim() ||
                !draft.sports.length ||
                !draft.branchIds.length ||
                branches.isError ||
                branches.isPending
              }
            >
              {save.isPending ? 'Menyimpan...' : 'Simpan grup'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
