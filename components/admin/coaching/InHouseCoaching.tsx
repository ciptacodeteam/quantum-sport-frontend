'use client';
import { useState } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inHouseApi, type InHousePlan, type InHouseWallet } from '@/api/admin/inhouseCoaching';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
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
  const [deleting, setDeleting] = useState<InHouseWallet | null>(null);
  const [tab, setTab] = useState('quota');
  const [draft, setDraft] = useState(emptyPlan);
  const [editingCourtAmount, setEditingCourtAmount] = useState(false);
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
  const remove = useMutation({
    mutationFn: (id: string) => inHouseApi.deleteWallet(id),
    onSuccess: () => {
      refresh();
      setDeleting(null);
      toast.success('Paket coaching dihapus.');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Paket belum berhasil dihapus.'))
  });
  const selectedPlan = plans.data?.find((p) => p.id === packageId);
  if (!hasAccess) return null;
  return (
    <div className="space-y-6">
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus paket coaching?</DialogTitle>
            <DialogDescription>
              Hapus {deleting?.packageName} milik {deleting?.user.name} ({deleting?.staff.name})
              dengan kuota {deleting ? deleting.remainingMinutes / 60 : 0} jam? Paket akan dihapus
              dari saldo kuota dan tidak bisa dipakai untuk booking. Invoice dan pembayaran tetap
              tersimpan. Tindakan ini tidak mengembalikan pembayaran.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={remove.isPending} onClick={() => setDeleting(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => deleting && remove.mutate(deleting.id)}
            >
              {remove.isPending ? 'Menghapus…' : 'Hapus paket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_520px] 2xl:grid-cols-[minmax(0,1fr)_560px]">
              <Card className="min-w-0 gap-6 py-6 sm:py-8">
                <CardHeader className="gap-3 px-6 sm:px-8">
                  <CardTitle>Tarif per coach</CardTitle>
                  {canEdit && (
                    <Link
                      href="/admin/coach-inhouse"
                      className="text-primary w-fit text-sm leading-relaxed underline underline-offset-4"
                    >
                      Kelola profil & jadwal coach
                    </Link>
                  )}
                </CardHeader>
                <CardContent className="space-y-5 px-6 sm:px-8">
                  {plans.isPending ? (
                    <p>Memuat paket…</p>
                  ) : !plans.data?.length ? (
                    <p className="text-muted-foreground bg-muted/20 rounded-lg border border-dashed p-5 text-sm leading-relaxed">
                      Belum ada paket. Pilih coach dan buat tarif satuan atau paket.
                    </p>
                  ) : (
                    plans.data.map((plan) => (
                      <div key={plan.id} className="rounded-xl border p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">
                              {plan.staff.name} · {plan.name}
                            </p>
                            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
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
                        <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-3 [&>div]:space-y-2">
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
                        <p className="text-muted-foreground mt-5 border-t pt-4 text-xs leading-relaxed">
                          Total {formatCurrency(plan.hourlyPrice * plan.hours)} · Tambahan peserta
                          Rp100.000/orang/jam untuk coach.
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              {canEdit && (
                <Card className="min-w-0 gap-6 py-6 sm:py-8">
                  <CardHeader className="gap-3 px-6 sm:px-8">
                    <CardTitle>{editing ? 'Edit paket' : 'Tambah paket'}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 sm:px-8">
                    <form
                      className="space-y-6"
                      onSubmit={(e) => {
                        e.preventDefault();
                        save.mutate();
                      }}
                    >
                      <div className="grid min-w-0 gap-3">
                        <Label htmlFor="plan-coach">Coach in-house</Label>
                        <SearchableSelect
                          id="plan-coach"
                          required
                          disabled={!!editing || people.isPending}
                          value={draft.staffId}
                          onValueChange={(staffId) => setDraft({ ...draft, staffId })}
                          placeholder={people.isPending ? 'Memuat coach...' : 'Pilih coach'}
                          searchPlaceholder="Cari nama coach..."
                          emptyMessage="Coach tidak ditemukan."
                          options={(people.data ?? [])
                            .filter(
                              (person) =>
                                person.role === 'COACH' &&
                                person.isActive &&
                                person.isInHouseCoach === true
                            )
                            .map((person) => ({ value: person.id, label: person.name }))}
                        />
                      </div>
                      <div className="grid min-w-0 gap-3">
                        <Label htmlFor="plan-name">Nama paket</Label>
                        <Input
                          id="plan-name"
                          className="h-12 rounded-lg px-4"
                          required
                          maxLength={100}
                          value={draft.name}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                          placeholder="Paket 5 jam"
                        />
                      </div>
                      <div className="grid min-w-0 gap-3">
                        <Label htmlFor="plan-hours">Kuota jam</Label>
                        <SearchableSelect
                          id="plan-hours"
                          searchable={false}
                          value={String(draft.hours)}
                          onValueChange={(hours) =>
                            setDraft({ ...draft, hours: Number(hours) as 1 | 5 | 10 })
                          }
                          options={[1, 5, 10].map((hours) => ({
                            value: String(hours),
                            label: `${hours} jam`
                          }))}
                        />
                      </div>
                      <div className="grid min-w-0 gap-3">
                        <Label htmlFor="plan-price">Harga per jam (Rp)</Label>
                        <Input
                          id="plan-price"
                          className="h-12 rounded-lg px-4"
                          required
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={100000000}
                          value={draft.hourlyPrice || ''}
                          onChange={(e) =>
                            setDraft({ ...draft, hourlyPrice: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="grid min-w-0 gap-3">
                        <Label htmlFor="plan-court">Bagian lapangan per jam (Rp)</Label>
                        <Input
                          id="plan-court"
                          className="h-12 rounded-lg px-4"
                          required
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={draft.hourlyPrice}
                          value={
                            editingCourtAmount && draft.courtHourlyShare === 0
                              ? ''
                              : draft.courtHourlyShare
                          }
                          onFocus={() => setEditingCourtAmount(true)}
                          onBlur={() => setEditingCourtAmount(false)}
                          onChange={(e) =>
                            setDraft({ ...draft, courtHourlyShare: Number(e.target.value) })
                          }
                        />
                      </div>
                      <p className="text-muted-foreground bg-muted/30 rounded-lg p-4 text-sm leading-relaxed">
                        Kuota terikat pada coach. Perubahan tarif berlaku untuk pembelian
                        berikutnya.
                      </p>
                      <label className="flex items-center gap-3 py-1 text-sm leading-relaxed">
                        <input
                          type="checkbox"
                          className="size-4 shrink-0"
                          checked={draft.isActive}
                          onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                        />{' '}
                        Paket aktif
                      </label>
                      <div className="flex flex-wrap gap-3 border-t pt-5">
                        <Button
                          type="submit"
                          className="h-12 w-full px-6 sm:w-auto"
                          disabled={save.isPending || !draft.staffId}
                        >
                          Simpan paket
                        </Button>
                        {editing && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-12 px-6"
                            onClick={() => {
                              setEditing(undefined);
                              setDraft(emptyPlan());
                            }}
                          >
                            Batal
                          </Button>
                        )}
                      </div>
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
                <Card className="gap-6 py-6">
                  <CardHeader className="px-6 sm:px-8">
                    <CardTitle>Jual paket coaching</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 sm:px-8">
                    <form
                      className="space-y-6"
                      onSubmit={(e) => {
                        e.preventDefault();
                        sell.mutate();
                      }}
                    >
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="grid min-w-0 gap-3">
                          <Label htmlFor="sale-package">Paket coach</Label>
                          <SearchableSelect
                            id="sale-package"
                            required
                            value={packageId}
                            onValueChange={(id) => {
                              setPackageId(id);
                              setRequestId(crypto.randomUUID());
                            }}
                            placeholder="Pilih paket"
                            searchPlaceholder="Cari coach atau paket..."
                            emptyMessage="Paket tidak ditemukan."
                            options={(plans.data ?? [])
                              .filter((plan) => plan.isActive && plan.staff.isActive)
                              .map((plan) => ({
                                value: plan.id,
                                label: `${plan.staff.name} · ${plan.name}`,
                                description: `${plan.hours} jam · ${formatCurrency(plan.hours * plan.hourlyPrice)}`
                              }))}
                          />
                        </div>
                        <div className="grid min-w-0 gap-3">
                          <Label htmlFor="sale-method">Pembayaran diterima melalui</Label>
                          <SearchableSelect
                            id="sale-method"
                            required
                            value={methodId}
                            onValueChange={(id) => {
                              setMethodId(id);
                              setRequestId(crypto.randomUUID());
                            }}
                            placeholder="Pilih metode offline"
                            searchPlaceholder="Cari metode pembayaran..."
                            emptyMessage="Metode offline tidak ditemukan."
                            options={(methods.data ?? [])
                              .filter(isOfflinePaymentMethod)
                              .map((method) => ({ value: method.id, label: method.name }))}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {!userId
                            ? 'Pilih customer dari hasil pencarian terlebih dahulu.'
                            : selectedPlan
                              ? `Total pembayaran ${formatCurrency(selectedPlan.hours * selectedPlan.hourlyPrice)} untuk ${selectedPlan.hours} jam bersama ${selectedPlan.staff.name}.`
                              : 'Kuota dapat digunakan di hari berbeda, khusus coach yang dibeli.'}
                        </p>
                        <Button
                          type="submit"
                          className="h-12 w-full shrink-0 px-6 sm:w-auto"
                          disabled={!userId || !packageId || !methodId || sell.isPending}
                        >
                          Terima pembayaran & tambah kuota
                        </Button>
                      </div>
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
                            ? [
                                'Customer',
                                'Coach / paket',
                                'Sisa / total jam',
                                'Invoice pembelian',
                                ...(canSell ? ['Aksi'] : [])
                              ]
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
                                {canSell && (
                                  <td className="p-3">
                                    {wallet.remainingMinutes === wallet.totalMinutes &&
                                    wallet._count?.usages === 0 ? (
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={remove.isPending}
                                        onClick={() => setDeleting(wallet)}
                                      >
                                        Hapus
                                      </Button>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">
                                        Sudah pernah dipakai
                                      </span>
                                    )}
                                  </td>
                                )}
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
