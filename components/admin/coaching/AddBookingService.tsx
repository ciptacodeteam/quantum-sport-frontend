'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coachingApi } from '@/api/admin/coaching';
import { adminPaymentMethodsQueryOptions } from '@/queries/admin/paymentMethod';
import { useHasRole } from '@/hooks/useRoleAccess';
import { useBookingClock } from '@/hooks/useBookingClock';
import { isCourtWallSlotBookable } from '@/lib/booking-time-policy';
import { getApiErrorMessage } from '@/lib/api-error';
import { getMidtransConfig } from '@/lib/midtrans';
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
  const [groupId, setGroupId] = useState('independent');
  const [slotIds, setSlotIds] = useState<string[]>([]);
  const [methodId, setMethodId] = useState('');
  const [received, setReceived] = useState(false);
  const [created, setCreated] = useState<{
    invoiceId: string;
    invoiceNumber: string;
    total: number;
    status: string;
  } | null>(null);
  const available = useQuery({
    queryKey: ['admin', 'coaching', 'availability', detailId, startAt, endAt],
    queryFn: () => coachingApi.available(detailId!, startAt, endAt),
    enabled: canWrite && canAdd,
    refetchInterval: 10000
  });
  const methods = useQuery({ ...adminPaymentMethodsQueryOptions, enabled: canWrite && canAdd });
  const config = useQuery({
    queryKey: ['midtrans', 'client-config'],
    queryFn: getMidtransConfig,
    enabled: canWrite && canAdd
  });
  const paymentMethods = (methods.data ?? []).filter(
    (m) =>
      m.isActive &&
      (m.isOffline
        ? !['EDC', 'QRIS_STATIC', 'BANK_TRANSFER_MANUAL'].includes(m.channel ?? '')
        : m.channel &&
          (m.channel.includes('VIRTUAL_ACCOUNT') ||
            ['QRIS', 'QR'].includes(m.channel) ||
            (m.channel === 'CARDS' && config.data?.checkoutMode === 'snap')))
  );
  const manualMethod =
    methodId === 'EDC' || methodId === 'QRIS_STATIC' || methodId === 'BANK_TRANSFER_MANUAL'
      ? methodId
      : undefined;
  const selectedMethod = manualMethod
    ? undefined
    : (paymentMethods.find((m) => m.id === methodId) ?? paymentMethods.find((m) => !m.isOffline));
  const isManual = !!manualMethod || !!selectedMethod?.isOffline;
  const manualLabel = selectedMethod?.isOffline
    ? selectedMethod.name
    : manualMethod === 'EDC'
      ? 'EDC'
      : manualMethod === 'QRIS_STATIC'
        ? 'QRIS Statis'
        : 'Transfer';
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
  const baseFee =
    selectedMethod && !isManual && price > 0
      ? selectedMethod.fees + Math.round((price * Number(selectedMethod.percentage)) / 100)
      : 0;
  const total = price + baseFee + Math.round(baseFee * 0.11);
  const attach = useMutation({
    mutationFn: () =>
      coachingApi.attach(
        detailId!,
        slotIds,
        price > 0 ? selectedMethod?.id : undefined,
        price > 0 && isManual
          ? { ...(manualMethod ? { method: manualMethod } : {}), received }
          : undefined,
        ...(selectedCoach && groupId !== 'independent' ? [groupId] : [])
      ),
    onSuccess: (result) => {
      setCreated(result);
      setGroupId('independent');
      setSlotIds([]);
      setReceived(false);
      for (const key of [
        ['admin', 'schedule'],
        ['admin', 'coaching'],
        ['admin', 'bookings'],
        ['admin', 'booked-coaches'],
        ['admin', 'booked-ballboys']
      ])
        void client.invalidateQueries({ queryKey: key });
      toast.success('Layanan ditambahkan dan invoice dibuat.');
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
        <h3 className="font-semibold">Tambah Coach{sport === 'TENNIS' ? ' / Ballboy' : ''}</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {formatScheduleSlotTime(startAt, 'DD MMM YYYY')} · {formatScheduleSlotTime(startAt)}–
          {formatScheduleSlotTime(endAt)} WIB. Invoice layanan dibuat terpisah dari lapangan.
        </p>
        {sport === 'TENNIS' && (
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
        )}
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
        <p className="text-sm">Mencari jadwal tersedia...</p>
      ) : !available.data?.length ? (
        <p className="text-muted-foreground text-sm">
          Tidak ada coach{sport === 'TENNIS' ? ' atau ballboy' : ''} tersedia pada jam ini.
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
                  setReceived(false);
                  setSlotIds(
                    slotIds.filter(
                      (id) => available.data?.find((o) => o.slotId === id)?.kind === 'BALLBOY'
                    )
                  );
                }}
                disabled={attach.isPending}
              >
                <SelectTrigger id="schedule-coaching-group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="independent">Coach Independen</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
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
              Pilih satu coach{sport === 'TENNIS' ? ' dan satu ballboy sekaligus' : ''}. Layanan
              terpilih digabung dalam satu invoice.
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
                      setReceived(false);
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
          {price > 0 && (
            <div className="space-y-2">
              <Label htmlFor="schedule-service-payment">Metode pembayaran invoice</Label>
              <Select
                value={manualMethod ?? selectedMethod?.id ?? ''}
                onValueChange={(value) => {
                  setMethodId(value);
                  setReceived(false);
                }}
                disabled={attach.isPending}
              >
                <SelectTrigger id="schedule-service-payment">
                  <SelectValue placeholder="Pilih metode pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EDC">EDC</SelectItem>
                  <SelectItem value="QRIS_STATIC">QRIS Statis</SelectItem>
                  <SelectItem value="BANK_TRANSFER_MANUAL">Transfer</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                      {method.isOffline ? ' (Offline)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isManual && (
                <label className="bg-background flex items-start gap-3 rounded-lg border p-3 text-sm">
                  <input
                    type="checkbox"
                    className="accent-primary mt-0.5 size-4 shrink-0"
                    checked={received}
                    disabled={attach.isPending}
                    onChange={(e) => setReceived(e.target.checked)}
                  />
                  <span>Pembayaran {manualLabel} sudah diterima. Invoice akan dicatat lunas.</span>
                </label>
              )}
            </div>
          )}
          {selected.length > 0 && (
            <p className="text-sm">
              Total invoice{price > 0 && !isManual ? ' termasuk biaya pembayaran' : ''}:{' '}
              <strong>Rp {total.toLocaleString('id-ID')}</strong>
            </p>
          )}
          <Button
            onClick={() => attach.mutate()}
            disabled={
              !selectionValid ||
              attach.isPending ||
              !canAdd ||
              (price > 0 && (isManual ? !received : !selectedMethod))
            }
          >
            {attach.isPending ? 'Membuat invoice...' : 'Tambah layanan & buat invoice'}
          </Button>
          <p className="text-muted-foreground text-xs">
            {isManual
              ? 'Pembayaran offline dicatat lunas setelah penerimaan dikonfirmasi.'
              : 'Pembayaran online: slot ditahan 10 menit dan dikonfirmasi setelah pembayaran berhasil. Slot dilepas jika pembayaran kedaluwarsa.'}
          </p>
        </>
      )}
      {created && (
        <div role="status" className="bg-background space-y-2 rounded border p-3 text-sm">
          <p>
            Invoice {created.invoiceNumber} ·{' '}
            {created.status === 'PAID' ? 'Lunas' : 'Menunggu pembayaran'}
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
