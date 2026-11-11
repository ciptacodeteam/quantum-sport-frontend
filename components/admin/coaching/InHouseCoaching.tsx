'use client';
import { Search, UserRound, WalletCards, History, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inHouseApi, type InHouseWallet } from '@/api/admin/inhouseCoaching';
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
const fieldClass =
  'h-11 rounded-md border-0 bg-muted/70 px-3 shadow-none hover:bg-muted focus-visible:bg-muted dark:bg-muted/70';
const buttonClass = 'rounded-md border-0 shadow-none';
const panelClass = 'min-w-0 gap-5 rounded-md border-0 bg-muted/20 py-5 shadow-none';
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
    <div className="min-w-0 space-y-6">
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleting(null);
        }}
      >
        <DialogContent className="rounded-md">
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
            <Button
              className={buttonClass}
              variant="secondary"
              disabled={remove.isPending}
              onClick={() => setDeleting(null)}
            >
              Batal
            </Button>
            <Button
              className={buttonClass}
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
        className="mb-6 pb-0 [&_h2]:mb-2 [&_p]:leading-relaxed"
        title="Coaching In-house"
        description="Penjualan paket, kuota customer, dan riwayat pemakaian coaching."
      />
      {!ready ? (
        <p>Pilih satu cabang terlebih dahulu.</p>
      ) : (
        <>
          <nav
            aria-label="Menu coaching in-house"
            className="bg-muted/35 flex w-fit max-w-full flex-wrap gap-1 rounded-md p-1"
          >
            {(
              [
                ['quota', 'Kuota Customer', WalletCards],
                ['usage', 'Riwayat & Pembagian', History]
              ] as const
            ).map(([value, label, Icon]) => (
              <Button
                key={value}
                variant="ghost"
                aria-pressed={tab === value}
                className={`h-9 rounded-sm border-0 px-3 text-xs shadow-none transition-colors duration-200 sm:text-sm ${tab === value ? 'bg-primary/5 text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-muted/40'}`}
                onClick={() => setTab(value)}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Button>
            ))}
          </nav>
          {(plans.isError || wallets.isError || (tab === 'usage' && usage.isError)) && (
            <div role="alert" className="rounded border p-4">
              Data coaching belum dapat dimuat.{' '}
              <Button
                className={buttonClass}
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

          <>
            <div
              className={
                tab === 'quota' && canSell
                  ? 'grid min-w-0 items-stretch gap-5 xl:grid-cols-[360px_minmax(0,1fr)]'
                  : 'max-w-2xl'
              }
            >
              <Card className={panelClass}>
                <CardHeader className="gap-2 px-5">
                  <CardTitle className="flex items-center gap-2 text-sm leading-snug font-semibold">
                    <UserRound className="text-muted-foreground size-4" />
                    Customer
                  </CardTitle>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Pilih customer untuk melihat kuota atau menambahkan paket.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 px-5">
                  <Label htmlFor="inhouse-search">Cari nama atau nomor WhatsApp</Label>
                  <div className="relative">
                    <Search className="text-muted-foreground pointer-events-none absolute top-3.5 left-3 size-4" />
                    <Input
                      className={`${fieldClass} pl-10`}
                      id="inhouse-search"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Ketik minimal 2 karakter"
                    />
                  </div>
                  {customers.isError && <p role="alert">Pencarian customer belum berhasil.</p>}
                  {q.length >= 2 && (
                    <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
                      {customers.data?.map((c) => (
                        <Button
                          key={c.id}
                          variant="ghost"
                          aria-pressed={c.id === userId}
                          className={`h-auto justify-start rounded-md border-0 p-3 text-left text-sm whitespace-normal shadow-none ${c.id === userId ? 'bg-primary/5 text-primary' : 'bg-background/60'}`}
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
                    <p className="text-primary bg-primary/5 rounded-md p-3 text-xs leading-relaxed font-medium">
                      Customer terpilih: {customerLabel}
                    </p>
                  )}
                  {userId && (
                    <Button
                      className={buttonClass}
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
                <Card className={panelClass}>
                  <CardHeader className="gap-2 px-5">
                    <CardTitle className="flex items-center gap-2 text-sm leading-snug font-semibold">
                      <CreditCard className="text-muted-foreground size-4" />
                      Jual paket coaching
                    </CardTitle>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Pilih paket dan metode pembayaran yang sudah diterima.
                    </p>
                  </CardHeader>
                  <CardContent className="px-5">
                    <form
                      className="space-y-5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        sell.mutate();
                      }}
                    >
                      <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                        <div className="grid min-w-0 gap-2">
                          <Label htmlFor="sale-package">Paket coach</Label>
                          <SearchableSelect
                            className={fieldClass}
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
                        <div className="grid min-w-0 gap-2">
                          <Label htmlFor="sale-method">Pembayaran diterima melalui</Label>
                          <SearchableSelect
                            className={fieldClass}
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
                      <div className="bg-background/60 flex flex-col gap-4 rounded-md p-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {!userId
                            ? 'Pilih customer dari hasil pencarian terlebih dahulu.'
                            : selectedPlan
                              ? `Total pembayaran ${formatCurrency(selectedPlan.hours * selectedPlan.hourlyPrice)} untuk ${selectedPlan.hours} jam bersama ${selectedPlan.staff.name}.`
                              : 'Kuota dapat digunakan di hari berbeda, khusus coach yang dibeli.'}
                        </p>
                        <Button
                          type="submit"
                          className="h-10 w-full shrink-0 rounded-md border-0 px-4 text-xs shadow-none sm:w-auto sm:text-sm"
                          disabled={!userId || !packageId || !methodId || sell.isPending}
                        >
                          Terima pembayaran & tambah kuota
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
            <Card className="min-w-0 gap-4 rounded-md border-0 py-2 shadow-none">
              <CardHeader className="gap-2 px-0 sm:px-1">
                <CardTitle className="flex items-center gap-2 text-sm leading-snug font-semibold">
                  <WalletCards className="text-muted-foreground size-4" />
                  {tab === 'quota' ? 'Saldo kuota coaching' : 'Riwayat pemakaian & pembagian'}
                </CardTitle>
                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                  <span>{userId ? customerLabel : 'Semua customer'}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {(tab === 'quota' ? wallets.data?.length : usage.data?.length) ?? 0}{' '}
                    {tab === 'quota' ? 'paket' : 'pemakaian'} ditampilkan
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-0 sm:px-1">
                <div className="overflow-x-auto rounded-md">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/35 text-muted-foreground text-xs">
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
                          <th key={label} className="px-4 py-3 font-medium whitespace-nowrap">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tab === 'quota'
                        ? wallets.data?.map((wallet) => (
                            <tr
                              key={wallet.id}
                              className="border-border/50 hover:bg-muted/15 border-b last:border-0"
                            >
                              <td className="px-4 py-4 align-middle">{wallet.user.name}</td>
                              <td className="px-4 py-4 align-middle">
                                {wallet.staff.name}
                                <p className="text-muted-foreground text-xs">
                                  {wallet.packageName}
                                </p>
                              </td>
                              <td className="px-4 py-4 font-semibold whitespace-nowrap tabular-nums">
                                {wallet.remainingMinutes / 60} / {wallet.totalMinutes / 60} jam
                              </td>
                              <td className="px-4 py-4 align-middle">
                                {wallet.invoice && (
                                  <Link
                                    className="text-primary text-xs underline-offset-4 hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={`/admin/kelola-transaksi/${wallet.invoice.id}`}
                                  >
                                    {wallet.invoice.number}
                                  </Link>
                                )}
                              </td>
                              {canSell && (
                                <td className="px-4 py-4 align-middle">
                                  {wallet.remainingMinutes === wallet.totalMinutes &&
                                  wallet._count?.usages === 0 ? (
                                    <Button
                                      variant="ghost"
                                      className="text-destructive hover:bg-destructive/5 hover:text-destructive rounded-md border-0 shadow-none"
                                      size="sm"
                                      disabled={remove.isPending}
                                      onClick={() => setDeleting(wallet)}
                                    >
                                      Hapus
                                    </Button>
                                  ) : (
                                    <Badge
                                      variant="lightNeutral"
                                      className="rounded-sm border-0 text-[11px] font-normal"
                                    >
                                      Sudah pernah dipakai
                                    </Badge>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))
                        : usage.data?.map((row) => (
                            <tr
                              key={row.id}
                              className={`border-border/50 hover:bg-muted/15 border-b last:border-0 ${row.restoredAt ? 'text-muted-foreground' : ''}`}
                            >
                              <td className="px-4 py-4 align-middle">
                                {row.wallet.user.name}
                                <p className="text-muted-foreground text-xs">
                                  {row.wallet.staff.name} · {row.wallet.packageName}
                                </p>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                                {row.startAt}
                                <p className="text-muted-foreground text-xs">
                                  s.d. {row.endAt} WIB
                                </p>
                              </td>
                              <td className="px-4 py-4 align-middle">{row.participants}</td>
                              <td className="px-4 py-4 align-middle">
                                {formatCurrency(row.courtAmount)}
                              </td>
                              <td className="px-4 py-4 align-middle">
                                {formatCurrency(row.coachAmount)}
                              </td>
                              <td className="px-4 py-4 align-middle">
                                {formatCurrency(row.extraAmount)}
                              </td>
                              <td className="px-4 py-4 align-middle">
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
                    Pembagian dicatat saat kuota dipakai. Pembelian paket sudah dibayar sebelumnya.
                    Baris yang dibatalkan tidak termasuk pembagian aktif.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        </>
      )}
    </div>
  );
}
