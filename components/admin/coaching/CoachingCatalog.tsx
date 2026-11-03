'use client';
import { useCallback, useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { IconPencil, IconCalendar, IconPlus } from '@tabler/icons-react';
import { DataTable } from '@/components/ui/data-table';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  DialogDescription
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

export default function CoachingCatalog() {
  const params = useSearchParams();
  const kind = params.get('kind') === 'BALLBOY' ? 'BALLBOY' : 'COACH';
  const { hasAccess, isLoading } = useRoleAccess({ allowedRoles: ['ADMIN'] });
  const { branchId, canCreateTennis } = useAdminCourtSports();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['admin', 'coaching', branchId],
    queryFn: coachingApi.list,
    enabled: hasAccess
  });
  const [editing, setEditing] = useState<CoachingPerson | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CoachingProfile>({
    name: '',
    kind,
    coachType: 'PADEL',
    isActive: true
  });
  const save = useMutation({
    mutationFn: () => coachingApi.save(editing?.id, draft),
    onSuccess: () => {
      setOpen(false);
      void client.invalidateQueries({ queryKey: ['admin', 'coaching'] });
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
              coachType: person.coachType ?? undefined,
              phone: person.phone ?? undefined,
              coachProfile: person.coachProfile ?? undefined,
              isActive: person.isActive
            }
          : { name: '', kind, coachType: 'PADEL', isActive: true }
      );
      setOpen(true);
    },
    [kind]
  );
  const people = useMemo(
    () => (query.data ?? []).filter((person) => person.role === kind),
    [query.data, kind]
  );
  const columns = useMemo(
    () => [
      col.accessor('name', {
        header: 'Nama',
        cell: ({ getValue }) => <span className="block min-w-40 font-medium">{getValue()}</span>
      }),
      col.accessor(
        (person) => (person.role === 'BALLBOY' ? 'Tennis' : coachingSportLabel(person.coachType)),
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
                href={`/admin/coaching/${row.original.id}`}
                aria-label={`Jadwal & Harga ${row.original.name}`}
                title="Jadwal & Harga"
              >
                <IconCalendar />
              </Link>
            </Button>
          </div>
        )
      })
    ],
    [beginEdit, branchId]
  );
  if (isLoading || !hasAccess) return <p className="p-6">Memuat...</p>;
  return (
    <main className="w-full min-w-0 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{kind === 'COACH' ? 'Coaching' : 'Ballboy'}</h1>
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
      {kind === 'BALLBOY' && !canCreateTennis && (
        <p className="text-muted-foreground text-sm">
          Ballboy tersedia untuk cabang dengan lapangan tennis.
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
          <DataTable
            key={kind}
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
                  !branchId || branchId === 'all' || (kind === 'BALLBOY' && !canCreateTennis)
                }
              >
                <IconPlus />
                Tambah {kind === 'COACH' ? 'Coach' : 'Ballboy'}
              </Button>
            }
          />
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
              {editing ? 'Edit' : 'Tambah'} {draft.kind === 'COACH' ? 'Coach' : 'Ballboy'}
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
            {draft.kind === 'COACH' && (
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
            )}
            {draft.kind === 'BALLBOY' && <p className="text-sm">Olahraga: Tennis</p>}
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
            <Button className="w-full" disabled={save.isPending}>
              {save.isPending ? 'Menyimpan...' : 'Simpan profil'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
