'use client';
import { useState } from 'react';
import BookingServiceSessionPicker, { serviceSessionDate } from './BookingServiceSessionPicker';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { coachAvailabilityOptions } from '@/queries/admin/bookingService';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import type { BookingItem } from '@/stores/useBookingStore';
import type { InHouseChoice, InHouseWallet, InHousePlan } from '@/api/admin/inhouseCoaching';
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
  plans = [],
  sessions,
  selected,
  onChange,
  disabled,
  active = true,
  embedded = false
}: {
  wallets: InHouseWallet[];
  plans?: InHousePlan[];
  sessions: BookingItem[];
  selected: InHouseChoice[];
  onChange: (session: BookingItem, choice: InHouseChoice | null) => void;
  disabled?: boolean;
  active?: boolean;
  embedded?: boolean;
}) {
  const [sessionId, setSessionId] = useState('');
  const currentSession = sessions.find((session) => session.slotId === sessionId) ?? sessions[0];
  if (!wallets.length && !plans.length) return null;
  return (
    <section
      aria-label="Paket coach in-house"
      className={embedded ? 'space-y-4' : 'space-y-4 rounded-md p-4 sm:p-5'}
    >
      <div>
        <h3 className="font-semibold">Coach In-house</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Pilih coaching satuan atau gunakan kuota customer untuk jam bermain yang dipilih.
        </p>
      </div>
      <BookingServiceSessionPicker
        value={currentSession?.slotId ?? ''}
        onChange={setSessionId}
        disabled={disabled}
        sessions={sessions.map((session) => ({
          ...session,
          id: session.slotId,
          selected: selected.some((choice) => choice.courtSlotId === session.slotId)
        }))}
      />
      {(currentSession ? [currentSession] : []).map((session) => (
        <InHouseSession
          key={session.slotId}
          session={session}
          wallets={wallets}
          plans={plans}
          selected={selected}
          onChange={onChange}
          disabled={disabled}
          active={active}
        />
      ))}
    </section>
  );
}
function InHouseSession({
  session,
  wallets,
  plans,
  selected,
  onChange,
  disabled,
  active
}: {
  session: BookingItem;
  wallets: InHouseWallet[];
  plans: InHousePlan[];
  selected: InHouseChoice[];
  onChange: (session: BookingItem, choice: InHouseChoice | null) => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const choice = selected.find((s) => s.courtSlotId === session.slotId);
  const [walletId, setWalletId] = useState(
    choice?.planId ? `plan:${choice.planId}` : (choice?.walletId ?? '')
  );
  const [participants, setParticipants] = useState(choice?.participants ?? 1);
  const plan = plans.find((p) => `plan:${p.id}` === walletId);
  const wallet = wallets.find((w) => w.id === walletId) ?? plan;
  const prepaid = !plan;
  const { branchId } = useAdminCourtSports();
  const available = useQuery(
    coachAvailabilityOptions(
      branchId,
      session,
      session.sport ?? 'PADEL',
      !!wallet && (active || !!choice) && !disabled
    )
  );
  const coachSlot = !available.isError
    ? available.data?.find((c) => c.coach.id === wallet?.staffId)
    : undefined;
  const coachAlreadySelected =
    !!coachSlot?.slotId &&
    selected.some(
      (item) => item.coachSlotId === coachSlot.slotId && item.courtSlotId !== session.slotId
    );
  const usedMinutes =
    selected.filter((s) => s.walletId === walletId && s.courtSlotId !== session.slotId).length * 60;
  const hasQuota =
    !!wallet &&
    (!prepaid || ('remainingMinutes' in wallet && wallet.remainingMinutes - usedMinutes >= 60));
  return (
    <div className="rounded-md p-1 sm:p-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {session.courtName} · {serviceSessionDate(session.date)} · {session.timeSlot}
        </p>
        {choice && (
          <span className="text-primary text-xs font-medium">
            {choice.planId ? 'Coaching satuan 1 jam dipilih' : 'Kuota 1 jam dipilih'}
          </span>
        )}
      </div>
      <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_88px]">
        <div className="grid min-w-0 gap-2">
          <Label htmlFor={`wallet-${session.slotId}`}>
            {plans.length ? 'Coaching satuan / paket' : 'Paket customer'}
          </Label>
          <SearchableSelect
            className="bg-muted/30 h-11 rounded-md border-0 shadow-none"
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
              ...plans.map((plan) => ({
                value: `plan:${plan.id}`,
                label: `${plan.staff.name} · Coaching satuan`,
                description: `${formatCurrency(plan.hourlyPrice)}/jam · tarif dasar`
              })),
              ...wallets.map((wallet) => ({
                value: wallet.id,
                label: `${wallet.staff.name} · ${wallet.packageName}`,
                description: `Sisa ${wallet.remainingMinutes / 60} jam`
              }))
            ]}
          />
        </div>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor={`participants-${session.slotId}`}>Peserta</Label>
          <Input
            id={`participants-${session.slotId}`}
            className="bg-muted/30 h-11 rounded-md border-0 shadow-none"
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
        <div className="flex justify-end sm:col-span-2">
          {choice ? (
            <Button
              variant="secondary"
              className="rounded-md border-0 shadow-none"
              disabled={disabled}
              onClick={() => onChange(session, null)}
            >
              Batal gunakan
            </Button>
          ) : (
            <Button
              className="rounded-md border-0 shadow-none"
              disabled={
                disabled ||
                !coachSlot?.slotId ||
                coachAlreadySelected ||
                !hasQuota ||
                participants < 1 ||
                participants > 100 ||
                !Number.isInteger(participants) ||
                available.isPending
              }
              onClick={() => {
                if (wallet && coachSlot?.slotId)
                  onChange(session, {
                    ...(plan ? { planId: plan.id } : { walletId: wallet.id }),
                    courtSlotId: session.slotId,
                    coachSlotId: coachSlot.slotId,
                    participants
                  });
              }}
            >
              {plan ? 'Pilih coaching satuan' : 'Gunakan paket'}
            </Button>
          )}
        </div>
      </div>
      {wallet && (
        <div className="text-muted-foreground mt-4 space-y-2 border-t pt-3 text-xs leading-relaxed">
          <p>
            {plan
              ? `Coaching satuan ${formatCurrency(plan.hourlyPrice)}/jam, termasuk lapangan ${formatCurrency(plan.courtHourlyShare)}. `
              : `Harga lapangan paket ${formatCurrency(wallet.courtHourlyShare)}/jam · sudah dibayar. `}
            Biaya lapangan akhir mengikuti aturan tarif pada tanggal bermain dan ringkasan booking.
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
            ) : available.isPending ? (
              <p>Memeriksa jadwal coach…</p>
            ) : !coachSlot ? (
              <p>Coach paket tidak tersedia pada jam ini.</p>
            ) : coachAlreadySelected ? (
              <p>Coach sudah dipilih untuk lapangan lain pada jam ini.</p>
            ) : !hasQuota ? (
              <p>Sisa kuota tidak cukup untuk pilihan jam ini.</p>
            ) : null)}
        </div>
      )}
    </div>
  );
}
