'use client';
import { useState } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [search, setSearch] = useState('');
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
  const beginEdit = (person?: CoachingPerson) => {
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
  };
  if (isLoading || !hasAccess) return <p className="p-6">Memuat...</p>;
  const people = (query.data ?? []).filter(
    (p) =>
      p.role === kind && `${p.name} ${p.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{kind === 'COACH' ? 'Coaching' : 'Ballboy'}</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Kelola profil, olahraga, jadwal, dan harga layanan per jam.
          </p>
        </div>
        <Button
          onClick={() => beginEdit()}
          disabled={!branchId || branchId === 'all' || (kind === 'BALLBOY' && !canCreateTennis)}
        >
          Tambah {kind === 'COACH' ? 'Coach' : 'Ballboy'}
        </Button>
      </div>
      <nav className="flex gap-2" aria-label="Jenis layanan">
        <Button variant={kind === 'COACH' ? 'default' : 'outline'} asChild>
          <Link href="/admin/coaching?kind=COACH">Coach</Link>
        </Button>
        <Button variant={kind === 'BALLBOY' ? 'default' : 'outline'} asChild>
          <Link href="/admin/coaching?kind=BALLBOY">Ballboy</Link>
        </Button>
      </nav>
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
      <Input
        aria-label="Cari coach atau ballboy"
        placeholder="Cari nama atau telepon..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      {query.isError ? (
        <div role="alert">
          <p>Profil belum dapat dimuat.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : query.isPending ? (
        <p>Memuat profil...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                {['Nama', 'Olahraga', 'Telepon', 'Status', 'Aksi'].map((t) => (
                  <th key={t} className="px-4 py-3">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {people.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-4 font-medium">{p.name}</td>
                  <td className="px-4 py-4">
                    {p.role === 'BALLBOY' ? 'Tennis' : coachingSportLabel(p.coachType)}
                  </td>
                  <td className="px-4 py-4">{p.phone || '-'}</td>
                  <td className="px-4 py-4">
                    <Badge variant={p.isActive ? 'lightSuccess' : 'secondary'}>
                      {p.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!branchId || branchId === 'all'}
                        onClick={() => beginEdit(p)}
                      >
                        Edit profil
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/admin/coaching/${p.id}`}>Jadwal & Harga</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!people.length && (
                <tr>
                  <td colSpan={5} className="text-muted-foreground p-8 text-center">
                    Belum ada profil yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
