'use client';
import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminBranches } from '@/api/branch';
import { adminApi } from '@/lib/adminApi';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { Branch } from '@/types/branch';
import { toast } from 'sonner';

type StaffBranch = { id: string; name: string; role: string; branchId: string };
type MembershipBranches = { id: string; name: string; branches: { branchId: string }[] };
const inputClass =
  'w-full border border-black/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#ad422b]';
export default function BranchManagementPage() {
  const queryClient = useQueryClient();
  const { data: user } = useQuery(adminProfileQueryOptions);
  const allowed = user?.role === 'SUPER_ADMIN';
  const { data: branches = [] } = useQuery({
    queryKey: ['admin', 'branches'],
    queryFn: getAdminBranches,
    enabled: allowed
  });
  const { data: staff = [] } = useQuery({
    queryKey: ['admin', 'branch-staff'],
    queryFn: async () => (await adminApi.get('/branches/staff')).data.data as StaffBranch[],
    enabled: allowed
  });
  const { data: memberships = [] } = useQuery({
    queryKey: ['admin', 'branch-memberships'],
    queryFn: async () =>
      (await adminApi.get('/branches/memberships')).data.data as MembershipBranches[],
    enabled: allowed
  });
  const [editing, setEditing] = useState<Branch | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!user) return <p>Memuat…</p>;
  if (!allowed) return <p>Pengaturan cabang hanya tersedia untuk super admin.</p>;
  const perform = async (operation: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await operation();
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Perubahan disimpan');
      return true;
    } catch (err) {
      setError((err as { message?: string }).message || 'Perubahan belum dapat disimpan.');
      return false;
    } finally {
      setBusy(false);
    }
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name')),
      address: String(data.get('address')),
      mapsUrl: String(data.get('mapsUrl') || '') || null,
      isActive: data.get('isActive') === 'on'
    };
    const success = await perform(() =>
      editing
        ? adminApi.put(`/branches/${editing.id}`, payload)
        : adminApi.post('/branches', payload)
    );
    if (success) {
      setEditing(null);
      form.reset();
    }
  };
  return (
    <div className="space-y-8 text-[#171717]">
      <header className="border-b border-black/15 pb-4">
        <h1 className="text-2xl font-medium">Kelola cabang</h1>
        <p className="mt-2 text-sm text-black/50">
          Atur lokasi, penugasan staf, dan cabang yang menerima membership.
        </p>
      </header>
      {error && (
        <p role="alert" className="border border-[#ad422b]/30 p-4 text-sm text-[#ad422b]">
          {error}
        </p>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="space-y-3" aria-label="Daftar cabang">
          {branches.map((branch) => (
            <div key={branch.id} className="border border-black/15 p-5">
              <div className="flex justify-between gap-3">
                <h2 className="font-medium">{branch.name}</h2>
                <span className="text-xs text-black/50">
                  {branch.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <p className="mt-2 text-sm text-black/50">{branch.address}</p>
              <button
                type="button"
                onClick={() => setEditing(branch)}
                className="mt-4 text-xs text-[#ad422b] underline"
              >
                Edit cabang
              </button>
            </div>
          ))}
        </section>
        <form
          key={editing?.id || 'new'}
          onSubmit={(event) => void save(event)}
          className="space-y-4 border border-black/15 p-5"
        >
          <h2 className="font-medium">{editing ? 'Edit cabang' : 'Tambah cabang'}</h2>
          <label className="block space-y-2 text-xs">
            <span>Nama cabang</span>
            <input
              name="name"
              required
              minLength={2}
              maxLength={100}
              defaultValue={editing?.name}
              className={inputClass}
            />
          </label>
          <label className="block space-y-2 text-xs">
            <span>Alamat</span>
            <textarea
              name="address"
              required
              minLength={5}
              maxLength={1000}
              defaultValue={editing?.address}
              className={inputClass}
            />
          </label>
          <label className="block space-y-2 text-xs">
            <span>Link Google Maps</span>
            <input
              name="mapsUrl"
              type="url"
              defaultValue={editing?.mapsUrl || ''}
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" defaultChecked={editing?.isActive ?? true} />
            Cabang aktif
          </label>
          <div className="flex gap-3">
            <button
              disabled={busy}
              className="bg-black px-5 py-2 text-sm text-white disabled:opacity-50"
            >
              Simpan
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="border px-5 py-2 text-sm"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>
      <section className="border border-black/15 p-5">
        <h2 className="mb-4 font-medium">Penugasan staf</h2>
        <p className="mb-4 text-xs text-black/50">
          Setiap staf ditugaskan ke satu cabang. Super admin dapat mengakses seluruh cabang.
        </p>
        <div className="divide-y divide-black/10">
          {staff.map((person) => (
            <div key={person.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium">{person.name}</p>
                <p className="mt-1 text-xs text-black/50">{person.role.replaceAll('_', ' ')}</p>
              </div>
              <select
                aria-label={`Cabang ${person.name}`}
                disabled={busy || person.role === 'SUPER_ADMIN'}
                value={person.branchId}
                onChange={(event) =>
                  void perform(() =>
                    adminApi.put(`/branches/staff/${person.id}`, { branchId: event.target.value })
                  )
                }
                className="border border-black/20 bg-white px-3 py-2 text-xs"
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id} disabled={!branch.isActive}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>
      <section className="border border-black/15 p-5">
        <h2 className="font-medium">Cakupan membership</h2>
        <p className="mt-2 mb-5 text-xs text-black/50">
          Saldo jam dibagi bersama di seluruh cabang yang dicentang. Cabang baru tidak otomatis
          menerima paket lama.
        </p>
        <div className="divide-y divide-black/10">
          {memberships.map((membership) => (
            <div key={membership.id} className="py-4">
              <h3 className="text-sm font-medium">{membership.name}</h3>
              <div className="mt-3 flex flex-wrap gap-4">
                {branches.map((branch) => (
                  <label key={branch.id} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      disabled={busy}
                      checked={membership.branches.some((item) => item.branchId === branch.id)}
                      onChange={(event) => {
                        const ids = membership.branches
                          .map((item) => item.branchId)
                          .filter((id) => id !== branch.id);
                        if (event.target.checked) ids.push(branch.id);
                        void perform(() =>
                          adminApi.put(`/branches/membership/${membership.id}`, { branchIds: ids })
                        );
                      }}
                    />
                    {branch.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
