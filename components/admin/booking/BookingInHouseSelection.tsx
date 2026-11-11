'use client';
import { type TariffRule } from '@/lib/tariff-period';
import type { CoachingPerson } from '@/api/admin/coaching';
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
import { Check, CheckCircle2, UserRound, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminInHousePricing } from '@/lib/admin-inhouse-pricing';
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
  coaches = [],
  tariffRules = [],
  sessions,
  selected,
  onChange,
  disabled,
  active = true,
  embedded = false
}: {
  wallets: InHouseWallet[];
  plans?: InHousePlan[];
  coaches?: CoachingPerson[];
  tariffRules?: TariffRule[];
  sessions: BookingItem[];
  selected: InHouseChoice[];
  onChange: (session: BookingItem, choice: InHouseChoice | null) => void;
  disabled?: boolean;
  active?: boolean;
  embedded?: boolean;
}) {
  const [sessionId, setSessionId] = useState('');
  const currentSession = sessions.find((session) => session.slotId === sessionId) ?? sessions[0];
  if (!wallets.length && !plans.length && !coaches.length) return null;
  return (
    <section
      aria-label="Paket coach in-house"
      className={embedded ? 'space-y-4' : 'space-y-4 rounded-md p-4 sm:p-5'}
    >
      <div>
        <h3 className="font-semibold">Coach In-house</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Pilih jam bermain, pilih coach, lalu terapkan. Ulangi untuk setiap jam yang membutuhkan
          coach.
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
          sessions={sessions}
          wallets={wallets}
          plans={plans}
          coaches={coaches}
          tariffRules={tariffRules}
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
  sessions,
  wallets,
  plans,
  coaches,
  tariffRules,
  selected,
  onChange,
  disabled,
  active
}: {
  session: BookingItem;
  sessions: BookingItem[];
  wallets: InHouseWallet[];
  plans: InHousePlan[];
  coaches: CoachingPerson[];
  tariffRules: TariffRule[];
  selected: InHouseChoice[];
  onChange: (session: BookingItem, choice: InHouseChoice | null) => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const choice = selected.find((s) => s.courtSlotId === session.slotId);
  const [walletId, setWalletId] = useState(
    choice?.staffId
      ? `staff:${choice.staffId}`
      : choice?.planId
        ? `plan:${choice.planId}`
        : (choice?.walletId ?? '')
  );
  const [mode, setMode] = useState<'single' | 'package'>(
    choice?.walletId || (!coaches.length && !plans.length) ? 'package' : 'single'
  );
  const [participants, setParticipants] = useState(choice?.participants ?? 1);
  const plan = plans.find((p) => `plan:${p.id}` === walletId);
  const wallet = wallets.find((w) => w.id === walletId) ?? plan;
  const directCoach = coaches.find((coach) => `staff:${coach.id}` === walletId);
  const prepaid = !plan && !directCoach;
  const { branchId } = useAdminCourtSports();
  const available = useQuery(
    coachAvailabilityOptions(
      branchId,
      session,
      session.sport ?? 'PADEL',
      !!(wallet || directCoach) && (active || !!choice) && !disabled
    )
  );
  const coachSlot = !available.isError
    ? available.data?.find(
        (c) =>
          c.coach.id === (directCoach?.id ?? wallet?.staffId) &&
          (!directCoach || c.coach.isInHouseCoach === true)
      )
    : undefined;
  const coachAlreadySelected =
    !!coachSlot?.slotId &&
    selected.some(
      (item) => item.coachSlotId === coachSlot.slotId && item.courtSlotId !== session.slotId
    );
  const usedMinutes =
    selected.filter((s) => s.walletId === walletId && s.courtSlotId !== session.slotId).length * 60;
  const hasQuota =
    !!(wallet || directCoach) &&
    (!prepaid ||
      (wallet && 'remainingMinutes' in wallet && wallet.remainingMinutes - usedMinutes >= 60));
  const choose = (id: string) => {
    if (id === walletId) return;
    setWalletId(id);
    if (choice) onChange(session, null);
  };
  const draft: InHouseChoice | null =
    coachSlot?.slotId && (wallet || directCoach)
      ? {
          ...(directCoach
            ? {
                staffId: directCoach.id,
                hourlyPrice: coachSlot.price,
                additionalHourPrice: coachSlot.additionalHourPrice
              }
            : plan
              ? { planId: plan.id }
              : { walletId: wallet!.id }),
          courtSlotId: session.slotId,
          coachSlotId: coachSlot.slotId,
          participants:
            Number.isInteger(participants) && participants >= 1 && participants <= 100
              ? participants
              : 1
        }
      : null;
  const previous = selected.filter((item) => {
    const other = sessions.find((entry) => entry.slotId === item.courtSlotId);
    return other && `${other.date} ${other.timeSlot}` < `${session.date} ${session.timeSlot}`;
  });
  const before = adminInHousePricing(sessions, previous, plans, wallets, tariffRules);
  const after = adminInHousePricing(
    sessions,
    draft ? [...previous, draft] : previous,
    plans,
    wallets,
    tariffRules
  );
  const courtBase = (session.discountPrice ?? 0) > 0 ? session.discountPrice! : session.price;
  const courtDue = courtBase - (after.coverage - before.coverage);
  const coachDue = after.singleTotal - before.singleTotal;
  const extraDue = after.extras - before.extras;
  const options =
    mode === 'single'
      ? [
          ...coaches.map((coach) => ({
            id: `staff:${coach.id}`,
            name: coach.name,
            description: 'Coach in-house · bayar per sesi'
          })),
          ...plans
            .filter((item) => !coaches.some((coach) => coach.id === item.staffId))
            .map((item) => ({
              id: `plan:${item.id}`,
              name: item.staff.name,
              description: `${formatCurrency(item.hourlyPrice)}/jam · tarif dasar`
            }))
        ]
      : wallets.map((item) => ({
          id: item.id,
          name: item.staff.name,
          description: `${item.packageName} · sisa ${item.remainingMinutes / 60} jam`
        }));
  const canApply =
    !!draft &&
    !coachAlreadySelected &&
    !!hasQuota &&
    Number.isInteger(participants) &&
    participants >= 1 &&
    participants <= 100 &&
    !available.isPending &&
    !disabled;
  return (
    <div className="space-y-5 rounded-xl border p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <p className="text-muted-foreground text-xs">Coach untuk jam ini</p>
          <p className="mt-1 font-semibold">{session.timeSlot}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {session.courtName} · {serviceSessionDate(session.date)}
          </p>
        </div>
        {choice ? (
          <span
            role="status"
            className="bg-primary/10 text-primary flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
          >
            <CheckCircle2 className="size-4" /> Coach sudah diterapkan
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">Belum ada coach dipilih</span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Cara memilih coach">
        {(
          [
            {
              value: 'single',
              title: 'Coach satuan',
              detail: 'Bayar per jam, tanpa membeli paket',
              Icon: UserRound
            },
            {
              value: 'package',
              title: 'Paket customer',
              detail: wallets.length
                ? 'Gunakan kuota paket yang sudah dibayar'
                : 'Customer belum memiliki paket yang dapat digunakan',
              Icon: Wallet
            }
          ] as const
        ).map(({ value, title, detail, Icon }) => (
          <button
            type="button"
            key={value}
            aria-pressed={mode === value}
            disabled={disabled}
            onClick={() => {
              if (mode !== value) {
                setMode(value);
                choose('');
              }
            }}
            className={cn(
              'focus-visible:outline-primary flex items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 disabled:opacity-50',
              mode === value ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="text-muted-foreground mt-1 block text-xs">{detail}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold">
          {mode === 'single' ? 'Pilih coach satuan' : 'Pilih paket customer'}
        </p>
        <div
          className="grid gap-2 sm:grid-cols-2"
          role="group"
          aria-label={mode === 'single' ? 'Daftar coach satuan' : 'Daftar paket customer'}
        >
          {options.map((option) => (
            <button
              type="button"
              key={option.id}
              disabled={disabled}
              aria-pressed={walletId === option.id}
              onClick={() => choose(option.id)}
              className={cn(
                'focus-visible:outline-primary flex items-center justify-between gap-3 rounded-lg border p-4 text-left transition-colors focus-visible:outline-2 disabled:opacity-50',
                walletId === option.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/40 hover:bg-muted/30'
              )}
            >
              <span>
                <span className="block text-sm font-medium">{option.name}</span>
                <span className="text-muted-foreground mt-1 block text-xs">
                  {option.description}
                </span>
              </span>
              {walletId === option.id && <Check className="text-primary size-4 shrink-0" />}
            </button>
          ))}
        </div>
        {!options.length && (
          <p className="text-muted-foreground bg-muted/30 rounded-lg p-4 text-sm">
            {mode === 'package'
              ? 'Belum ada kuota paket yang bisa digunakan. Pilih Coach satuan untuk booking tanpa paket.'
              : 'Belum ada coach satuan yang tersedia untuk olahraga ini.'}
          </p>
        )}
      </div>
      {(wallet || directCoach) && (
        <div className="bg-muted/30 grid gap-4 rounded-lg p-4 sm:grid-cols-[120px_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label htmlFor={`participants-${session.slotId}`}>Jumlah peserta</Label>
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
            {(!Number.isInteger(participants) || participants < 1 || participants > 100) && (
              <p role="alert" className="text-destructive text-xs">
                Isi 1–100 peserta.
              </p>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Biaya untuk jam ini</p>
            {available.isError ? (
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
              <p role="status" className="text-muted-foreground">
                Memeriksa jadwal dan tarif coach…
              </p>
            ) : !coachSlot ? (
              <p role="status" className="text-muted-foreground">
                Coach tidak tersedia pada jam ini. Pilih coach atau jam lain.
              </p>
            ) : (
              <>
                <dl className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Lapangan</dt>
                    <dd className="font-medium">
                      {prepaid ? 'Termasuk paket' : formatCurrency(courtDue)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Coach · 1 jam</dt>
                    <dd className="font-medium">
                      {prepaid ? 'Kuota 1 jam' : formatCurrency(coachDue)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Tambahan peserta</dt>
                    <dd className="font-medium">{formatCurrency(extraDue)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t pt-2">
                    <dt className="font-semibold">
                      {prepaid ? 'Tambahan pembayaran' : 'Total sesi ini'}
                    </dt>
                    <dd className="text-primary font-semibold">
                      {formatCurrency(coachDue + extraDue + (prepaid ? 0 : courtDue))}
                    </dd>
                  </div>
                </dl>
                {prepaid && (
                  <p className="text-muted-foreground text-xs">
                    Kuota 1 jam dipotong dari paket customer.
                  </p>
                )}
                {directCoach && coachSlot.additionalHourPrice != null && (
                  <p className="text-muted-foreground text-xs">
                    Jam lanjutan berurutan dengan coach yang sama:{' '}
                    {formatCurrency(coachSlot.additionalHourPrice)}/jam. Pilih juga coach pada jam
                    berikutnya.
                  </p>
                )}
              </>
            )}
            {coachAlreadySelected && (
              <p role="alert" className="text-destructive">
                Coach sudah dipilih untuk lapangan lain pada jam ini.
              </p>
            )}
            {!hasQuota && (
              <p role="alert" className="text-destructive">
                Sisa kuota tidak cukup untuk pilihan jam ini.
              </p>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          {choice
            ? `Coach tersimpan untuk ${session.timeSlot}. Pilih jam lain di atas untuk menambahkan sesi.`
            : 'Pilihan berlaku untuk 1 jam bermain yang sedang dibuka.'}
        </p>
        {choice ? (
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => {
              onChange(session, null);
              setWalletId('');
            }}
          >
            Hapus coach dari jam ini
          </Button>
        ) : (
          <Button
            disabled={!canApply}
            onClick={() => {
              if (draft) onChange(session, draft);
            }}
          >
            {mode === 'single' ? 'Terapkan coach ke jam ini' : 'Gunakan paket untuk jam ini'}
          </Button>
        )}
      </div>
    </div>
  );
}
