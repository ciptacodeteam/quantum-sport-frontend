'use client';
import { WalletCards, History } from 'lucide-react';
import { IconCheck, IconUser } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import OfflinePaymentSelection from '@/components/admin/booking/OfflinePaymentSelection';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty
} from '@/components/ui/command';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { serviceMatchesSport } from '@/lib/service-sport';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
const buttonClass = 'rounded-md border-0 shadow-none';
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
  const [debouncedQ, setDebouncedQ] = useState('');
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [sport, setSport] = useState<'PADEL' | 'TENNIS'>('PADEL');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);
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
    ...adminCustomerSearchQueryOptions({ q: debouncedQ, limit: '20' }),
    enabled: ready && isCustomerOpen && debouncedQ.length >= 2
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
  const availablePlans = (plans.data ?? []).filter(
    (plan) =>
      plan.isActive &&
      plan.staff.isActive &&
      serviceMatchesSport('COACH', plan.staff.coachType, sport)
  );
  const selectedPlan = availablePlans.find((plan) => plan.id === packageId);
  const amountDue = selectedPlan ? selectedPlan.hours * selectedPlan.hourlyPrice : 0;
  const offlineMethods = (methods.data ?? []).filter(isOfflinePaymentMethod);
  const selectedMethod = offlineMethods.find((method) => method.id === methodId);
  const customerPicker = (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm font-medium">Pelanggan</p>
      <Popover open={isCustomerOpen} onOpenChange={setIsCustomerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-label="Pelanggan"
            aria-expanded={isCustomerOpen}
            className="h-10 w-full min-w-0 justify-start gap-2 rounded-lg shadow-none"
          >
            <IconUser className="text-muted-foreground size-4 shrink-0" />
            <span className="truncate">
              {userId ? customerLabel.split(' · ')[0] : 'Cari pelanggan...'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Cari pelanggan (min. 2 karakter)"
              aria-label="Cari nama atau nomor WhatsApp"
              value={q}
              onValueChange={setQ}
            />
            <CommandList>
              {customers.isError ? (
                <p role="alert" className="text-destructive px-3 py-6 text-center text-sm">
                  Pencarian customer belum berhasil.
                </p>
              ) : customers.isFetching ? (
                <p role="status" className="text-muted-foreground py-6 text-center text-sm">
                  Mencari pelanggan...
                </p>
              ) : debouncedQ.length < 2 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  Ketik minimal 2 karakter untuk mencari
                </p>
              ) : !customers.data?.length ? (
                <CommandEmpty>Tidak ada pelanggan ditemukan.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {customers.data.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={`${customer.name} ${customer.phone}`}
                      onSelect={() => {
                        setUserId(customer.id);
                        setCustomerLabel(`${customer.name} · ${customer.phone}`);
                        setRequestId(crypto.randomUUID());
                        setIsCustomerOpen(false);
                        setQ('');
                      }}
                    >
                      <span className="flex flex-col">
                        <span className="font-medium">{customer.name}</span>
                        <span className="text-muted-foreground text-xs">{customer.phone}</span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {userId && (
        <div className="bg-muted/60 rounded-md border px-3 py-2 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <IconUser className="size-3.5" />
            {customerLabel.split(' · ')[0]}
          </div>
          <p className="text-muted-foreground mt-1">{customerLabel.split(' · ')[1]}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-6 px-2 text-xs"
            onClick={() => {
              setUserId('');
              setCustomerLabel('');
              setRequestId(crypto.randomUUID());
            }}
          >
            Hapus pilihan
          </Button>
        </div>
      )}
    </div>
  );
  if (!hasAccess) return null;
  return (
    <main className="w-full min-w-0 space-y-6 pb-6">
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
      <header className="space-y-2">
        <h1 className="text-lg font-semibold">Coaching In-house</h1>
        <p className="text-muted-foreground text-sm">
          Pilih paket coaching dan pelanggan, lalu konfirmasi pembayaran.
        </p>
      </header>
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
                data-admin-tab
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
            {tab === 'quota' && canSell ? (
              <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
                <section className="min-w-0 space-y-4" aria-label="Pilihan paket coaching">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold">Pilihan paket</h2>
                      {!plans.isPending && (
                        <span className="text-muted-foreground bg-muted rounded-md px-2 py-0.5 text-xs">
                          {availablePlans.length}
                        </span>
                      )}
                    </div>
                    <Tabs
                      value={sport}
                      onValueChange={(value) => {
                        setSport(value as 'PADEL' | 'TENNIS');
                        setPackageId('');
                        setRequestId(crypto.randomUUID());
                      }}
                    >
                      <TabsList className="grid h-10 w-full grid-cols-2 sm:w-48">
                        <TabsTrigger value="PADEL">Padel</TabsTrigger>
                        <TabsTrigger value="TENNIS">Tennis</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {plans.isPending ? (
                      <div
                        role="status"
                        className="text-muted-foreground rounded-2xl border bg-white p-8 text-center text-sm shadow-sm"
                      >
                        Memuat paket coaching...
                      </div>
                    ) : !availablePlans.length ? (
                      <div className="text-muted-foreground rounded-2xl border bg-white p-8 text-center text-sm shadow-sm">
                        Belum ada paket coaching {sport === 'PADEL' ? 'Padel' : 'Tennis'} yang
                        aktif.
                      </div>
                    ) : (
                      availablePlans.map((plan) => {
                        const isSelected = plan.id === packageId;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            data-admin-card
                            aria-pressed={isSelected}
                            aria-label={`Pilih paket ${plan.staff.name} · ${plan.name}`}
                            className={cn(
                              'group bg-card focus-visible:ring-ring flex h-full min-w-0 flex-col overflow-hidden rounded-xl border text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                              isSelected
                                ? 'border-primary ring-primary ring-1'
                                : 'border-border hover:border-primary/50'
                            )}
                            onClick={() => {
                              setPackageId(isSelected ? '' : plan.id);
                              setRequestId(crypto.randomUUID());
                            }}
                          >
                            <div className="flex h-full w-full flex-col gap-4 p-5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-2">
                                  <p className="text-muted-foreground text-xs">
                                    {sport === 'PADEL' ? 'Padel' : 'Tennis'} · {plan.hours} jam
                                    coaching
                                  </p>
                                  <h3 className="min-h-12 text-base leading-6 font-semibold break-words">
                                    {plan.name}
                                  </h3>
                                </div>
                                <span
                                  className={cn(
                                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                                    isSelected
                                      ? 'border-primary bg-primary text-white'
                                      : 'border-input'
                                  )}
                                >
                                  {isSelected && <IconCheck className="size-3.5" />}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-2xl font-semibold tracking-tight tabular-nums">
                                  {formatCurrency(plan.hours * plan.hourlyPrice)}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {formatCurrency(plan.hourlyPrice)}/jam · {plan.staff.name}
                                </p>
                              </div>
                              <div className="min-h-16 space-y-2 border-t pt-3 text-xs">
                                <div className="flex items-start gap-2">
                                  <IconCheck className="text-primary mt-0.5 size-3.5 shrink-0" />
                                  <span className="text-muted-foreground">
                                    {plan.hours} jam bersama {plan.staff.name}
                                  </span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <IconCheck className="text-primary mt-0.5 size-3.5 shrink-0" />
                                  <span className="text-muted-foreground">
                                    Kuota dapat digunakan di hari berbeda
                                  </span>
                                </div>
                              </div>
                              <div
                                className={cn(
                                  'mt-auto rounded-lg px-3 py-2 text-center text-sm font-medium',
                                  isSelected
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-foreground group-hover:bg-primary/5'
                                )}
                              >
                                {isSelected ? 'Paket dipilih' : 'Pilih paket'}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </section>
                <aside className="min-w-0 xl:sticky xl:top-4">
                  <Card className="min-w-0 gap-5 rounded-xl py-5 shadow-none">
                    <CardHeader className="space-y-2 px-5">
                      <CardTitle className="text-base">Ringkasan pemesanan</CardTitle>
                      <p className="text-muted-foreground text-xs">
                        Lengkapi data untuk menambahkan kuota coaching.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-5 px-5">
                      {customerPicker}
                      <OfflinePaymentSelection
                        amountDue={amountDue}
                        methods={offlineMethods}
                        selectedId={selectedMethod?.id ?? ''}
                        onSelect={(id) => {
                          setMethodId(id);
                          setRequestId(crypto.randomUUID());
                        }}
                        loading={methods.isPending}
                        error={methods.isError}
                        onRetry={() => void methods.refetch()}
                        disabled={sell.isPending}
                      />
                      <Separator />
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4 text-sm">
                          <span className="text-muted-foreground shrink-0">Paket</span>
                          <span className="text-right font-medium break-words">
                            {selectedPlan?.name ?? 'Belum dipilih'}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4 text-sm">
                          <span className="text-muted-foreground shrink-0">Coach</span>
                          <span className="text-right font-medium">
                            {selectedPlan?.staff.name ?? '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Kuota</span>
                          <span className="font-medium">
                            {selectedPlan ? `${selectedPlan.hours} jam` : '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total</span>
                          <span className="text-xl font-semibold tabular-nums">
                            {selectedPlan ? formatCurrency(amountDue) : '-'}
                          </span>
                        </div>
                        {selectedPlan && (
                          <details className="bg-muted/50 rounded-lg px-3 py-2.5 text-xs">
                            <summary className="cursor-pointer font-medium">
                              Detail paket dan ketentuan
                            </summary>
                            <ul className="text-muted-foreground mt-3 space-y-2">
                              <li>Kuota terikat pada {selectedPlan.staff.name}.</li>
                              <li>
                                Tambahan peserta{' '}
                                {formatCurrency(selectedPlan.extraParticipantHourlyPrice)}
                                /orang/jam.
                              </li>
                              <li>Kuota ditambahkan setelah pembayaran diterima.</li>
                            </ul>
                          </details>
                        )}
                      </div>
                      <Button
                        className="h-10 w-full rounded-lg"
                        onClick={() => sell.mutate()}
                        disabled={
                          !userId ||
                          !selectedPlan ||
                          !selectedMethod ||
                          methods.isPending ||
                          methods.isError ||
                          sell.isPending
                        }
                      >
                        {sell.isPending ? 'Memproses...' : 'Terima pembayaran & tambah kuota'}
                      </Button>
                    </CardContent>
                  </Card>
                </aside>
              </div>
            ) : (
              <Card className="max-w-lg gap-5 rounded-xl py-5 shadow-none">
                <CardHeader className="px-5">
                  <CardTitle className="text-base">Filter pelanggan</CardTitle>
                </CardHeader>
                <CardContent className="px-5">{customerPicker}</CardContent>
              </Card>
            )}
            <Card className="min-w-0 gap-5 rounded-xl py-5 shadow-none">
              <CardHeader className="space-y-2 px-5">
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
              <CardContent className="px-5">
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
    </main>
  );
}
