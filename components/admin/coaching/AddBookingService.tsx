'use client';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminPaymentMethodsQueryOptions } from '@/queries/admin/paymentMethod';
import { isOfflinePaymentMethod } from '@/lib/offline-payment';
import { coachingApi } from '@/api/admin/coaching';
import { useHasRole } from '@/hooks/useRoleAccess';
import { useBookingClock } from '@/hooks/useBookingClock';
import { isCourtWallSlotBookable } from '@/lib/booking-time-policy';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatScheduleSlotTime } from '@/lib/admin-schedule-time';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function AddBookingService({
  detailId,
  startAt,
  endAt,
  sport,
  confirmed
}: {
  detailId?: string;
  startAt: string;
  endAt: string;
  sport: 'PADEL' | 'TENNIS';
  confirmed: boolean;
}) {
  const canWrite = useHasRole(['ADMIN', 'CASHIER']);
  const canManageProfiles = useHasRole(['ADMIN']);
  const now = useBookingClock();
  const canAdd = !!detailId && confirmed && isCourtWallSlotBookable(startAt, now);
  const client = useQueryClient();
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const methods = useQuery({ ...adminPaymentMethodsQueryOptions, enabled: canWrite && canAdd });
  const offlineMethods = (methods.data ?? []).filter(isOfflinePaymentMethod);
  const paymentMethod = offlineMethods.find((method) => method.id === paymentMethodId);
  const paymentReady =
    !!paymentMethod && !methods.isPending && !methods.isError && !methods.isFetching;
  const [groupId, setGroupId] = useState('independent');
  const [slotIds, setSlotIds] = useState<string[]>([]);
  const [created, setCreated] = useState<{
    invoiceId: string;
    invoiceNumber: string;
    total: number;
    status: string;
    paymentMethodName: string;
  } | null>(null);
  const available = useQuery({
    queryKey: ['admin', 'coaching', 'availability', detailId, startAt, endAt],
    queryFn: ({ signal }) => coachingApi.available(detailId!, startAt, endAt, signal),
    enabled: canWrite && canAdd,
    staleTime: 10000,
    retry: false,
    refetchInterval: 10000
  });
  const selected = (available.data ?? []).filter((option) => slotIds.includes(option.slotId));
  const groups = Array.from(
    new Map(
      (available.data ?? []).flatMap((o) =>
        o.kind === 'COACH' ? (o.groups ?? []).map((g) => [g.id, g] as const) : []
      )
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));
  const visibleOptions = (available.data ?? []).filter(
    (o) =>
      o.kind !== 'COACH' ||
      (groupId === 'independent' ? !o.groups?.length : o.groups?.some((g) => g.id === groupId))
  );
  const selectedCoach = selected.find((o) => o.kind === 'COACH');
  const price = selected.reduce((sum, option) => sum + option.price, 0);
  const selectionValid =
    selected.length > 0 &&
    selected.length === slotIds.length &&
    selected.every((o) => visibleOptions.some((v) => v.slotId === o.slotId));
  const attach = useMutation({
    mutationFn: () => {
      if (!paymentReady)
        throw new Error('Pilih metode pembayaran offline yang aktif terlebih dahulu.');
      return coachingApi.attach(
        detailId!,
        slotIds,
        paymentMethod!.id,
        undefined,
        ...(selectedCoach && groupId !== 'independent' ? [groupId] : [])
      );
    },
    onSuccess: (result) => {
      setCreated({ ...result, paymentMethodName: paymentMethod?.name ?? '' });
      setPaymentMethodId('');
      setGroupId('independent');
      setSlotIds([]);
      for (const key of [
        ['admin', 'schedule'],
        ['admin', 'analytics'],
        ['admin', 'invoices'],
        ['admin', 'coaching'],
        ['admin', 'bookings'],
        ['admin', 'booked-coaches'],
        ['admin', 'booked-ballboys']
      ])
        void client.invalidateQueries({ queryKey: key });
      toast.success('Layanan ditambahkan dan dikonfirmasi lunas.');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Layanan belum dapat ditambahkan.'));
      void available.refetch();
    }
  });
  if (!canWrite || !detailId || !confirmed) return null;
  return (
    <section
      aria-label="Tambah layanan ke booking"
      className="bg-muted/20 mb-5 space-y-5 rounded-xl border p-4 sm:p-5"
    >
      <div>
        <h3 className="font-semibold">Tambah Coach / Ballboy</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {formatScheduleSlotTime(startAt, 'DD MMM YYYY')} · {formatScheduleSlotTime(startAt)}–
          {formatScheduleSlotTime(endAt)} WIB · {sport === 'PADEL' ? 'Padel' : 'Tennis'}. Invoice
          layanan dibuat terpisah dari lapangan.
        </p>
        {
          <p className="text-muted-foreground mt-2 text-xs">
            Ballboy muncul jika profil aktif dan jadwal tersedia pada cabang serta jam booking ini.
            {canManageProfiles && (
              <>
                {' '}
                <Link className="text-primary underline" href="/admin/coaching?kind=BALLBOY">
                  Kelola profil, jadwal & harga Ballboy
                </Link>
              </>
            )}
          </p>
        }
      </div>
      {!canAdd ? (
        <p className="text-muted-foreground text-sm">
          Waktu ini sudah melewati batas pemesanan 15 menit.
        </p>
      ) : available.isError ? (
        <div role="alert">
          <p>Layanan belum dapat dimuat.</p>
          <Button variant="outline" onClick={() => void available.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : available.isPending ? (
        <div
          role="status"
          className="text-muted-foreground flex min-h-20 items-center justify-center gap-2 text-sm"
        >
          <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
          Mencari jadwal tersedia...
        </div>
      ) : !available.data?.length ? (
        <p className="text-muted-foreground text-sm">
          Tidak ada coach atau ballboy tersedia pada jam ini.
        </p>
      ) : (
        <>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="schedule-coaching-group">Grup coaching</Label>
              <Select
                value={groupId}
                onValueChange={(value) => {
                  setGroupId(value);
                  setSlotIds(
                    slotIds.filter(
                      (id) => available.data?.find((o) => o.slotId === id)?.kind === 'BALLBOY'
                    )
                  );
                }}
                disabled={attach.isPending}
              >
                <SelectTrigger
                  id="schedule-coaching-group"
                  className="min-h-12 w-full rounded-lg px-4"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl p-1.5">
                  <SelectItem value="independent" className="min-h-11 rounded-lg py-3 pl-3">
                    Coach Independen
                  </SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="min-h-11 rounded-lg py-3 pl-3">
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Coach mengikuti grup, cabang, olahraga, dan jam booking. Ballboy dapat dipilih
                bersamaan.
              </p>
            </div>
            <p className="text-sm font-medium">Pilih layanan</p>
            <p className="text-muted-foreground text-xs">
              Pilih satu coach dan satu ballboy sekaligus. Layanan terpilih digabung dalam satu
              invoice.
            </p>
            {!visibleOptions.some((o) => o.kind === 'COACH') && (
              <p className="text-muted-foreground text-xs">
                Tidak ada coach tersedia pada pilihan grup ini.
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {visibleOptions.map((option) => (
                <label
                  key={option.slotId}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${slotIds.includes(option.slotId) ? 'border-primary bg-primary/5' : 'bg-background hover:bg-muted/40'}`}
                >
                  <input
                    type="checkbox"
                    aria-label={`${option.kind === 'COACH' ? 'Coach' : 'Ballboy'} ${option.name}`}
                    className="accent-primary mt-1 size-4 shrink-0"
                    checked={slotIds.includes(option.slotId)}
                    disabled={attach.isPending}
                    onChange={(e) => {
                      setSlotIds(
                        e.target.checked
                          ? [
                              ...slotIds.filter(
                                (id) =>
                                  available.data.find((o) => o.slotId === id)?.kind !== option.kind
                              ),
                              option.slotId
                            ]
                          : slotIds.filter((id) => id !== option.slotId)
                      );
                    }}
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="text-muted-foreground block text-xs">
                      {option.kind === 'COACH' ? 'Coach' : 'Ballboy'}
                    </span>
                    <span className="block text-sm font-medium">{option.name}</span>
                    <span className="block text-sm tabular-nums">
                      Rp {option.price.toLocaleString('id-ID')}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          {selected.length > 0 && (
            <p className="text-sm">
              Total layanan:
              <strong>Rp {price.toLocaleString('id-ID')}</strong>
            </p>
          )}
          <div className="bg-background grid gap-3 rounded-lg border p-4">
            <Label htmlFor={`service-payment-${detailId}`}>Metode pembayaran offline</Label>
            {methods.isError ? (
              <div role="alert" className="space-y-2 text-sm">
                <p>Metode pembayaran belum dapat dimuat.</p>
                <Button variant="outline" onClick={() => void methods.refetch()}>
                  Muat ulang metode pembayaran
                </Button>
              </div>
            ) : (
              <>
                <Select
                  value={paymentMethod?.id ?? ''}
                  onValueChange={setPaymentMethodId}
                  disabled={attach.isPending || methods.isPending || !offlineMethods.length}
                >
                  <SelectTrigger
                    id={`service-payment-${detailId}`}
                    className="min-h-12 w-full px-4"
                  >
                    <SelectValue
                      placeholder={
                        methods.isPending ? 'Memuat metode...' : 'Pilih metode pembayaran'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl p-1.5">
                    {offlineMethods.map((method) => (
                      <SelectItem
                        key={method.id}
                        value={method.id}
                        className="min-h-11 rounded-lg py-3 pl-3"
                      >
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!methods.isPending && !offlineMethods.length && (
                  <p role="alert" className="text-destructive text-sm">
                    Belum ada metode pembayaran offline yang aktif.
                  </p>
                )}
              </>
            )}
            <p className="text-muted-foreground text-xs leading-relaxed">
              Wajib dipilih untuk setiap pemesanan coach atau ballboy. Konfirmasi setelah pembayaran
              diterima melalui metode tersebut.
            </p>
          </div>
          <Button
            onClick={() => attach.mutate()}
            disabled={
              !selectionValid ||
              !paymentReady ||
              attach.isPending ||
              available.isFetching ||
              !canAdd
            }
          >
            {attach.isPending ? 'Mengonfirmasi...' : 'Tambah layanan & konfirmasi lunas'}
          </Button>
          <p className="text-muted-foreground text-xs">
            Pembayaran dicatat menggunakan metode offline yang dipilih dan invoice dikonfirmasi
            lunas.
          </p>
        </>
      )}
      {created && (
        <div role="status" className="bg-background space-y-2 rounded border p-3 text-sm">
          <p>
            Invoice {created.invoiceNumber} ·{' '}
            {created.status === 'PAID' ? 'Lunas' : 'Menunggu pembayaran'}
          </p>
          <p className="text-muted-foreground text-xs">
            Metode pembayaran: {created.paymentMethodName}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/kelola-transaksi/${created.invoiceId}`}>Lihat invoice</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard
                  .writeText(`${window.location.origin}/invoice/${created.invoiceNumber}`)
                  .then(() => toast.success('Tautan invoice disalin.'))
                  .catch(() => toast.error('Tautan belum dapat disalin.'));
              }}
            >
              {created.status === 'PAID' ? 'Salin tautan invoice' : 'Salin tautan pembayaran'}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
