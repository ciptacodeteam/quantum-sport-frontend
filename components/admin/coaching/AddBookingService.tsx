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
  const now = useBookingClock();
  const canAdd = !!detailId && confirmed && isCourtWallSlotBookable(startAt, now);
  const client = useQueryClient();
  const [slotId, setSlotId] = useState(''),
    [methodId, setMethodId] = useState('');
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
      m.channel &&
      (m.channel.includes('VIRTUAL_ACCOUNT') ||
        ['QRIS', 'QR'].includes(m.channel) ||
        (m.channel === 'CARDS' && config.data?.checkoutMode === 'snap'))
  );
  const selectedMethod = paymentMethods.find((m) => m.id === methodId) ?? paymentMethods[0];
  const selected = available.data?.find((option) => option.slotId === slotId);
  const baseFee =
    selectedMethod && selected
      ? selectedMethod.fees + Math.round((selected.price * Number(selectedMethod.percentage)) / 100)
      : 0;
  const total = selected
    ? selected.price + (selected.price ? baseFee + Math.round(baseFee * 0.11) : 0)
    : 0;
  const attach = useMutation({
    mutationFn: () => coachingApi.attach(detailId!, slotId, selectedMethod?.id),
    onSuccess: (result) => {
      setCreated(result);
      setSlotId('');
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
      className="bg-muted/20 mb-5 space-y-4 rounded-lg border p-4"
    >
      <div>
        <h3 className="font-semibold">Tambah Coach{sport === 'TENNIS' ? ' / Ballboy' : ''}</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {formatScheduleSlotTime(startAt, 'DD MMM YYYY')} · {formatScheduleSlotTime(startAt)}–
          {formatScheduleSlotTime(endAt)} WIB. Invoice layanan dibuat terpisah dari lapangan.
        </p>
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
          <div className="space-y-2">
            <Label htmlFor="schedule-service">Pilih layanan</Label>
            <Select value={slotId} onValueChange={setSlotId}>
              <SelectTrigger id="schedule-service">
                <SelectValue placeholder="Pilih coach atau ballboy..." />
              </SelectTrigger>
              <SelectContent>
                {available.data.map((option) => (
                  <SelectItem key={option.slotId} value={option.slotId}>
                    {option.kind === 'COACH' ? 'Coach' : 'Ballboy'} {option.name} · Rp{' '}
                    {option.price.toLocaleString('id-ID')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selected && selected.price > 0 && (
            <div className="space-y-2">
              <Label htmlFor="schedule-service-payment">Metode pembayaran invoice</Label>
              <Select value={selectedMethod?.id ?? ''} onValueChange={setMethodId}>
                <SelectTrigger id="schedule-service-payment">
                  <SelectValue placeholder="Pilih metode pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!methods.isPending && !paymentMethods.length && (
                <p className="text-destructive text-xs">
                  Belum ada metode pembayaran aktif. Hubungi admin untuk mengaturnya.
                </p>
              )}
            </div>
          )}
          {selected && (
            <p className="text-sm">
              Total invoice{selected.price > 0 ? ' termasuk biaya pembayaran' : ''}:{' '}
              <strong>Rp {total.toLocaleString('id-ID')}</strong>
            </p>
          )}
          <Button
            onClick={() => attach.mutate()}
            disabled={
              !selected || attach.isPending || !canAdd || (selected.price > 0 && !selectedMethod)
            }
          >
            {attach.isPending ? 'Membuat invoice...' : 'Tambah layanan & buat invoice'}
          </Button>
          <p className="text-muted-foreground text-xs">
            Untuk layanan berbayar, slot ditahan 10 menit. Status dikonfirmasi otomatis setelah
            pembayaran berhasil; slot dilepas jika pembayaran kedaluwarsa.
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
              Salin tautan pembayaran
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
