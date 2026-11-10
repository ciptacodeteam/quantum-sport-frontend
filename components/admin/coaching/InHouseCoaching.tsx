'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inHouseApi, type InHousePlan } from '@/api/admin/inhouseCoaching';
import { coachingApi } from '@/api/admin/coaching';
import { adminCustomerSearchQueryOptions } from '@/queries/admin/customer';
import { adminPaymentMethodsQueryOptions } from '@/queries/admin/paymentMethod';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { getApiErrorMessage } from '@/lib/api-error';
import { isOfflinePaymentMethod } from '@/lib/offline-payment';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppSectionHeader from '@/components/ui/app-section-header';
import { toast } from 'sonner';
const selectClass = 'border-input bg-background h-10 w-full rounded-md border px-3 text-sm';
const emptyPlan = (): Omit<InHousePlan, 'id' | 'staff'> => ({
  staffId: '',
  name: '',
  hours: 5,
  hourlyPrice: 0,
  courtHourlyShare: 0,
  extraParticipantHourlyPrice: 100000,
  isActive: true
});
export default function InHouseCoaching() {
  const { branchId } = useAdminCourtSports();
  const { hasAccess, userRole } = useRoleAccess({
    allowedRoles: ['ADMIN', 'CASHIER', 'ADMIN_VIEWER']
  });
  const canEdit = ['ADMIN', 'SUPER_ADMIN'].includes(userRole ?? '');
  const canSell = canEdit || userRole === 'CASHIER';
  const ready = hasAccess && !!branchId && branchId !== 'all';
  const client = useQueryClient();
  const [tab, setTab] = useState('quota');
  const [draft, setDraft] = useState(emptyPlan);
  const [editing, setEditing] = useState<string>();
  const [q, setQ] = useState('');
  const [userId, setUserId] = useState('');
  const [customerLabel, setCustomerLabel] = useState('');
  const [packageId, setPackageId] = useState('');
  const [methodId, setMethodId] = useState('');
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const plans = useQuery({
    queryKey: ['admin', 'inhouse', 'plans', branchId],
    queryFn: inHouseApi.plans,
    enabled: ready
  });
  const people = useQuery({
    queryKey: ['admin', 'coaching', branchId],
    queryFn: coachingApi.list,
    enabled: ready && canEdit
  });
  const wallets = useQuery({
    queryKey: ['admin', 'inhouse', 'wallets', branchId, userId],
    queryFn: () => inHouseApi.wallets(userId || undefined),
    enabled: ready
  });
  const usage = useQuery({
    queryKey: ['admin', 'inhouse', 'usage', branchId, userId],
    queryFn: () => inHouseApi.usage(userId || undefined),
    enabled: ready && tab === 'usage'
  });
  const customers = useQuery({
    ...adminCustomerSearchQueryOptions({ q }),
    enabled: ready && q.trim().length >= 2
  });
  const methods = useQuery({ ...adminPaymentMethodsQueryOptions, enabled: ready && canSell });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['admin', 'inhouse'] });
  };
  const save = useMutation({
    mutationFn: () => inHouseApi.savePlan(editing, draft),
    onSuccess: () => {
      refresh();
      setEditing(undefined);
      setDraft(emptyPlan());
      toast.success('Paket in-house disimpan.');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Paket belum tersimpan.'))
  });
  const sell = useMutation({
    mutationFn: () => inHouseApi.sell({ packageId, userId, paymentMethodId: methodId, requestId }),
    onSuccess: () => {
      refresh();
      setRequestId(crypto.randomUUID());
      setPackageId('');
      toast.success('Pembayaran dicatat dan kuota coaching ditambahkan.');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Pembelian belum berhasil.'))
  });
  const selectedPlan = plans.data?.find((p) => p.id === packageId);
  if (!hasAccess) return null;
  return (
    <div className="space-y-6">
      <AppSectionHeader
        title="Coaching In-house"
        description="Paket per coach, kuota customer, dan pembagian pemakaian coaching."
      />
      {!ready ? (
        <p>Pilih satu cabang terlebih dahulu.</p>
      ) : (
        <>
          <nav aria-label="Menu coaching in-house" className="flex flex-wrap gap-2">
            {[
              ['quota', 'Kuota Customer'],
              ['plans', 'Paket & Tarif'],
              ['usage', 'Riwayat & Pembagian']
            ].map(([value, label]) => (
              <Button
                key={value}
                variant={tab === value ? 'default' : 'outline'}
                onClick={() => setTab(value)}
              >
                {label}
              </Button>
            ))}
          </nav>
          {(plans.isError || wallets.isError || (tab === 'usage' && usage.isError)) && (
            <div role="alert" className="rounded border p-4">
              Data coaching belum dapat dimuat.{' '}
              <Button
                variant="outline"
                onClick={() => {
                  void plans.refetch();
                  void wallets.refetch();
                  void usage.refetch();
                }}
              >
                Coba lagi
              </Button>
            </div>
          )}
          {tab === 'plans' ? (
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card>
                <CardHeader>
                  <CardTitle>Tarif per coach</CardTitle>
                  {canEdit && (
                    <Link
                      href="/admin/coaching-groups/independent"
                      className="text-primary text-sm underline"
                    >
                      Kelola profil & jadwal coach
                    </Link>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {plans.isPending ? (
                    <p>Memuat paket…</p>
                  ) : !plans.data?.length ? (
                    <p>Belum ada paket. Pilih coach dan buat tarif satuan atau paket.</p>
                  ) : (
                    plans.data.map((plan) => (
                      <div key={plan.id} className="rounded-lg border p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">
                              {plan.staff.name} · {plan.name}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {plan.hours} jam · {plan.isActive ? 'Aktif' : 'Nonaktif'}
                            </p>
                          </div>
                          {canEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditing(plan.id);
                                setDraft({
                                  staffId: plan.staffId,
                                  name: plan.name,
                                  hours: plan.hours,
                                  hourlyPrice: plan.hourlyPrice,
                                  courtHourlyShare: plan.courtHourlyShare,
                                  extraParticipantHourlyPrice: plan.extraParticipantHourlyPrice,
                                  isActive: plan.isActive
                                });
                              }}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                          <div>
                            <dt className="text-muted-foreground">Harga / jam</dt>
                            <dd>{formatCurrency(plan.hourlyPrice)}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Lapangan / jam</dt>
                            <dd>{formatCurrency(plan.courtHourlyShare)}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Coach / jam</dt>
                            <dd>{formatCurrency(plan.hourlyPrice - plan.courtHourlyShare)}</dd>
                          </div>
                        </dl>
                        <p className="text-muted-foreground mt-3 text-xs">
                          Total {formatCurrency(plan.hourlyPrice * plan.hours)} · Tambahan peserta
                          Rp100.000/orang/jam untuk coach.
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              {canEdit && (
                <Card>
                  <CardHeader>
                    <CardTitle>{editing ? 'Edit paket' : 'Tambah paket'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      className="space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        save.mutate();
                      }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="plan-coach">Coach in-house</Label>
                        <select
                          id="plan-coach"
                          required
                          disabled={!!editing}
                          className={selectClass}
                          value={draft.staffId}
                          onChange={(e) => setDraft({ ...draft, staffId: e.target.value })}
                        >
                          <option value="">Pilih coach</option>
                          {people.data
                            ?.filter((p) => p.role === 'COACH' && p.isActive)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plan-name">Nama paket</Label>
                        <Input
                          id="plan-name"
                          required
                          maxLength={100}
                          value={draft.name}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                          placeholder="Paket 5 jam"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plan-hours">Kuota jam</Label>
                        <select
                          id="plan-hours"
                          className={selectClass}
                          value={draft.hours}
                          onChange={(e) =>
                            setDraft({ ...draft, hours: Number(e.target.value) as 1 | 5 | 10 })
                          }
                        >
                          {[1, 5, 10].map((h) => (
                            <option key={h} value={h}>
                              {h} jam
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plan-price">Harga per jam (Rp)</Label>
                        <Input
                          id="plan-price"
                          required
                          type="number"
                          min={1}
                          max={100000000}
                          value={draft.hourlyPrice || ''}
                          onChange={(e) =>
                            setDraft({ ...draft, hourlyPrice: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plan-court">Bagian lapangan per jam (Rp)</Label>
                        <Input
                          id="plan-court"
                          required
                          type="number"
                          min={0}
                          max={draft.hourlyPrice}
                          value={draft.courtHourlyShare}
                          onChange={(e) =>
                            setDraft({ ...draft, courtHourlyShare: Number(e.target.value) })
                          }
                        />
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Kuota terikat pada coach. Perubahan tarif berlaku untuk pembelian
                        berikutnya.
                      </p>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={draft.isActive}
                          onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                        />{' '}
                        Paket aktif
                      </label>
                      <Button type="submit" disabled={save.isPending || !draft.staffId}>
                        Simpan paket
                      </Button>
                      {editing && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setEditing(undefined);
                            setDraft(emptyPlan());
                          }}
                        >
                          Batal
                        </Button>
                      )}
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label htmlFor="inhouse-search">Cari nama atau nomor WhatsApp</Label>
                  <Input
                    id="inhouse-search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Ketik minimal 2 karakter"
                  />
                  {customers.isError && <p role="alert">Pencarian customer belum berhasil.</p>}
                  {q.length >= 2 && (
                    <div className="flex flex-wrap gap-2">
                      {customers.data?.map((c) => (
                        <Button
                          key={c.id}
                          variant={c.id === userId ? 'default' : 'outline'}
                          onClick={() => {
                            setUserId(c.id);
                            setCustomerLabel(`${c.name} · ${c.phone}`);
                            setRequestId(crypto.randomUUID());
                          }}
                        >
                          {c.name} · {c.phone}
                        </Button>
                      ))}
                    </div>
                  )}
                  {userId && (
                    <p className="text-sm font-medium">Customer terpilih: {customerLabel}</p>
                  )}
                  {userId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setUserId('');
                        setRequestId(crypto.randomUUID());
                      }}
                    >
                      Tampilkan semua customer
                    </Button>
                  )}
                </CardContent>
              </Card>
              {tab === 'quota' && canSell && (
                <Card>
                  <CardHeader>
                    <CardTitle>Jual paket coaching</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      className="grid items-end gap-4 md:grid-cols-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        sell.mutate();
                      }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="sale-package">Paket coach</Label>
                        <select
                          id="sale-package"
                          required
                          className={selectClass}
                          value={packageId}
                          onChange={(e) => {
                            setPackageId(e.target.value);
                            setRequestId(crypto.randomUUID());
                          }}
                        >
                          <option value="">Pilih paket</option>
                          {plans.data
                            ?.filter((p) => p.isActive && p.staff.isActive)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.staff.name} · {p.name} ·{' '}
                                {formatCurrency(p.hours * p.hourlyPrice)}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sale-method">Pembayaran diterima melalui</Label>
                        <select
                          id="sale-method"
                          required
                          className={selectClass}
                          value={methodId}
                          onChange={(e) => {
                            setMethodId(e.target.value);
                            setRequestId(crypto.randomUUID());
                          }}
                        >
                          <option value="">Pilih metode offline</option>
                          {methods.data?.filter(isOfflinePaymentMethod).map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        type="submit"
                        disabled={!userId || !packageId || !methodId || sell.isPending}
                      >
                        Terima pembayaran & tambah kuota
                      </Button>
                      <p className="text-muted-foreground text-sm md:col-span-3">
                        {!userId
                          ? 'Pilih customer dari hasil pencarian terlebih dahulu.'
                          : selectedPlan
                            ? `Total pembayaran ${formatCurrency(selectedPlan.hours * selectedPlan.hourlyPrice)} untuk ${selectedPlan.hours} jam bersama ${selectedPlan.staff.name}.`
                            : 'Kuota dapat digunakan di hari berbeda, khusus coach yang dibeli.'}
                      </p>
                    </form>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {tab === 'quota' ? 'Saldo kuota coaching' : 'Riwayat pemakaian & pembagian'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-muted-foreground border-b">
                        <tr>
                          {(tab === 'quota'
                            ? ['Customer', 'Coach / paket', 'Sisa / total jam', 'Invoice pembelian']
                            : [
                                'Customer / coach',
                                'Jadwal bermain',
                                'Peserta',
                                'Bagian lapangan',
                                'Bagian coach',
                                'Tambahan coach',
                                'Status'
                              ]
                          ).map((label) => (
                            <th key={label} className="p-3 font-medium">
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tab === 'quota'
                          ? wallets.data?.map((wallet) => (
                              <tr key={wallet.id} className="border-b">
                                <td className="p-3">{wallet.user.name}</td>
                                <td className="p-3">
                                  {wallet.staff.name}
                                  <p className="text-muted-foreground text-xs">
                                    {wallet.packageName}
                                  </p>
                                </td>
                                <td className="p-3 font-semibold">
                                  {wallet.remainingMinutes / 60} / {wallet.totalMinutes / 60} jam
                                </td>
                                <td className="p-3">
                                  {wallet.invoice && (
                                    <Link
                                      className="text-primary underline"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      href={`/admin/kelola-transaksi/${wallet.invoice.id}`}
                                    >
                                      {wallet.invoice.number}
                                    </Link>
                                  )}
                                </td>
                              </tr>
                            ))
                          : usage.data?.map((row) => (
                              <tr
                                key={row.id}
                                className={`border-b ${row.restoredAt ? 'text-muted-foreground' : ''}`}
                              >
                                <td className="p-3">
                                  {row.wallet.user.name}
                                  <p className="text-muted-foreground text-xs">
                                    {row.wallet.staff.name} · {row.wallet.packageName}
                                  </p>
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  {row.startAt}
                                  <p className="text-muted-foreground text-xs">
                                    s.d. {row.endAt} WIB
                                  </p>
                                </td>
                                <td className="p-3">{row.participants}</td>
                                <td className="p-3">{formatCurrency(row.courtAmount)}</td>
                                <td className="p-3">{formatCurrency(row.coachAmount)}</td>
                                <td className="p-3">{formatCurrency(row.extraAmount)}</td>
                                <td className="p-3">
                                  {row.restoredAt ? 'Dibatalkan · kuota kembali' : 'Kuota terpakai'}
                                </td>
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  </div>
                  {(tab === 'quota' ? wallets.isPending : usage.isPending) ? (
                    <p className="py-6 text-sm">Memuat…</p>
                  ) : (
                    !(tab === 'quota' ? wallets.data?.length : usage.data?.length) && (
                      <p className="text-muted-foreground py-6 text-sm">Belum ada data.</p>
                    )
                  )}
                  {tab === 'usage' && (
                    <p className="text-muted-foreground mt-4 text-xs">
                      Pembagian dicatat saat kuota dipakai. Pembelian paket sudah dibayar
                      sebelumnya. Baris yang dibatalkan tidak termasuk pembagian aktif.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
