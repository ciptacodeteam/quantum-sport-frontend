'use client';
import { useCallback, useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { IconPencil, IconCalendar, IconPlus, IconPower, IconTrash } from '@tabler/icons-react';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coachingGroupApi } from '@/api/admin/coachingGroup';
import { coachingApi, type CoachingPerson, type CoachingProfile } from '@/api/admin/coaching';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

export const coachingSportLabel = (sport: string | null) =>
  sport === 'PADEL_TENNIS' ? 'Padel & Tennis' : sport === 'TENNIS' ? 'Tennis' : 'Padel';

const col = createColumnHelper<CoachingPerson>();

type CoachingCatalogProps = {
  groupId?: string;
  inHouse?: boolean;
};

export default function CoachingCatalog({ groupId, inHouse = false }: CoachingCatalogProps = {}) {
  const params = useSearchParams();
  const kind = !inHouse && !groupId && params.get('kind') === 'BALLBOY' ? 'BALLBOY' : 'COACH';
  const { hasAccess, isLoading } = useRoleAccess({ allowedRoles: ['ADMIN'] });
  const { branchId, canCreateTennis } = useAdminCourtSports();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['admin', 'coaching', branchId],
    queryFn: coachingApi.list,
    enabled: hasAccess
  });
  const groups = useQuery({
    queryKey: ['admin', 'coaching-groups', branchId],
    queryFn: () => coachingGroupApi.list(branchId),
    enabled: hasAccess && !inHouse && kind === 'COACH' && !!branchId && branchId !== 'all'
  });
  const [statusFilter, setStatusFilter] = useState('active');
  const [editing, setEditing] = useState<CoachingPerson | null>(null);
  const [open, setOpen] = useState(false);
  const [profileAction, setProfileAction] = useState<{
    person: CoachingPerson;
    remove: boolean;
  } | null>(null);
  const lifecycle = useMutation({
    mutationFn: (action: { person: CoachingPerson; remove: boolean }) =>
      action.remove
        ? coachingApi.remove(action.person.id)
        : coachingApi.setActive(action.person.id, !action.person.isActive),
    onSuccess: (_result, action) => {
      setProfileAction(null);
      for (const key of [
        ['admin', 'coaching'],
        ['admin', 'coaching-groups'],
        ['admin', 'inhouse'],
        ['admin', 'schedule'],
        ['coaches'],
        ['coach']
      ]) {
        void client.invalidateQueries({ queryKey: key });
      }
      toast.success(
        action.remove
          ? 'Coach berhasil dihapus.'
          : action.person.isActive
            ? 'Coach dinonaktifkan.'
            : 'Coach diaktifkan kembali.'
      );
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Perubahan coach belum berhasil.'))
  });
  const [draft, setDraft] = useState<CoachingProfile>({
    name: '',
    kind,
    coachType: kind === 'BALLBOY' ? 'PADEL_TENNIS' : 'PADEL',
    isActive: true,
    groupIds: []
  });
  const save = useMutation({
    mutationFn: () =>
      coachingApi.save(editing?.id, { ...draft, ...(inHouse ? { isInHouseCoach: true } : {}) }),
    onSuccess: () => {
      setOpen(false);
      void client.invalidateQueries({ queryKey: ['admin', 'coaching'] });
      void client.invalidateQueries({ queryKey: ['admin', 'coaching-groups'] });
      void client.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      toast.success('Profil layanan disimpan.');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Profil belum dapat disimpan.'))
  });
  const beginEdit = useCallback(
    (person?: CoachingPerson) => {
      setEditing(person ?? null);
      setDraft(
        person
          ? {
              name: person.name,
              kind: person.role,
              isInHouseCoach: person.isInHouseCoach,
              groupIds: (person.coachingGroups ?? []).map((m) => m.group.id),
              coachType:
                person.role === 'BALLBOY' ? 'PADEL_TENNIS' : (person.coachType ?? undefined),
              phone: person.phone ?? undefined,
              coachProfile: person.coachProfile ?? undefined,
              isActive: person.isActive
            }
          : {
              name: '',
              kind,
              coachType: kind === 'BALLBOY' ? 'PADEL_TENNIS' : 'PADEL',
              isActive: true,
              groupIds: groupId && groupId !== 'independent' ? [groupId] : []
            }
      );
      setOpen(true);
    },
    [kind, groupId]
  );
  const people = useMemo(
    () =>
      (query.data ?? []).filter(
        (person) =>
          person.role === kind &&
          (kind !== 'BALLBOY' || person.isActive === (statusFilter === 'active')) &&
          (!inHouse || person.isInHouseCoach === true) &&
          (!groupId ||
            (groupId === 'independent'
              ? !person.coachingGroups?.length
              : person.coachingGroups?.some((membership) => membership.group.id === groupId)))
      ),
    [query.data, kind, groupId, inHouse, statusFilter]
  );
  const columns = useMemo(
    () => [
      col.accessor('name', {
        header: 'Nama',
        cell: ({ row, getValue }) => (
          <div className="min-w-40">
            <p className="font-medium">{getValue()}</p>
            {kind === 'COACH' && (
              <p className="text-muted-foreground mt-1 text-xs">
                {row.original.isInHouseCoach
                  ? 'Coach In-house'
                  : row.original.coachingGroups?.map((m) => m.group.name).join(', ') ||
                    'Coach Independen'}
              </p>
            )}
          </div>
        )
      }),
      col.accessor(
        (person) =>
          coachingSportLabel(
            person.role === 'BALLBOY' ? 'PADEL_TENNIS' : (person.coachType ?? 'PADEL')
          ),
        {
          id: 'sport',
          header: 'Olahraga',
          cell: ({ getValue }) => <Badge variant="outline">{getValue()}</Badge>
        }
      ),
      col.accessor('phone', {
        header: 'Telepon',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm tabular-nums">{getValue() || '—'}</span>
        )
      }),
      col.accessor((person) => (person.isActive ? 'Aktif' : 'Nonaktif'), {
        id: 'status',
        header: 'Status',
        cell: ({ row, getValue }) => (
          <Badge variant={row.original.isActive ? 'lightSuccess' : 'lightNeutral'}>
            {getValue()}
          </Badge>
        )
      }),
      col.display({
        id: 'actions',
        header: 'Aksi',
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={!branchId || branchId === 'all'}
              onClick={() => beginEdit(row.original)}
              aria-label={`Edit profil ${row.original.name}`}
              title="Edit profil"
            >
              <IconPencil />
            </Button>
            <Button size="icon-sm" variant="ghost" asChild>
              <Link
                href={`/admin/coaching/${row.original.id}${groupId ? `?groupId=${encodeURIComponent(groupId)}` : ''}`}
                aria-label={`Jadwal & Harga ${row.original.name}`}
                title="Jadwal & Harga"
              >
                <IconCalendar />
              </Link>
            </Button>
            {row.original.role === 'COACH' && (
              <>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={!branchId || branchId === 'all' || lifecycle.isPending}
                  aria-label={`${row.original.isActive ? 'Nonaktifkan' : 'Aktifkan'} ${row.original.name}`}
                  title={row.original.isActive ? 'Nonaktifkan coach' : 'Aktifkan coach'}
                  onClick={() => setProfileAction({ person: row.original, remove: false })}
                >
                  <IconPower />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive"
                  disabled={
                    !branchId ||
                    branchId === 'all' ||
                    !row.original.canDelete ||
                    lifecycle.isPending
                  }
                  aria-label={`Hapus ${row.original.name}`}
                  title={
                    row.original.canDelete
                      ? 'Hapus coach'
                      : 'Coach yang memiliki riwayat pemesanan atau paket pelanggan tidak dapat dihapus'
                  }
                  onClick={() => setProfileAction({ person: row.original, remove: true })}
                >
                  <IconTrash />
                </Button>
              </>
            )}
          </div>
        )
      })
    ],
    [beginEdit, branchId, kind, groupId, lifecycle.isPending]
  );
  const catalogTable = (
    <DataTable
      key={`${kind}:${groupId ?? 'all'}:${kind === 'BALLBOY' ? statusFilter : 'all'}`}
      data={people}
      columns={columns}
      loading={query.isPending}
      enableRowSelection={false}
      getRowId={(person) => person.id}
      searchPlaceholder={`Cari ${kind === 'COACH' ? 'coach' : 'ballboy'}, olahraga, atau telepon...`}
      columnVisibilityLabel="Kolom"
      columnVisibilityStorageKey={`quantum:coaching-catalog:columns:${kind}`}
      addButton={
        <Button
          className="h-9 rounded-lg"
          onClick={() => beginEdit()}
          disabled={
            !branchId ||
            branchId === 'all' ||
            (!!groupId &&
              groupId !== 'independent' &&
              !groups.data?.some((group) => group.id === groupId && group.isActive))
          }
        >
          <IconPlus />
          Tambah {inHouse ? 'Coach In-house' : kind === 'COACH' ? 'Coach' : 'Ballboy'}
        </Button>
      }
    />
  );
  if (isLoading || !hasAccess) return <p className="p-6">Memuat...</p>;
  return (
    <main className="w-full min-w-0 space-y-6">
      <Dialog
        open={!!profileAction}
        onOpenChange={(value) => {
          if (!value && !lifecycle.isPending) setProfileAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {profileAction?.remove
                ? 'Hapus coach?'
                : profileAction?.person.isActive
                  ? 'Nonaktifkan coach?'
                  : 'Aktifkan coach?'}
            </DialogTitle>
            <DialogDescription>
              {profileAction?.remove
                ? `Hapus ${profileAction.person.name} beserta jadwal kosong, tarif, dan paket yang belum terjual? Hanya coach tanpa riwayat pemesanan atau paket pelanggan yang dapat dihapus.`
                : profileAction?.person.isActive
                  ? `${profileAction.person.name} tidak akan tersedia untuk pemesanan baru. Data dan riwayat pemesanan tetap tersimpan.`
                  : `${profileAction?.person.name} akan tersedia kembali untuk pemesanan sesuai jadwalnya.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={lifecycle.isPending}
              onClick={() => setProfileAction(null)}
            >
              Batal
            </Button>
            <Button
              variant={profileAction?.remove ? 'destructive' : 'default'}
              disabled={lifecycle.isPending}
              onClick={() => profileAction && lifecycle.mutate(profileAction)}
            >
              {lifecycle.isPending
                ? 'Memproses…'
                : profileAction?.remove
                  ? 'Hapus coach'
                  : profileAction?.person.isActive
                    ? 'Nonaktifkan coach'
                    : 'Aktifkan coach'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {inHouse
              ? 'Coach In-house'
              : groupId
                ? 'Member Coach'
                : kind === 'COACH'
                  ? 'Coaching'
                  : 'Ballboy'}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Kelola profil, olahraga, jadwal, dan harga layanan per jam.
          </p>
        </div>
      </div>
      {(!branchId || branchId === 'all') && (
        <p className="text-muted-foreground text-sm">
          Pilih satu cabang di header untuk menambahkan profil.
        </p>
      )}
      {query.isError ? (
        <div role="alert">
          <p>Profil belum dapat dimuat.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <div className="[&_thead]:bg-muted/50 min-w-0 [&_td]:align-middle [&_th]:text-xs">
          {kind === 'BALLBOY' ? (
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="gap-4">
              <TabsList aria-label="Status ballboy">
                <TabsTrigger value="active">Aktif</TabsTrigger>
                <TabsTrigger value="inactive">Nonaktif</TabsTrigger>
              </TabsList>
              <TabsContent value={statusFilter}>{catalogTable}</TabsContent>
            </Tabs>
          ) : (
            catalogTable
          )}
        </div>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!save.isPending) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit' : 'Tambah'}{' '}
              {inHouse ? 'Coach In-house' : draft.kind === 'COACH' ? 'Coach' : 'Ballboy'}
            </DialogTitle>
            <DialogDescription>Kelola nama, kontak, dan status profil layanan.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="coaching-name">Nama</Label>
              <Input
                id="coaching-name"
                required
                maxLength={100}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            {draft.kind === 'COACH' ? (
              <div className="space-y-2">
                <Label htmlFor="coaching-sport">Olahraga</Label>
                <Select
                  value={draft.coachType}
                  onValueChange={(value) =>
                    setDraft({ ...draft, coachType: value as CoachingProfile['coachType'] })
                  }
                >
                  <SelectTrigger id="coaching-sport">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PADEL">Padel</SelectItem>
                    {canCreateTennis && (
                      <>
                        <SelectItem value="TENNIS">Tennis</SelectItem>
                        <SelectItem value="PADEL_TENNIS">Padel & Tennis</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Ballboy tersedia untuk Padel & Tennis sesuai cabang dan jadwalnya.
              </p>
            )}
            {draft.kind === 'COACH' && !inHouse && (
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium">Grup coaching</legend>
                <p className="text-muted-foreground text-xs">
                  Pilih satu atau beberapa grup. Kosongkan untuk Coach Independen.
                </p>
                {groups.isError ? (
                  <div role="alert">
                    <p>Grup belum dapat dimuat.</p>
                    <Button type="button" variant="outline" onClick={() => void groups.refetch()}>
                      Coba lagi
                    </Button>
                  </div>
                ) : groups.isPending ? (
                  <p className="text-sm">Memuat grup...</p>
                ) : (
                  (groups.data ?? []).map((group) => (
                    <label
                      key={group.id}
                      className="flex items-center gap-2 rounded-lg border p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={draft.groupIds?.includes(group.id) ?? false}
                        disabled={!group.isActive && !draft.groupIds?.includes(group.id)}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            groupIds: e.target.checked
                              ? [...(draft.groupIds ?? []), group.id]
                              : (draft.groupIds ?? []).filter((id) => id !== group.id)
                          })
                        }
                      />
                      {group.name}
                      {!group.isActive && ' (Nonaktif)'}
                    </label>
                  ))
                )}
                <Link className="text-primary text-xs underline" href="/admin/coaching-groups">
                  Kelola grup coaching
                </Link>
              </fieldset>
            )}
            <div className="space-y-2">
              <Label htmlFor="coaching-phone">Telepon (opsional)</Label>
              <Input
                id="coaching-phone"
                inputMode="tel"
                value={draft.phone ?? ''}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coaching-profile">Catatan profil (opsional)</Label>
              <Input
                id="coaching-profile"
                value={draft.coachProfile ?? ''}
                onChange={(e) => setDraft({ ...draft, coachProfile: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              />
              Profil aktif untuk pemesanan
            </label>
            <Button
              className="w-full"
              disabled={
                save.isPending ||
                (!inHouse && draft.kind === 'COACH' && (groups.isPending || groups.isError))
              }
            >
              {save.isPending ? 'Menyimpan...' : 'Simpan profil'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
