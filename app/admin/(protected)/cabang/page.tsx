'use client';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import {
  IconBuildingStore,
  IconMapPin,
  IconExternalLink,
  IconPencil,
  IconPlus
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { getAdminBranches } from '@/api/branch';
import BranchFormDialog, { type BranchFormPayload } from '@/components/branches/BranchFormDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { adminApi } from '@/lib/adminApi';
import { getApiErrorMessage } from '@/lib/api-error';
import { ROLE_MAP } from '@/lib/constants';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { Branch } from '@/types/branch';

type StaffBranch = { id: string; name: string; role: string; branchId: string };
type MembershipBranches = { id: string; name: string; branches: { branchId: string }[] };
const helper = createColumnHelper<StaffBranch>();
function mapsLink(value?: string | null) {
  return value && /^https?:\/\//i.test(value) && URL.canParse(value) ? value : undefined;
}

export default function BranchManagementPage() {
  const queryClient = useQueryClient();
  const profile = useQuery(adminProfileQueryOptions);
  const allowed = profile.data?.role === 'SUPER_ADMIN';
  const branchQuery = useQuery({
    queryKey: ['admin', 'branches'],
    queryFn: getAdminBranches,
    enabled: allowed
  });
  const staffQuery = useQuery({
    queryKey: ['admin', 'branch-staff'],
    queryFn: async () => (await adminApi.get('/branches/staff')).data.data as StaffBranch[],
    enabled: allowed
  });
  const membershipQuery = useQuery({
    queryKey: ['admin', 'branch-memberships'],
    queryFn: async () =>
      (await adminApi.get('/branches/memberships')).data.data as MembershipBranches[],
    enabled: allowed
  });
  const branches = branchQuery.data ?? [];
  const [editing, setEditing] = useState<Branch | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const perform = async (operation: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await operation();
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Perubahan berhasil disimpan.');
      return true;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Perubahan belum dapat disimpan.');
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  async function save(payload: BranchFormPayload) {
    const success = await perform(() =>
      editing
        ? adminApi.put(`/branches/${editing.id}`, payload)
        : adminApi.post('/branches', payload)
    );
    if (success) {
      setDialogOpen(false);
      setEditing(null);
    }
  }
  function edit(branch: Branch | null) {
    setError('');
    setEditing(branch);
    setDialogOpen(true);
  }
  const staff = useMemo(
    () => (staffQuery.data ?? []).filter((person) => !['COACH', 'BALLBOY'].includes(person.role)),
    [staffQuery.data]
  );
  const columns = [
    helper.accessor('name', {
      header: 'Karyawan',
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>
    }),
    helper.accessor('role', {
      header: 'Peran',
      cell: ({ getValue }) => (
        <Badge variant="lightNeutral">
          {ROLE_MAP[getValue() as keyof typeof ROLE_MAP] || getValue()}
        </Badge>
      )
    }),
    helper.accessor('branchId', {
      header: 'Cabang penugasan',
      cell: ({ row }) =>
        row.original.role === 'SUPER_ADMIN' ? (
          <span className="text-muted-foreground">Semua cabang</span>
        ) : (
          <Select
            value={row.original.branchId}
            disabled={busy || branchQuery.isPending || branchQuery.isError}
            onValueChange={(branchId) =>
              void perform(() => adminApi.put(`/branches/staff/${row.original.id}`, { branchId }))
            }
          >
            <SelectTrigger
              className="w-full min-w-52 rounded-lg shadow-none sm:w-64"
              aria-label={`Cabang ${row.original.name}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id} disabled={!branch.isActive}>
                  {branch.name}
                  {!branch.isActive ? ' (nonaktif)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
    })
  ];
  function retry(message: string, refetch: () => unknown) {
    return (
      <div role="alert" className="space-y-3 rounded-lg border p-6 text-center">
        <p className="text-muted-foreground text-sm">{message}</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }
  if (profile.isPending)
    return (
      <p role="status" className="text-muted-foreground p-4 text-sm">
        Memuat pengaturan cabang...
      </p>
    );
  if (!allowed)
    return (
      <p className="text-muted-foreground p-4 text-sm">
        Pengaturan cabang hanya tersedia untuk super admin.
      </p>
    );

  return (
    <main className="w-full min-w-0">
      <Section>
        <SectionHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <SectionTitle title="Kelola Cabang" />
              <SectionDescription description="Kelola lokasi, penugasan karyawan, dan cakupan Value Pack." />
            </div>
            <Button className="rounded-lg" onClick={() => edit(null)}>
              <IconPlus />
              Tambah cabang
            </Button>
          </div>
        </SectionHeader>
        <SectionContent className="space-y-7">
          {error && !dialogOpen && (
            <p
              role="alert"
              className="bg-destructive/5 text-destructive border-destructive/20 rounded-lg border p-3 text-sm"
            >
              {error}
            </p>
          )}
          <section aria-label="Daftar cabang" className="space-y-3">
            {branchQuery.isPending ? (
              <p role="status" className="text-muted-foreground py-6 text-sm">
                Memuat cabang...
              </p>
            ) : branchQuery.isError ? (
              retry('Daftar cabang belum dapat dimuat.', branchQuery.refetch)
            ) : (
              <>
                <p className="text-muted-foreground text-sm">
                  {branches.length} cabang · {branches.filter((branch) => branch.isActive).length}{' '}
                  aktif
                </p>
                <div className="grid gap-4 lg:grid-cols-2">
                  {branches.map((branch) => (
                    <article key={branch.id} className="flex min-w-0 flex-col rounded-xl border">
                      <div className="flex flex-1 items-start gap-3 p-5">
                        <div className="bg-muted/50 text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
                          <IconBuildingStore className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h2 className="text-base font-semibold break-words">{branch.name}</h2>
                            <Badge variant={branch.isActive ? 'lightSuccess' : 'lightNeutral'}>
                              {branch.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground flex items-start gap-2 text-sm leading-relaxed">
                            <IconMapPin className="mt-0.5 size-4 shrink-0" />
                            <span className="break-words">{branch.address}</span>
                          </p>
                        </div>
                      </div>
                      <footer className="bg-muted/10 flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3">
                        {mapsLink(branch.mapsUrl) && (
                          <Button asChild size="sm" variant="ghost">
                            <a
                              href={mapsLink(branch.mapsUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <IconExternalLink />
                              Google Maps
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg shadow-none"
                          onClick={() => edit(branch)}
                        >
                          <IconPencil />
                          Edit cabang
                        </Button>
                      </footer>
                    </article>
                  ))}
                </div>
                {!branches.length && (
                  <div className="rounded-xl border border-dashed p-8 text-center">
                    <p className="font-medium">Belum ada cabang</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Tambahkan lokasi pertama untuk mulai mengatur operasional.
                    </p>
                  </div>
                )}
              </>
            )}
          </section>
          <section aria-label="Penugasan karyawan" className="min-w-0 rounded-xl border">
            <header className="space-y-1 border-b px-5 py-4">
              <h2 className="text-base font-semibold">Penugasan karyawan</h2>
              <p className="text-muted-foreground text-sm">
                Karyawan ditugaskan ke satu cabang. Super admin dapat mengakses seluruh cabang.
              </p>
            </header>
            <div className="[&_thead]:bg-muted/50 min-w-0 p-5">
              {staffQuery.isError ? (
                retry('Data karyawan belum dapat dimuat.', staffQuery.refetch)
              ) : (
                <DataTable
                  data={staff}
                  columns={columns}
                  loading={staffQuery.isPending}
                  enableRowSelection={false}
                  getRowId={(person) => person.id}
                  searchPlaceholder="Cari nama atau peran karyawan..."
                  columnVisibilityLabel="Kolom"
                  columnVisibilityStorageKey="quantum:branch-staff:columns"
                />
              )}
            </div>
          </section>
          <section aria-label="Cakupan Value Pack" className="min-w-0 rounded-xl border">
            <header className="space-y-1 border-b px-5 py-4">
              <h2 className="text-base font-semibold">Cakupan Value Pack</h2>
              <p className="text-muted-foreground text-sm">
                Saldo jam dipakai bersama di cabang yang dipilih. Cabang baru perlu ditambahkan ke
                setiap paket.
              </p>
            </header>
            <div className="p-5">
              {membershipQuery.isPending ? (
                <p role="status" className="text-muted-foreground text-sm">
                  Memuat Value Pack...
                </p>
              ) : membershipQuery.isError ? (
                retry('Cakupan Value Pack belum dapat dimuat.', membershipQuery.refetch)
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {(membershipQuery.data ?? []).map((membership) => (
                    <div key={membership.id} className="min-w-0 space-y-4 rounded-lg border p-4">
                      <h3 className="text-sm font-semibold break-words">{membership.name}</h3>
                      <div className="flex flex-wrap gap-x-5 gap-y-3">
                        {branches.map((branch) => (
                          <label
                            key={branch.id}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <Checkbox
                              aria-label={`${membership.name} di ${branch.name}`}
                              disabled={busy || branchQuery.isError || branchQuery.isPending}
                              checked={membership.branches.some(
                                (item) => item.branchId === branch.id
                              )}
                              onCheckedChange={(checked) => {
                                const ids = membership.branches
                                  .map((item) => item.branchId)
                                  .filter((id) => id !== branch.id);
                                if (checked === true) ids.push(branch.id);
                                void perform(() =>
                                  adminApi.put(`/branches/membership/${membership.id}`, {
                                    branchIds: ids
                                  })
                                );
                              }}
                            />
                            <span>
                              {branch.name}
                              {!branch.isActive ? ' (nonaktif)' : ''}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!membershipQuery.isPending &&
                !membershipQuery.isError &&
                !membershipQuery.data?.length && (
                  <p className="text-muted-foreground text-sm">
                    Belum ada Value Pack untuk diatur.
                  </p>
                )}
            </div>
          </section>
        </SectionContent>
      </Section>
      <BranchFormDialog
        open={dialogOpen}
        branch={editing}
        busy={busy}
        error={error}
        onClose={() => {
          setDialogOpen(false);
          setError('');
        }}
        onSave={save}
      />
    </main>
  );
}
