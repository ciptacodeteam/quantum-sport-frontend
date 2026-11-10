'use client';
import { useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import { formatCurrency } from '@/lib/utils';
import type { CoachAvailability } from '@/types/model';
import type { BookingItem } from '@/stores/useBookingStore';
import type { InHouseChoice, InHouseWallet } from '@/api/admin/inhouseCoaching';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Label } from '@/components/ui/label';
export function usableInHouseWallets(wallets: InHouseWallet[], sport: string) {
  return wallets.filter(
    (w) =>
      w.remainingMinutes >= 60 &&
      w.invoice?.status === 'PAID' &&
      w.staff.isActive &&
      (w.staff.coachType === sport || w.staff.coachType === 'PADEL_TENNIS')
  );
}
export default function BookingInHouseSelection({
  wallets,
  sessions,
  selected,
  onChange,
  disabled
}: {
  wallets: InHouseWallet[];
  sessions: BookingItem[];
  selected: InHouseChoice[];
  onChange: (session: BookingItem, choice: InHouseChoice | null) => void;
  disabled?: boolean;
}) {
  if (!wallets.length) return null;
  return (
    <section aria-label="Paket coach in-house" className="space-y-4 rounded-xl border p-4 sm:p-5">
      <div>
        <h3 className="font-semibold">Paket coach in-house (opsional)</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Pilih kuota milik customer untuk jam yang ingin digunakan. Lapangan sudah ditanggung
          paket. Pilihan coach club tetap tersedia di bawah.
        </p>
      </div>
      {sessions.map((session) => (
        <InHouseSession
          key={session.slotId}
          session={session}
          wallets={wallets}
          selected={selected}
          onChange={onChange}
          disabled={disabled}
        />
      ))}
    </section>
  );
}
function InHouseSession({
  session,
  wallets,
  selected,
  onChange,
  disabled
}: {
  session: BookingItem;
  wallets: InHouseWallet[];
  selected: InHouseChoice[];
  onChange: (session: BookingItem, choice: InHouseChoice | null) => void;
  disabled?: boolean;
}) {
  const choice = selected.find((s) => s.courtSlotId === session.slotId);
  const [walletId, setWalletId] = useState(choice?.walletId ?? '');
  const [participants, setParticipants] = useState(choice?.participants ?? 1);
  const wallet = wallets.find((w) => w.id === walletId);
  const start = session.startAt ?? `${session.date} ${session.timeSlot.slice(0, 5)}:00`;
  const end = session.endAt ?? dayjs(start).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
  const available = useQuery({
    queryKey: ['admin', 'inhouse', 'availability', wallet?.staffId, session.slotId, start, end],
    queryFn: async () =>
      (
        await adminApi.get('/coach/availability', {
          params: { startAt: start, endAt: end, courtSport: session.sport ?? 'PADEL' }
        })
      ).data.data as CoachAvailability[],
    enabled: !!wallet && !disabled
  });
  const coachSlot = available.data?.find((c) => c.coach.id === wallet?.staffId);
  const usedMinutes =
    selected.filter((s) => s.walletId === walletId && s.courtSlotId !== session.slotId).length * 60;
  const hasQuota = !!wallet && wallet.remainingMinutes - usedMinutes >= 60;
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {session.courtName} · {session.date} · {session.timeSlot}
        </p>
        {choice && <span className="text-primary text-xs font-medium">Kuota 1 jam dipilih</span>}
      </div>
      <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_100px_auto]">
        <div className="grid min-w-0 gap-3">
          <Label htmlFor={`wallet-${session.slotId}`}>Paket customer</Label>
          <SearchableSelect
            id={`wallet-${session.slotId}`}
            disabled={disabled}
            value={walletId}
            onValueChange={(id) => {
              setWalletId(id);
              if (choice) onChange(session, null);
            }}
            placeholder="Tanpa paket in-house"
            searchPlaceholder="Cari coach atau paket..."
            options={[
              { value: '', label: 'Tanpa paket in-house' },
              ...wallets.map((wallet) => ({
                value: wallet.id,
                label: `${wallet.staff.name} · ${wallet.packageName}`,
                description: `Sisa ${wallet.remainingMinutes / 60} jam`
              }))
            ]}
          />
        </div>
        <div className="grid min-w-0 gap-3">
          <Label htmlFor={`participants-${session.slotId}`}>Peserta</Label>
          <Input
            id={`participants-${session.slotId}`}
            type="number"
            min={1}
            max={100}
            disabled={disabled}
            value={participants}
            onChange={(e) => {
              const count = Number(e.target.value);
              setParticipants(count);
              if (choice && Number.isInteger(count) && count >= 1 && count <= 100)
                onChange(session, { ...choice, participants: count });
              else if (choice) onChange(session, null);
            }}
          />
        </div>
        {choice ? (
          <Button variant="outline" disabled={disabled} onClick={() => onChange(session, null)}>
            Batal gunakan
          </Button>
        ) : (
          <Button
            disabled={
              disabled ||
              !coachSlot?.slotId ||
              !hasQuota ||
              participants < 1 ||
              participants > 100 ||
              !Number.isInteger(participants) ||
              available.isFetching
            }
            onClick={() => {
              if (wallet && coachSlot?.slotId)
                onChange(session, {
                  walletId: wallet.id,
                  courtSlotId: session.slotId,
                  coachSlotId: coachSlot.slotId,
                  participants
                });
            }}
          >
            Gunakan paket
          </Button>
        )}
      </div>
      {wallet && (
        <div className="text-muted-foreground mt-3 space-y-1 text-xs">
          <p>
            Harga lapangan paket {formatCurrency(wallet.courtHourlyShare)}/jam · sudah dibayar.
            Tambahan peserta:{' '}
            {formatCurrency(Math.max(0, participants - 1) * wallet.extraParticipantHourlyPrice)}.
          </p>
          {!choice &&
            (available.isError ? (
              <p role="alert">
                Ketersediaan coach belum dapat dimuat.{' '}
                <button
                  type="button"
                  className="underline"
                  onClick={() => void available.refetch()}
                >
                  Coba lagi
                </button>
              </p>
            ) : available.isFetching ? (
              <p>Memeriksa jadwal coach…</p>
            ) : !coachSlot ? (
              <p>Coach paket tidak tersedia pada jam ini.</p>
            ) : !hasQuota ? (
              <p>Sisa kuota tidak cukup untuk pilihan jam ini.</p>
            ) : null)}
        </div>
      )}
    </div>
  );
}
